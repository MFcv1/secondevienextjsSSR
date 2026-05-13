/**
 * PAGE TAXONOMY — Référentiel officiel des pages pour le tracking analytics.
 * Voir datadiag.md §3 pour la spec complète.
 *
 * Utilitaire PUR : pas d'import React, pas d'état, testable en isolé.
 */

import { KIT_CONFIG } from '../config/constants';

// ── MÉTADONNÉES PAR pageKey ────────────────────────────────────────
// pageColor : utilisé par la timeline Parcours (dot + badge)
// section   : groupe visuel (vitrine / gallery / catalog / product / commerce / account)
export const PAGE_META = {
  vitrine_home:           { label: 'À propos · Vitrine',         section: 'vitrine',  color: '#A68A64' },

  gallery_landing:        { label: 'Galerie · Accueil',          section: 'gallery',  color: '#1A1A1A' },
  gallery_filter_fixed:   { label: 'Galerie · Ventes directes',  section: 'gallery',  color: '#10b981' },

  category_group:         { label: 'Catégorie · Groupe',         section: 'catalog',  color: '#3b82f6' },
  category_leaf:          { label: 'Catégorie · Feuille',        section: 'catalog',  color: '#06b6d4' },

  product_detail:         { label: 'Produit · Fiche',            section: 'product',  color: '#ec4899' },

  wishlist:               { label: "Liste d'envies",             section: 'account',  color: '#f43f5e' },
  quote_request:          { label: 'Devis · Demande',            section: 'commerce', color: '#f59e0b' },
  checkout:               { label: 'Checkout · Panier',          section: 'commerce', color: '#059669' },
  checkout_success:       { label: 'Checkout · Succès',          section: 'commerce', color: '#22c55e' },
  my_orders:              { label: 'Compte · Mes commandes',     section: 'account',  color: '#7c3aed' },
  login:                  { label: 'Connexion',                  section: 'account',  color: '#475569' },
  admin:                  { label: 'Admin',                      section: 'account',  color: '#ef4444' }, // tracké mais session admin exclue upstream
  unknown:                { label: 'Page inconnue',               section: 'vitrine',  color: '#94a3b8' },
};

// Vues qui déclenchent l'init d'une session (R1).
// home n'est PAS dedans — une session ne démarre QUE quand on touche la galerie.
export const SESSION_ENTRY_VIEWS = ['gallery', 'category', 'detail', 'wishlist', 'devis', 'checkout', 'my-orders'];

// Set pour lookup rapide des IDs de groupes (meubles, assises, eclairage, decorations)
const GROUP_IDS = new Set((KIT_CONFIG.categoryGroups || []).map(g => g.id));

/**
 * Résout un pageKey à partir de l'état de navigation.
 *
 * @param {object} nav
 * @param {string} nav.view           - 'home' | 'gallery' | 'category' | 'detail' | 'wishlist' | 'devis' | 'checkout' | 'my-orders' | 'login' | 'admin'
 * @param {string} [nav.activeCategoryId] - id de catégorie (meubles, chaises, ...)
 * @param {string} [nav.galleryFilter]    - 'fixed'
 * @param {string} [nav.selectedItemId]
 * @param {string} [nav.selectedItemName]
 * @param {number} [nav.selectedItemPrice]
 * @param {object} [nav.urlParams]        - URLSearchParams → { order_success }
 * @returns {{ pageKey:string, pageLabel:string, pageColor:string, section:string, context:object }}
 */
export function resolvePageKey(nav = {}) {
  const { view, activeCategoryId, galleryFilter, selectedItemId, selectedItemName, selectedItemPrice, urlParams } = nav;

  let pageKey = 'unknown';
  const context = {};

  switch (view) {
    case 'home':
      pageKey = 'vitrine_home';
      break;

    case 'gallery':
      if (galleryFilter === 'fixed') pageKey = 'gallery_filter_fixed';
      else pageKey = 'gallery_landing';
      if (galleryFilter) context.filter = galleryFilter;
      break;

    case 'category':
      if (activeCategoryId && GROUP_IDS.has(activeCategoryId)) pageKey = 'category_group';
      else if (activeCategoryId) pageKey = 'category_leaf';
      else pageKey = 'gallery_landing'; // fallback si activeCategoryId manquant
      if (activeCategoryId) context.categoryId = activeCategoryId;
      break;

    case 'detail':
      pageKey = 'product_detail';
      if (selectedItemId)    context.itemId = selectedItemId;
      if (selectedItemName)  context.itemName = selectedItemName;
      if (selectedItemPrice) context.itemPrice = selectedItemPrice;
      break;

    case 'wishlist':
      pageKey = 'wishlist';
      break;

    case 'devis':
      pageKey = 'quote_request';
      break;

    case 'checkout':
      if (urlParams && urlParams.get && urlParams.get('order_success') === 'true') pageKey = 'checkout_success';
      else pageKey = 'checkout';
      break;

    case 'my-orders':
      pageKey = 'my_orders';
      break;

    case 'login':
      pageKey = 'login';
      break;

    case 'admin':
      pageKey = 'admin';
      break;

    default:
      pageKey = 'unknown';
  }

  const meta = PAGE_META[pageKey] || PAGE_META.unknown;

  return {
    pageKey,
    pageLabel: meta.label,
    pageColor: meta.color,
    section:   meta.section,
    context,
  };
}

/**
 * Retourne true si la view passée peut initier une session (R1).
 */
export function isSessionEntryView(view) {
  return SESSION_ENTRY_VIEWS.includes(view);
}

/**
 * Signature stable d'une étape du journey — pour dédupliquer les entrées répétées
 * (ex: plusieurs re-renders ne doivent pas créer 3 fois la même étape).
 */
export function stepSignature(step) {
  if (!step) return '';
  const ctx = step.context || {};
  return [step.pageKey, ctx.categoryId || '', ctx.itemId || '', ctx.filter || ''].join('|');
}
