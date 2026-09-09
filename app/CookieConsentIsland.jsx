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
    if (editing) title.current?.focus();
  }, [editing]);

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
          <div className={styles.eyebrow}>Seconde Vie · Votre vie privée</div>
          <h2 id="cookie-title" ref={title} tabIndex={-1}>Une visite à votre goût.</h2>
          <p>Avec votre accord, nous mesurons les visites et la performance du site pour améliorer votre expérience. Vous pouvez aussi autoriser la carte Google Maps. Refuser ne vous empêche ni de chiner, ni de commander.</p>
          <p className={styles.note}>Votre choix vaut 6 mois sur ce navigateur. Modifiez-le à tout moment via « Gérer mes cookies » en pied de page de la galerie.</p>
          {details ? <div id="cookie-details" className={styles.details}>
            <div className={styles.category}><strong>Strictement nécessaires</strong><span>Toujours actifs</span></div>
            <p>Connexion, sécurité, panier et mémorisation de vos choix. Ils permettent de fournir les services que vous demandez.</p>
            <label className={styles.category}><strong>Audience et performance</strong><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label>
            <p>Seconde Vie utilise Firebase (Google) pour mesurer les pages et produits consultés, les interactions, la durée des visites et les performances techniques. Les sessions utilisent des identifiants pseudonymes ; leurs détails sont conservés jusqu’à 90 jours.</p>
            <label className={styles.category}><strong>Carte externe · Google Maps</strong><input type="checkbox" checked={external} onChange={(event) => setExternal(event.target.checked)} /></label>
            <p>Affiche la carte de l’atelier. Google reçoit des informations de connexion et peut utiliser ses propres traceurs. Sans accord, un lien d’itinéraire reste disponible.</p>
            <p>Le choix est conservé localement, sans être rattaché à votre compte. Retirer votre accord arrête les nouvelles mesures ; cela n’efface pas les données déjà transmises.</p>
            <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer">Confidentialité des services Google ↗</a>
          </div> : null}
          <div className={styles.actions}>
            <button type="button" onClick={() => choose({})}>Tout refuser</button>
            <button type="button" onClick={() => choose({ analytics: true, external: true })}>Tout accepter</button>
          </div>
          {details
            ? <button className={styles.customize} type="button" onClick={() => choose({ analytics, external })}>Enregistrer mes choix</button>
            : <button className={styles.customize} type="button" aria-expanded={details} aria-controls="cookie-details" onClick={() => { setAnalytics(false); setExternal(false); setDetails(true); }}>En savoir plus et personnaliser</button>}
        </section>
      ) : null}
    </>
  );
}
