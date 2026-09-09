'use client';

import { useEffect, useRef, useState } from 'react';
import useCookieConsent from '../src/kit/shared/useCookieConsent';
import { OPEN_COOKIE_PREFERENCES, saveConsent } from '../src/kit/shared/cookieConsent';
import styles from './CookieConsentIsland.module.css';

export default function CookieConsentIsland() {
  const consent = useCookieConsent();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [external, setExternal] = useState(false);
  const [notice, setNotice] = useState('');
  const returnFocus = useRef(null);
  const panel = useRef(null);
  const title = useRef(null);
  const open = ready && (!consent || editing);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    const edit = () => {
      returnFocus.current = document.activeElement;
      setAnalytics(consent?.analytics === true);
      setExternal(consent?.external === true);
      setDetails(true);
      setEditing(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES, edit);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES, edit);
  }, [consent?.analytics, consent?.external]);
  useEffect(() => {
    if (editing || details) title.current?.focus({ preventScroll: true });
  }, [editing, details]);

  const choose = (choices) => {
    const persisted = saveConsent(choices);
    setNotice(persisted ? 'Vos préférences ont été enregistrées.' : 'Choix appliqué pour cette page. Votre navigateur empêche son enregistrement durable.');
    setEditing(false);
    setDetails(false);
    requestAnimationFrame(() => { if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); });
  };

  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event) => {
      if (event.key !== 'Escape' || !panel.current?.contains(event.target)) return;
      event.stopPropagation();
      if (!consent) {
        const persisted = saveConsent({});
        setNotice(persisted ? 'Vos préférences ont été enregistrées.' : 'Choix appliqué pour cette page. Votre navigateur empêche son enregistrement durable.');
      }
      setEditing(false);
      setDetails(false);
      requestAnimationFrame(() => { if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); });
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, consent]);

  return (
    <>
      <div className={styles.srOnly} role="status">{notice}</div>
      {open ? (
        <section ref={panel} className={styles.panel} aria-labelledby="cookie-title">
          <div className={styles.content}>
            <h2 id="cookie-title" ref={title} tabIndex={-1}>{details ? 'Personnaliser les cookies' : 'Vos préférences cookies'}</h2>
            <p className={styles.intro}>{details
              ? 'Vous choisissez ce que vous autorisez.'
              : 'Avec votre accord, nous mesurons les visites et activons Google Maps. Vous pouvez refuser et profiter du site.'}</p>
            {details ? <div id="cookie-details" className={styles.details}>
              <section className={styles.category} aria-labelledby="cookie-essential-title">
                <div className={styles.categoryHeading}><h3 id="cookie-essential-title">Essentiels</h3><span className={styles.badge}>Toujours actifs</span></div>
                <p>Connexion, sécurité, panier et mémorisation de vos choix.</p>
              </section>
              <section className={styles.category} aria-labelledby="cookie-analytics-title">
                <div className={styles.categoryHeading}>
                  <h3 id="cookie-analytics-title"><label htmlFor="cookie-analytics">Audience et performance</label></h3>
                  <input id="cookie-analytics" className={styles.switch} type="checkbox" role="switch" aria-describedby="cookie-analytics-description" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
                </div>
                <p id="cookie-analytics-description">Comprendre les visites et améliorer le site.</p>
                <details className={styles.disclosure}>
                  <summary>Données utilisées</summary>
                  <p>Seconde Vie utilise Firebase (Google) : pages et produits consultés, interactions, durée des visites et performances techniques.</p>
                  <p>Les sessions utilisent des identifiants pseudonymes. Leurs détails sont conservés jusqu’à 90 jours.</p>
                </details>
              </section>
              <section className={styles.category} aria-labelledby="cookie-maps-title">
                <div className={styles.categoryHeading}>
                  <h3 id="cookie-maps-title"><label htmlFor="cookie-maps">Google Maps</label></h3>
                  <input id="cookie-maps" className={styles.switch} type="checkbox" role="switch" aria-describedby="cookie-maps-description" checked={external} onChange={(event) => setExternal(event.target.checked)} />
                </div>
                <p id="cookie-maps-description">Afficher la carte de l’atelier.</p>
                <details className={styles.disclosure}>
                  <summary>Données partagées</summary>
                  <p>Google reçoit des informations de connexion et peut utiliser ses propres traceurs. Sans accord, un lien d’itinéraire reste disponible.</p>
                  <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer">Confidentialité Google ↗</a>
                </details>
              </section>
              <details className={styles.disclosure}>
                <summary>Durée et modification du choix</summary>
                <p>Votre choix est conservé 6 mois sur ce navigateur, sans lien avec votre compte. Modifiez-le via « Gérer mes cookies » en pied de page de la galerie.</p>
                <p>Retirer votre accord arrête les nouvelles mesures, sans effacer les données déjà transmises.</p>
              </details>
            </div> : null}
          </div>
          <div className={styles.footer}>
            <div className={styles.actions}>
              <button className={styles.refuse} type="button" onClick={() => choose({})}>Refuser</button>
              <button type="button" onClick={() => choose({ analytics: true, external: true })}>Accepter</button>
            </div>
            {details
              ? <button className={styles.customize} type="button" onClick={() => choose({ analytics, external })}>Enregistrer mes choix</button>
              : <button className={styles.customize} type="button" aria-expanded={details} aria-controls="cookie-details" onClick={() => { setAnalytics(false); setExternal(false); setDetails(true); }}>En savoir plus et personnaliser</button>}
          </div>
        </section>
      ) : null}
    </>
  );
}
