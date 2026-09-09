'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const swc = require('next/dist/build/swc');
const root = path.resolve(__dirname, '../../..');

// Execute the real JSX component and its handlers with deterministic hooks.
// Browser focus/layout are deliberately outside these local unit tests.
function hooks() {
    const states = [], refs = [], effects = [];
    let stateIndex = 0, refIndex = 0;
    return {
        reset() { stateIndex = 0; refIndex = 0; effects.length = 0; }, effects,
        react: {
            useState(initial) { const i = stateIndex++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
            useRef(initial) { const i = refIndex++; return refs[i] ||= { current: initial }; },
            useMemo: fn => fn(), useCallback: fn => fn,
            useEffect: fn => { effects.push(fn); }, useLayoutEffect: () => {},
            lazy: () => 'lazy-component', Suspense: 'suspense',
        },
    };
}

async function loadComponent(file, mocks, globals = {}, extra = '') {
    const filename = path.join(root, file);
    await swc.loadBindings();
    const output = await swc.transform(fs.readFileSync(filename, 'utf8') + extra, {
        filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2020' }, module: { type: 'commonjs' },
    });
    const exports = {};
    vm.runInNewContext(output.code, {
        exports, module: { exports }, process: { env: {} }, console,
        require(name) {
            if (name === 'react/jsx-runtime') return require(name);
            if (Object.hasOwn(mocks, name)) return mocks[name];
            if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => String(key) });
            if (name.endsWith('orderReference.cjs')) return require(path.join(root, 'shared/orderReference.cjs'));
            throw new Error(`Unmocked import: ${name}`);
        }, ...globals,
    }, { filename });
    return exports;
}

function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props?.children)];
}

test('invoice PDF saves edits to an existing draft first, and issued fields are disabled for keyboard users', async () => {
    for (const status of ['draft', 'issued']) {
        const state = hooks(), calls = [];
        const initialInvoice = { invoiceId: 'invoice-existing', version: 2, status, seller: {}, customer: { firstName: 'Initial', email: 'client@example.test' }, lines: [], issueDate: '2026-09-07' };
        const component = await loadComponent('src/kit/admin/AdminInvoices.jsx', {
            react: state.react, 'next/image': 'image', './adminDataCache': {},
            '../config/firebaseLazy': { getCallableFunction: async name => async payload => {
                calls.push({ name, payload });
                return name === 'saveManualInvoiceDraftAdmin'
                    ? { data: { invoice: { ...payload.invoice, version: 3 } } }
                    : { data: { document: { contentBase64: 'cGRm', filename: 'local.pdf' } } };
            } },
        }, { window: { clearTimeout() {}, setTimeout() {}, atob: value => Buffer.from(value, 'base64').toString('binary') }, URL: { createObjectURL: () => 'blob:local', revokeObjectURL() {} }, Blob,
            document: { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } },
        }, '\nexport { Editor };');
        const props = { initialInvoice, onSaved() {}, onBack() {}, onSent() {} };
        const render = () => { state.reset(); return nodes(component.Editor(props)); };
        let tree = render();
        assert.equal(tree.find(node => node.type === 'fieldset').props.disabled, status === 'issued');
        if (status === 'draft') tree.find(node => node.props?.autoComplete === 'given-name').props.onChange({ target: { value: 'Modifié' } });
        tree = render();
        await tree.find(node => node.type === 'button' && node.props.onClick?.name === 'download').props.onClick();
        assert.deepEqual(calls.map(call => call.name), status === 'draft' ? ['saveManualInvoiceDraftAdmin', 'prepareManualInvoicePdfAdmin'] : ['prepareManualInvoicePdfAdmin']);
        if (status === 'draft') assert.equal(calls[0].payload.invoice.customer.firstName, 'Modifié');
    }
});

