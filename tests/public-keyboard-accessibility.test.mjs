import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { trapDialogTabKey } from '../src/kit/ui/dialogFocus.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readSource = (path) => readFile(resolve(rootDir, path), 'utf8');

const createFocusFixture = () => {
  const ownerDocument = { activeElement: null };
  const makeElement = (name) => ({
    name,
    getAttribute: () => null,
    closest: () => null,
    getClientRects: () => [{}],
    focus: () => {
      ownerDocument.activeElement = elements[name];
    },
  });
  const elements = {
    first: makeElement('first'),
    middle: makeElement('middle'),
    last: makeElement('last'),
  };
  const root = {
    ownerDocument,
    querySelectorAll: () => Object.values(elements),
    contains: (element) => Object.values(elements).includes(element),
    focus: () => {
      ownerDocument.activeElement = root;
    },
  };
  const makeEvent = ({ shiftKey = false } = {}) => ({
    key: 'Tab',
    shiftKey,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  });

  return { elements, makeEvent, ownerDocument, root };
};

test('shared dialog focus helper wraps Tab and Shift+Tab', () => {
  const fixture = createFocusFixture();
  fixture.ownerDocument.activeElement = fixture.elements.last;
  const forwardEvent = fixture.makeEvent();
  assert.equal(trapDialogTabKey(forwardEvent, fixture.root), true);
  assert.equal(forwardEvent.defaultPrevented, true);
  assert.equal(fixture.ownerDocument.activeElement, fixture.elements.first);

  fixture.ownerDocument.activeElement = fixture.elements.first;
  const backwardEvent = fixture.makeEvent({ shiftKey: true });
  assert.equal(trapDialogTabKey(backwardEvent, fixture.root), true);
  assert.equal(backwardEvent.defaultPrevented, true);
  assert.equal(fixture.ownerDocument.activeElement, fixture.elements.last);
});

test('product detail hides the dormant drawer and exposes both zoom targets to the keyboard', async () => {
  const shell = await readSource('src/kit/marketplace/ProductDetailShellIsland.jsx');
  assert.match(shell, /data-mobile-bottom-sheet[\s\S]*?aria-hidden=\{isMobilePanelOpen \? 'false' : 'true'\}[\s\S]*?inert=\{isMobilePanelOpen \? undefined : true\}/);
  assert.equal((shell.match(/role="button"/g) || []).length >= 2, true);
  assert.equal((shell.match(/onKeyDown=\{handleProductZoomKeyDown\}/g) || []).length, 2);
  assert.match(shell, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(shell, /inert=\{isLightboxOpen \? true : undefined\}/);
});

test('product lightbox establishes, traps, closes and restores focus', async () => {
  const lightbox = await readSource('src/kit/marketplace/ProductDetailLightboxIsland.jsx');
  assert.match(lightbox, /closeButtonRef\.current \|\| rootRef\.current/);
  assert.match(lightbox, /trapDialogTabKey\(event, rootRef\.current, rootRef\.current\)/);
  assert.match(lightbox, /event\.key === 'Escape'[\s\S]*?event\.preventDefault\(\)[\s\S]*?requestClose\(\)/);
  assert.match(lightbox, /previouslyFocusedRef\.current\?\.isConnected/);
  assert.match(lightbox, /ref=\{closeButtonRef\}[\s\S]{0,120}aria-label="Fermer le zoom"/);
});

test('category filter drawer behaves as a modal dialog', async () => {
  const [serverView, controls] = await Promise.all([
    readSource('src/kit/marketplace/CategoryServerView.jsx'),
    readSource('src/kit/marketplace/CategoryControlsIsland.jsx'),
  ]);
  assert.match(serverView, /aria-controls="category-filter-dialog"/);
  assert.match(serverView, /id="category-filter-dialog"[\s\S]*?role="dialog"[\s\S]*?aria-modal="true"/);
  assert.match(serverView, /aria-hidden="true"[\s\S]*?inert=""/);
  assert.match(controls, /drawer\.toggleAttribute\('inert', !open\)/);
  assert.match(controls, /trigger\.setAttribute\('aria-expanded', open \? 'true' : 'false'\)/);
  assert.match(controls, /event\.key === 'Escape'[\s\S]*?closeDrawer\(root\)/);
  assert.match(controls, /trapDialogTabKey\(event, drawer, drawer\)/);
});

test('global menu preserves native button keys and owns the focus cycle', async () => {
  const [menu, trigger] = await Promise.all([
    readSource('src/kit/layout/GlobalMenu.jsx'),
    readSource('src/kit/marketplace/GlobalMenuTriggerIsland.jsx'),
  ]);
  assert.match(menu, /target\.closest\('button, a\[href\], input, textarea, select,/);
  assert.match(menu, /if \(interactiveTarget \|\| target\?\.isContentEditable\) return/);
  assert.match(menu, /trapDialogTabKey\(event, dialogRef\.current, dialogRef\.current\)/);
  assert.match(menu, /previouslyFocusedRef\.current\?\.isConnected/);
  assert.match(menu, /id="global-menu-dialog"/);
  assert.match(trigger, /aria-controls="global-menu-dialog"/);
});

test('toasts announce their state and provide a native close button', async () => {
  const toast = await readSource('src/kit/ui/Toast.jsx');
  assert.match(toast, /role=\{toast\.type === 'error' \? 'alert' : 'status'\}/);
  assert.match(toast, /aria-live=\{toast\.type === 'error' \? 'assertive' : 'polite'\}/);
  assert.match(toast, /aria-atomic="true"/);
  assert.match(toast, /<button[\s\S]*?aria-label="Fermer la notification"[\s\S]*?removeToast\(toast\.id\)/);
});
