'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { grantProductAnalyticsConsent, withdrawProductAnalyticsConsent } from '../src/lib/analytics/consent';
import styles from './AnalyticsConsentIsland.module.css';

const hasProductAnalyticsConsent = () => /(?:^|; )sv_analytics_consent=product%3A|(?:^|; )sv_analytics_consent=product:/.test(document.cookie);

export default function AnalyticsConsentIsland() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setConsented(hasProductAnalyticsConsent());
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  const grant = () => {
    grantProductAnalyticsConsent();
    setConsented(true);
    setOpen(false);
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await withdrawProductAnalyticsConsent();
      setConsented(false);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <button className={styles.trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        {consented ? 'Mesure détaillée active' : 'Préférences de mesure'}
      </button>
      {open ? (
        <div className={styles.backdrop}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title">
            <button className={styles.close} type="button" aria-label="Fermer les préférences de mesure" onClick={() => setOpen(false)} disabled={busy}>×</button>
            <span className={styles.eyebrow}>Vos préférences</span>
            <h2 id="analytics-consent-title">Mesure détaillée du parcours</h2>
            <p>Avec votre accord, Seconde Vie conserve un parcours de visite limité pour améliorer la galerie. Aucune adresse e-mail, IP ni valeur User-Agent brute n’est ajoutée à cette mesure.</p>
            {consented ? (
              <>
                <p className={styles.status}>La mesure détaillée est active sur cet appareil. Vous pouvez la retirer à tout moment.</p>
                <div className={styles.actions}>
                  <button className={styles.quiet} type="button" onClick={() => setOpen(false)} disabled={busy}>Fermer</button>
                  <button className={styles.withdraw} type="button" onClick={withdraw} disabled={busy}>{busy ? 'Retrait…' : 'Retirer mon accord'}</button>
                </div>
              </>
            ) : (
              <div className={styles.actions}>
                <button className={styles.quiet} type="button" onClick={() => setOpen(false)}>Continuer sans mesure détaillée</button>
                <button className={styles.grant} type="button" onClick={grant}>Activer la mesure détaillée</button>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
