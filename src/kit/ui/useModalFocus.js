'use client';

import { useEffect, useRef } from 'react';
import { focusWithoutScroll, getDialogFocusableElements, trapDialogTabKey } from './dialogFocus';

export default function useModalFocus(open, onClose, blocked = false) {
  const rootRef = useRef(null);
  const stateRef = useRef({ onClose, blocked });
  stateRef.current = { onClose, blocked };
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusWithoutScroll(getDialogFocusableElements(rootRef.current)[0] || rootRef.current);
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!stateRef.current.blocked) stateRef.current.onClose?.();
      } else trapDialogTabKey(event, rootRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) focusWithoutScroll(previousFocus);
    };
  }, [open]);
  return rootRef;
}
