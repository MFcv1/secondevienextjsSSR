const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const getDialogFocusableElements = (root) => (
  Array.from(root?.querySelectorAll?.(FOCUSABLE_SELECTOR) || []).filter((element) => (
    element?.getAttribute?.('aria-hidden') !== 'true'
    && !element?.closest?.('[inert]')
    && (typeof element?.getClientRects !== 'function' || element.getClientRects().length > 0)
  ))
);

export const focusWithoutScroll = (element) => {
  element?.focus?.({ preventScroll: true });
};

export const trapDialogTabKey = (event, root, fallback = root) => {
  if (event.key !== 'Tab' || !root) return false;

  const focusableElements = getDialogFocusableElements(root);
  if (focusableElements.length === 0) {
    event.preventDefault();
    focusWithoutScroll(fallback);
    return true;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = root.ownerDocument?.activeElement;

  if (!root.contains(activeElement)) {
    event.preventDefault();
    focusWithoutScroll(event.shiftKey ? lastElement : firstElement);
    return true;
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    focusWithoutScroll(lastElement);
    return true;
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    focusWithoutScroll(firstElement);
    return true;
  }

  return false;
};
