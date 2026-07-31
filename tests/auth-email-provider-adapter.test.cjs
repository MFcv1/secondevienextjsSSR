const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    createGmailEmailSender,
    createResendEmailSender,
    createTransactionalEmailSender
} = require('../functions/src/email/transactionalEmail');
const {
    buildEmailIdempotencyKey,
    createTransactionalEmailRuntime
} = require('../functions/src/email/transactionalEmailRuntime');
const {
    renderOtpEmail
} = require('../functions/src/email/otpEmailTemplates');

test('Gmail reste un adaptateur injectable et actif par defaut', async () => {
    let transportConfig = null;
    let sentMessage = null;
    const sender = createTransactionalEmailSender({
        gmail: {
            user: 'sender@example.test',
            password: 'not-a-real-secret',
            nodemailerImpl: {
                createTransport(config) {
                    transportConfig = config;
                    return {
                        async sendMail(message) {
                            sentMessage = message;
                            return { messageId: 'gmail-message-id' };
                        }
                    };
                }
            }
        }
    });

    const result = await sender.send({
        from: 'Seconde Vie <sender@example.test>',
        to: 'customer@example.test',
        subject: 'Test transactionnel',
        text: 'Contenu',
        raw: { path: 'ne-doit-jamais-etre-transmis' }
    });

    assert.equal(sender.provider, 'gmail');
    assert.equal(transportConfig.service, 'gmail');
    assert.equal(transportConfig.pool, true);
    assert.equal(transportConfig.disableFileAccess, true);
    assert.equal(transportConfig.disableUrlAccess, true);
    assert.equal(sentMessage.to, 'customer@example.test');
    assert.equal(sentMessage.raw, undefined);
    assert.deepEqual(result, { provider: 'gmail', id: 'gmail-message-id' });
});

test('Resend envoie le contrat API avec une cle idempotente', async () => {
    let request = null;
    const sender = createResendEmailSender({
        apiKey: 're_test_key',
        fetchImpl: async (url, options) => {
            request = { url, options };
            return {
                ok: true,
                status: 200,
                async json() {
                    return { id: 'resend-message-id' };
                }
            };
        }
    });

    const result = await sender.send({
        from: 'Seconde Vie <connexion@example.test>',
        to: 'customer@example.test',
        subject: 'Votre code',
        html: '<p>Code</p>',
        text: 'Code'
    }, {
        idempotencyKey: 'customer-login-otp/hash/123'
    });

    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(request.options.method, 'POST');
    assert.equal(request.options.headers.Authorization, 'Bearer re_test_key');
    assert.equal(request.options.headers['Idempotency-Key'], 'customer-login-otp/hash/123');
    assert.deepEqual(JSON.parse(request.options.body), {
        from: 'Seconde Vie <connexion@example.test>',
        to: 'customer@example.test',
        subject: 'Votre code',
        html: '<p>Code</p>',
        text: 'Code'
    });
    assert.deepEqual(result, { provider: 'resend', id: 'resend-message-id' });
});

test('Resend retente une seule fois une erreur temporaire avec la meme idempotence', async () => {
    const keys = [];
    let calls = 0;
    const sender = createResendEmailSender({
        apiKey: 're_test_key',
        sleep: async () => {},
        fetchImpl: async (_url, options) => {
            calls += 1;
            keys.push(options.headers['Idempotency-Key']);
            if (calls === 1) {
                return {
                    ok: false,
                    status: 503,
                    async json() {
                        return { name: 'temporarily_unavailable' };
                    }
                };
            }
            return {
                ok: true,
                status: 200,
                async json() {
                    return { id: 'retry-success' };
                }
            };
        }
    });

    const result = await sender.send({
        from: 'Seconde Vie <connexion@example.test>',
        to: 'customer@example.test',
        subject: 'Votre code',
        text: 'Code'
    }, {
        idempotencyKey: 'otp/stable-operation'
    });

    assert.equal(calls, 2);
    assert.deepEqual(keys, ['otp/stable-operation', 'otp/stable-operation']);
    assert.equal(result.id, 'retry-success');
});

