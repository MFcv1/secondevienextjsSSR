'use client';

import { useLinkStatus } from 'next/link';
import styles from './ProductNavigationFeedback.module.css';

export default function ProductNavigationFeedback() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span className={styles.pending} role="status" aria-live="polite">
      <span className={styles.pill}><span className={styles.spinner} aria-hidden="true" />Ouverture…</span>
    </span>
  ) : null;
}
