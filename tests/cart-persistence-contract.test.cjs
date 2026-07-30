'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repositoryRoot = path.resolve(__dirname, '..');
const source = (relativePath) => fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

test('product detail waits for the durable cart result before confirming the item', () => {
  const actions = source('src/kit/marketplace/ProductDetailActionsIsland.jsx');
  const cartPanel = source('src/kit/marketplace/CartPanelIsland.jsx');
  const guestCart = source('src/kit/commerce/guestCart.js');

  assert.ok(guestCart.includes("CART_ITEM_ADD_RESULT_EVENT = 'sv:cart-item-add-result'"));
  assert.ok(actions.includes("setCartStatus('adding')"));
  assert.ok(actions.includes('event.detail?.success'));
  assert.ok(actions.includes("setCartStatus('error')"));
  assert.equal(actions.includes('\n    setIsInCart(true);\n    try {'), false);
  assert.ok(cartPanel.includes('const added = await addCartItem(item)'));
  assert.ok(cartPanel.includes('success: added'));
  assert.ok(cartPanel.includes('success: false'));
});

test('lazy cart handoff does not process an add event twice once the panel is mounted', () => {
  const lazyCartPanel = source('src/kit/marketplace/LazyCartPanelIsland.jsx');

  assert.ok(lazyCartPanel.includes("if (!CartPanel) ensureCartPanel('sv:product-added'"));
  assert.ok(lazyCartPanel.includes('}, [CartPanel, ensureCartPanel]);'));
});

test('paid checkout keeps the success confirmation visible after cart cleanup', () => {
  const checkoutPage = source('app/checkout/CheckoutPageIsland.jsx');

  assert.ok(checkoutPage.includes(
    'cartItems.length === 0 && !hasRecoverableCheckout && !showOrderSuccess'
  ));
  assert.ok(checkoutPage.includes('<OrderSuccessModal'));
});