test('Resend refuse un envoi sans cle idempotente', async () => {
    const sender = createResendEmailSender({
        apiKey: 're_test_key',
        fetchImpl: async () => {
            throw new Error('ne doit pas etre appele');
        }
    });

    await assert.rejects(
        sender.send({
            from: 'Seconde Vie <connexion@example.test>',
            to: 'customer@example.test',
            subject: 'Votre code',
            text: 'Code'
        }),
        (error) => error?.code === 'EMAIL_PROVIDER_CONFIG'
    );
});

test('les parcours OTP et commandes utilisent le meme runtime sans transport direct', () => {
    const root = path.join(__dirname, '..');
    for (const relativePath of [
        'functions/src/auth/customerLoginOtp.js',
        'functions/src/auth/guestCheckoutOtp.js',
        'functions/src/email/orderEmails.js'
    ]) {
        const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
        assert.match(source, /getTransactionalEmailRuntime/);
        assert.match(source, /TRANSACTIONAL_EMAIL_SECRETS/);
        assert.match(source, /idempotencyKey:/);
        assert.doesNotMatch(source, /require\(['"]nodemailer['"]\)/);
        assert.doesNotMatch(source, /\.sendMail\(/);
    }
});

test('le runtime conserve Gmail par configuration et prepare Resend sans fallback implicite', () => {
    const gmailRuntime = createTransactionalEmailRuntime({
        provider: 'gmail',
        gmailUser: 'sender@example.test',
        gmailPassword: 'not-a-real-secret',
        nodemailerImpl: {
            createTransport() {
                return { sendMail: async () => ({ messageId: 'gmail-runtime' }) };
            }
        }
    });
    assert.equal(gmailRuntime.provider, 'gmail');
    assert.equal(gmailRuntime.fromAddress, 'sender@example.test');

    const resendRuntime = createTransactionalEmailRuntime({
        provider: 'resend',
        resendApiKey: 're_test_key',
        resendFromEmail: 'connexion@example.test',
        fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ id: 'resend-runtime' }) })
    });
    assert.equal(resendRuntime.provider, 'resend');
    assert.equal(resendRuntime.fromAddress, 'connexion@example.test');

    assert.throws(
        () => createTransactionalEmailRuntime({ provider: 'resend', resendApiKey: 're_test_key', resendFromEmail: '' }),
        (error) => error?.code === 'EMAIL_PROVIDER_CONFIG'
    );
});

test('les cles idempotentes masquent les identifiants et restent stables', () => {
    const first = buildEmailIdempotencyKey('order-created-client', 'order-123', 'customer@example.test');
    const second = buildEmailIdempotencyKey('order-created-client', 'order-123', 'customer@example.test');

    assert.equal(first, second);
    assert.match(first, /^order-created-client\/[a-f0-9]{64}$/);
    assert.doesNotMatch(first, /order-123|customer@example\.test/);
    assert.ok(first.length <= 256);
});

test('les OTP connexion et checkout partagent le meme design premium sans melanger leur objet', () => {
    const login = renderOtpEmail({
        variant: 'login',
        code: '123456',
        siteUrl: 'https://sandbox.example.test'
    });
    const checkout = renderOtpEmail({
        variant: 'checkout',
        code: '654321',
        siteUrl: 'https://sandbox.example.test'
    });

    assert.match(login.subject, /connexion/);
    assert.match(checkout.subject, /commande/);
    assert.match(login.html, /Seconde Vie/);
    assert.match(checkout.html, /Seconde Vie/);
    assert.match(login.html, /123456/);
    assert.match(checkout.html, /654321/);
    assert.match(login.text, /Usage unique|utilisé qu’une seule fois/);
    assert.doesNotMatch(login.html, /654321/);
    assert.doesNotMatch(checkout.html, /123456/);
});

test('les performances Auth utilisent un log structure et une liste de champs bornee', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'functions/helpers/runtime.js'), 'utf8');
    assert.match(source, /firebase-functions\/logger/);
    assert.match(source, /logger\.info\(['"]function_perf['"]/);
    assert.match(source, /\['phase', 'emailHash', 'resumed', 'code', 'responseCode'\]/);
    assert.doesNotMatch(source, /console\.info\(['"]function_perf['"]/);
});

test('le constructeur Gmail direct conserve une erreur de configuration explicite', () => {
    assert.throws(
        () => createGmailEmailSender({ user: '', password: '' }),
        (error) => error?.code === 'EMAIL_PROVIDER_CONFIG'
    );
});