test('checkout locks submitted coordinates during preparation and after reservation, including handler calls', async () => {
    const state = hooks();
    const form = { fullName: 'Client local', email: 'client@example.test', phone: '0600000000', address: 'Adresse initiale', city: 'Marseille', zip: '13001', country: 'France', deliveryMode: 'retrait' };
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const recovery = await import('../../../src/kit/commerce/checkoutRecovery.js');
    const component = await loadComponent('src/kit/commerce/CheckoutView.jsx', {
        react: state.react, 'react-dom': { createPortal: node => node }, 'framer-motion': { motion: { button: 'motion-button' } },
        '../config/firebase': {}, '../config/functionTargets': {}, '../config/constants': { legalLinks: { terms: '/cgv', privacy: '/privacy' } },
        'firebase/functions': {}, 'firebase/firestore': {}, '../ui/Toast': { useToast: () => () => {} },
        './purchasability': await import('../../../src/kit/commerce/purchasability.js'),
        '../shared/clientPerf': { startClientPerf: () => 0, logClientPerf: () => {} },
        './commerceV2Client': { COMMERCE_V2_CONSUMERS_ENABLED: true, ensureCheckoutAnonymousIdentity: async () => ({ uid: 'owner-audit-0001' }), createCheckoutV2: () => pending },
        './checkoutContract': await import('../../../src/kit/commerce/checkoutContract.js'),
        './deliveryEligibility': await import('../../../src/kit/commerce/deliveryEligibility.js'),
        './checkoutRequestIdentity': { getCheckoutRequestIdentity: async () => 'checkout-audit-0001', clearCheckoutRequestIdentity() {} },
        './commerceCommandClient': {}, './CancellationConfirmation': { useCancellationConfirmation: () => ({}) },
        './checkoutController': await import('../../../src/kit/commerce/checkoutController.js'),
        './checkoutRecovery': { ...recovery, writeCheckoutRecoveryDescriptor() {} },
    }, { window: { sessionStorage: { getItem: () => JSON.stringify(form) } } });
    const props = { cartItems: [{ id: 'piece-audit', name: 'Pièce', price: 10, quantity: 1, cartLineId: 'cart-line-audit-0001', cartRevision: 1 }], user: { uid: 'owner-audit-0001', email: form.email, emailVerified: true } };
    const render = () => { state.reset(); return nodes(component.default(props)); };
    let tree = render();
    tree.find(n => n.props?.id === 'checkout-terms').props.onChange({ target: { checked: true } });
    tree = render();
    const action = tree.find(n => typeof n.type === 'function' && n.type.name === 'PremiumActionBtn');
    const operation = action.props.onClick();
    await new Promise(resolve => setImmediate(resolve));
    for (const phase of ['preparing', 'reserved']) {
        if (phase === 'reserved') { finish({ orderId: 'order-audit-0001', totalCents: 1000, shippingCents: 0, discountCents: 0, clientSecret: 'test-only', providerStatus: 'requires_payment_method' }); await operation; }
        tree = render();
        assert.equal(tree.find(n => n.type === 'fieldset').props.disabled, true, phase);
        tree.find(n => n.props?.id === 'checkout-address').props.onChange({ target: { name: 'address', value: 'Autre adresse' } });
        tree.find(n => n.props?.['aria-pressed'] === true).props.onClick();
        tree = render();
        assert.equal(tree.find(n => n.props?.id === 'checkout-address').props.value, form.address);
        assert.equal(tree.find(n => n.type === 'fieldset').props.disabled, true);
    }
});

test('Stripe return targets its order even when another tab replaced the recovery descriptor', async () => {
    const { resolveStripeReturnTarget } = await import('../../../src/kit/commerce/checkoutRecovery.js');
    const descriptor = { orderId: 'order-tab-b', cartLines: [{ cartLineId: 'line-b', cartRevision: 1 }] };
    assert.deepEqual(resolveStripeReturnTarget('order-tab-a', descriptor), { orderId: 'order-tab-a', cartLines: [] });
    assert.deepEqual(resolveStripeReturnTarget('order-tab-b', descriptor), descriptor);
});

