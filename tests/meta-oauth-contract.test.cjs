'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    META_CAPTION_LIMIT,
    META_MEDIA_LIMIT,
    buildSocialCaption,
    createOAuthState,
    decryptToken,
    encryptToken,
    normalizeHashtags,
    normalizeInstagramProfileResponse,
    normalizeMediaUrls,
    normalizeTargets,
    parseAndVerifyOAuthState,
    publicConnectionState,
    publicInstagramConnectionState,
    publicationDocumentId,
    stablePayloadHash,
    stripStoryFormatting
} = require('../functions/src/integrations/metaContract');

const ENCRYPTION_SECRET = 'meta-test-secret-longer-than-thirty-two-characters';

test('OAuth state stores only a verifier hash and rejects tampering', () => {
    let call = 0;
    const deterministicRandom = (length) => Buffer.alloc(length, ++call);
    const created = createOAuthState(deterministicRandom);

    assert.match(created.stateId, /^[a-f0-9]{32}$/);
    assert.match(created.verifierHash, /^[a-f0-9]{64}$/);
    assert.equal(parseAndVerifyOAuthState(created.state, created.verifierHash)?.stateId, created.stateId);
    assert.equal(parseAndVerifyOAuthState(`${created.state}x`, created.verifierHash), null);
    assert.equal(parseAndVerifyOAuthState(created.state, '0'.repeat(64)), null);
});

test('Meta token encryption uses authenticated AES-GCM payloads', () => {
    const payload = encryptToken('page-access-token', ENCRYPTION_SECRET, () => Buffer.alloc(12, 7));
    assert.equal(payload.alg, 'aes-256-gcm');
    assert.equal(decryptToken(payload, ENCRYPTION_SECRET), 'page-access-token');
    assert.throws(() => decryptToken({ ...payload, value: `${payload.value.slice(0, -2)}AA` }, ENCRYPTION_SECRET));
    assert.throws(() => encryptToken('token', 'short-secret'), /META_ENCRYPTION_SECRET_TOO_SHORT/);
});

test('Social caption strips presentation syntax, normalizes hashtags and stays bounded', () => {
    const caption = buildSocialCaption({
        name: 'Commode provençale',
        description: '## Une seconde vie\n**Restaurée** avec ==fill:yellow|beaucoup de soin==. [Atelier](https://example.com)',
        hashtags: '#secondevie #artisanat #secondevie invalide'
    });

    assert.match(caption, /^Commode provençale\n\nUne seconde vie Restaurée avec beaucoup de soin\. Atelier/);
    assert.doesNotMatch(caption, /fill:yellow/);
    assert.match(caption, /#secondevie #artisanat$/);
    assert.equal(normalizeHashtags('#bois #bois bonjour #déco'), '#bois #déco');
    assert.ok(buildSocialCaption({ name: 'A', description: 'x'.repeat(3000), hashtags: '#atelier' }).length <= META_CAPTION_LIMIT);
    assert.equal(stripStoryFormatting('- Premier\n- Second'), 'Premier Second');
});

test('Media URLs keep only unique public HTTPS images and enforce the Instagram limit', () => {
    const source = [
        'http://example.com/insecure.jpg',
        ...Array.from({ length: 14 }, (_, index) => `https://cdn.example.com/${index}.jpg`),
        'https://cdn.example.com/0.jpg',
        'not-a-url'
    ];
    const urls = normalizeMediaUrls(source);
    assert.equal(urls.length, META_MEDIA_LIMIT);
    assert.equal(urls[0], 'https://cdn.example.com/0.jpg');
});

test('Targets require at least one explicit destination', () => {
    assert.deepEqual(normalizeTargets({ instagram: true, facebook: false }), { instagram: true, facebook: false });
    assert.throws(() => normalizeTargets({ instagram: false, facebook: false }), /META_TARGETS_EMPTY/);
    assert.throws(() => normalizeTargets(null), /META_TARGETS_INVALID/);
});

test('Publication idempotency is stable and payload changes are detectable', () => {
    const commandId = 'meta-publish-command-123456';
    assert.equal(publicationDocumentId(commandId), publicationDocumentId(commandId));
    const base = {
        productId: 'product-1',
        collectionName: 'furniture',
        targets: { instagram: true, facebook: true },
        hashtags: '#atelier'
    };
    assert.equal(stablePayloadHash(base), stablePayloadHash({ ...base }));
    assert.notEqual(stablePayloadHash(base), stablePayloadHash({ ...base, hashtags: '#autre' }));
});

test('Public connection state never exposes technical identifiers or encrypted tokens', () => {
    const state = publicConnectionState({
        status: 'connected',
        pageId: 'secret-page-id',
        pageName: 'Seconde Vie',
        instagramUserId: 'secret-instagram-id',
        instagramUsername: 'seconde_vie',
        encryptedPageAccessToken: { value: 'ciphertext' },
        scopes: ['pages_show_list', 'unexpected_scope']
    });

    assert.equal(state.connected, true);
    assert.equal(state.pageName, 'Seconde Vie');
    assert.equal(state.instagramUsername, 'seconde_vie');
    assert.deepEqual(state.scopes, ['pages_show_list']);
    assert.equal(state.tokenExpiresAtMillis, null);
    assert.equal('pageId' in state, false);
    assert.equal('instagramUserId' in state, false);
    assert.equal('encryptedPageAccessToken' in state, false);
});

test('Direct Instagram connection projection exposes only safe account metadata', () => {
    const state = publicInstagramConnectionState({
        status: 'connected',
        instagramUserId: 'private-instagram-id',
        instagramUsername: 'seconde_vie',
        instagramAccessToken: { value: 'ciphertext' },
        scopes: ['instagram_business_basic', 'unexpected_scope']
    });

    assert.equal(state.connected, true);
    assert.equal(state.provider, 'instagram_login');
    assert.equal(state.instagramAvailable, true);
    assert.equal(state.facebookAvailable, false);
    assert.deepEqual(state.scopes, ['instagram_business_basic']);
    assert.equal('instagramUserId' in state, false);
    assert.equal('instagramAccessToken' in state, false);
});

test('Instagram Login profile normalizes the current data envelope', () => {
    assert.deepEqual(normalizeInstagramProfileResponse({
        data: [{ user_id: '17841400000000000', username: 'xori_on' }]
    }, '17841400000000000'), {
        instagramUserId: '17841400000000000',
        instagramUsername: 'xori_on'
    });

    assert.deepEqual(normalizeInstagramProfileResponse({
        id: 'legacy-id',
        username: 'legacy_account'
    }), {
        instagramUserId: 'legacy-id',
        instagramUsername: 'legacy_account'
    });

    assert.deepEqual(normalizeInstagramProfileResponse({
        data: [{ user_id: 'other-id', username: 'xori_on' }]
    }, 'app-scoped-id'), {
        instagramUserId: 'other-id',
        instagramUsername: 'xori_on'
    });

    assert.throws(() => normalizeInstagramProfileResponse({}), /INSTAGRAM_PROFILE_MISSING/);
});