test('closing the document before its response prevents a leaked PDF object URL', async () => {
    const state = hooks();
    let finish, urls = 0;
    const response = new Promise(resolve => { finish = resolve; });
    const component = await loadComponent('src/kit/commerce/CommerceDocumentModal.jsx', {
        react: state.react, 'react-dom': { createPortal: node => node },
        './commerceV2Client': { prepareCommerceDocumentDelivery: () => response },
    }, { document: { body: {} }, navigator: {}, URL: { createObjectURL() { urls++; } } });
    component.default({ entry: { order: { id: 'order-a' }, document: { documentId: 'doc-a' } } });
    const dispose = state.effects[0]();
    dispose();
    finish({ document: { contentBase64: 'cGRm' } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(urls, 0);
});

test('refund display uses confirmed plus pending amounts and does not invent a refund for a payment incident', async () => {
    const file = fs.readFileSync(path.join(root, 'src/kit/commerce/MyOrdersView.jsx'), 'utf8');
    const pick = (start, end) => file.slice(file.indexOf(start), file.indexOf(end));
    const api = vm.runInNewContext(`${pick('const getOrderTotal =', 'const getItemImage =')}\n${pick('const getRefundHelpText =', 'const getInitials =')}\n({ getRefundAmount, getRefundHelpText })`);
    const order = { schemaVersion: 2, total: 100, status: 'refund_pending', amounts: { refundedCents: 2000 }, refundAggregate: { pendingCents: 1000, status: 'pending' } };
    assert.equal(api.getRefundAmount(order), 30);
    assert.equal(api.getRefundAmount({ ...order, amounts: {} }), null);
    assert.equal(api.getRefundHelpText({ ...order, status: 'needs_review', refundAggregate: { status: 'none' } }), '');
    assert.match(api.getRefundHelpText({ ...order, status: 'paid', refundAggregate: { status: 'partial' } }), /partiel/);
});

test('the decorative login video is absent on mobile and with reduced motion, including after resizing', async () => {
    const state = hooks();
    let sync;
    const desktop = { matches: false, addEventListener: (_, fn) => { sync = fn; }, removeEventListener() {} };
    const reduced = { ...desktop };
    const component = await loadComponent('src/kit/auth/LoginBackgroundVideo.jsx', { react: state.react }, {
        window: { matchMedia: query => query.includes('min-width') ? desktop : reduced },
    });
    const render = () => { state.reset(); return nodes(component.LoginBackgroundVideo({})); };
    assert.equal(render().some(n => n.type === 'video'), false);
    state.effects[0]();
    assert.equal(render().some(n => n.type === 'video'), false);
    desktop.matches = true; sync();
    assert.equal(render().some(n => n.type === 'video'), true);
    reduced.matches = true; sync();
    assert.equal(render().some(n => n.type === 'video'), false);
});

test('a failed route navigation cannot leave the decorative curtain blocking the page indefinitely', async () => {
    const state = hooks();
    const timers = new Map(), listeners = new Map();
    let timerId = 0;
    const component = await loadComponent('app/RouteTransitionIsland.jsx', {
        react: state.react,
        'next/navigation': { useRouter: () => ({ push() {}, prefetch() {} }), usePathname: () => '/checkout' },
        './route-transition.config': await import('../../../app/route-transition.config.js'),
    }, {
        URL, CustomEvent: class {},
        window: { location: { href: 'https://site.example/checkout', origin: 'https://site.example' }, performance: { now: () => 0 }, matchMedia: () => ({ matches: false }), dispatchEvent() {},
            setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, clearTimeout: id => timers.delete(id) },
        document: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener() {} },
    });
    component.default(); state.effects[0]();
    listeners.get('click')({ button: 0, preventDefault() {}, target: { closest: () => ({ getAttribute: key => key === 'href' ? '/' : null, hasAttribute: () => false }) } });
    state.reset(); assert.ok(component.default());
    const deadline = [...timers.values()].find(timer => timer.ms === 10000);
    assert.ok(deadline); deadline.fn();
    state.reset(); assert.equal(component.default(), null);
});

test('menu navigation requests use the video curtain and leave unsupported destinations to Next', async () => {
    const state = hooks();
    const listeners = new Map(), timers = [], navigations = [], warmups = [];
    const component = await loadComponent('app/RouteTransitionIsland.jsx', {
        react: state.react,
        'next/navigation': { useRouter: () => ({ push: href => navigations.push(href), prefetch() {} }), usePathname: () => '/' },
        './route-transition.config': await import('../../../app/route-transition.config.js'),
    }, {
        URL, CustomEvent: class {},
        window: { location: { href: 'https://site.example/', origin: 'https://site.example' }, performance: { now: () => 0 }, matchMedia: () => ({ matches: false }), dispatchEvent() {},
            setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {} },
        document: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
            createElement: () => ({ load() { warmups.push(this.src); } }) },
    });
    component.default();
    const cleanup = state.effects[0]();
    const request = href => {
        const event = { detail: { href }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
        listeners.get('sv:route-transition-request')(event);
        return event;
    };
    for (const href of ['/', '/devis', 'https://other.example/a-propos']) {
        assert.equal(request(href).defaultPrevented, false);
    }
    assert.equal(request('/a-propos').defaultPrevented, true);
    assert.deepEqual(navigations, []);
    assert.deepEqual(warmups, ['/video/hero/1-wood-buffet.mp4']);
    state.reset();
    assert.ok(component.default());
    timers.find(timer => timer.ms === 900).fn();
    assert.deepEqual(navigations, ['/a-propos']);
    cleanup();
    assert.equal(listeners.has('sv:route-transition-request'), false);
});

test('a private payment link keeps verification visible after its bounded poll ends', async () => {
    const state = hooks();
    const component = await loadComponent('app/payer/[orderId]/[token]/PaymentLinkPageIsland.jsx', {
        react: state.react, '@stripe/react-stripe-js': {}, 'next/link': 'link',
        '../../../../src/kit/commerce/CheckoutPaymentStep': 'payment-step',
        '../../../../src/kit/commerce/adminPaymentLinkClient': { getAdminPaymentLinkPublic: async () => ({ status: 'payment_in_progress', items: [] }) },
        '../../../../src/kit/config/stripe': { isStripeConfigured: true },
    });
    const render = () => { state.reset(); return nodes(component.default({ orderId: 'order-local', token: 'test-only' })); };
    render(); state.effects[0]();
    await new Promise(resolve => setImmediate(resolve));
    const tree = render();
    assert.equal(tree.some(n => n.type === 'form' || n.type === 'payment-step'), false);
    assert.ok(tree.some(n => n.type === 'button' && n.props.children === 'Vérifier à nouveau'));
});
