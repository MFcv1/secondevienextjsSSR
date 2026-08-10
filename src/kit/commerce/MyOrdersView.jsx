import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Check,
    CheckCircle,
    ChevronRight,
    Copy,
    ExternalLink,
    FileText,
    Headphones,
    Heart,
    Loader2,
    LogOut,
    MapPin,
    MessageCircle,
    Package,
    Receipt,
    ShieldCheck,
    ShoppingBag,
    Star,
    TicketPercent,
    Truck,
    UserRound,
    WalletCards,
    X,
} from 'lucide-react';
import { db } from '../config/firebase';
import KIT_CONFIG from '../config/constants';
import { formatShippingCityLine } from '../../utils/shippingAddress';
import { getMillis } from '../../utils/time';
import {
    COMMERCE_V2_ORDER_READERS_ENABLED,
    listMyOrdersV2,
    requestCustomerReturn,
} from './commerceV2Client';
import {
    COMMERCE_V2_CLIENT_COMMANDS_ENABLED,
    createCommerceCommandId,
    requestOrderCancellation,
} from './commerceCommandClient';
import { adaptCommerceOrder } from './orderAdapter';
import CommerceDocumentModal from './CommerceDocumentModal';
import { listMyNewsletterRewards } from '../marketplace/newsletterRewardClient';

const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '';
const BUSINESS_PHONE_TEL = BUSINESS_PHONE.replace(/\s/g, '');
const CONTACT_NAME = process.env.NEXT_PUBLIC_CONTACT_NAME || KIT_CONFIG.brandName;
const REVIEW_URL = process.env.NEXT_PUBLIC_REVIEW_URL || '';
const FALLBACK_ITEM_IMAGES = [
    '/images/before-after/apresu.webp',
    '/images/before-after/apres.webp',
    '/images/before-after/apresx.webp',
    '/images/before-after/avantu.webp',
];

/* ------------------------------------------------------------------ *
 * Surface visuelle: materiaux, hairlines, grain et vibrance.
 * Le style est scope sous .acc-root pour rester local a l'espace client
 * et pour piloter le theme clair/sombre par un seul attribut de donnee.
 * ------------------------------------------------------------------ */
const GRAIN_TEXTURE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)' opacity='.55'/%3E%3C/svg%3E\")";

const ACCOUNT_SURFACE_CSS = `
.acc-root{
    --acc-head: 64px;
    --acc-ease: cubic-bezier(.32,.72,0,1);
    --acc-canvas: #f2f1f0;
    --acc-panel: #ffffff;
    --acc-panel-hover: #fafaf9;
    --acc-well: #f4f4f2;
    --acc-line: rgba(28,25,23,.09);
    --acc-line-firm: rgba(28,25,23,.16);
    --acc-ink: #1a1918;
    --acc-ink-2: #6a635c;
    --acc-ink-3: #9d968e;
    --acc-accent: #8b5c42;
    --acc-accent-ink: #77492f;
    --acc-accent-wash: rgba(139,92,66,.09);
    --acc-hairline-card: 0 0 0 .5px var(--acc-line);
    --acc-elev-1: 0 1px 1px rgba(28,25,23,.03), 0 10px 26px -18px rgba(28,25,23,.24);
    --acc-elev-2: 0 1px 2px rgba(28,25,23,.05), 0 22px 48px -26px rgba(28,25,23,.34);
    --acc-elev-3: 0 40px 90px -30px rgba(20,18,16,.46);
    --acc-focus: 0 0 0 4px rgba(139,92,66,.22);
    --acc-grain-opacity: .30;
    --acc-grain-blend: soft-light;
    --acc-glass: rgba(255,255,255,.76);
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    color: var(--acc-ink);
    background: var(--acc-canvas);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "cv11" 1, "ss01" 1;
}
.acc-root[data-acc-theme='dark']{
    --acc-canvas: #0d0c0b;
    --acc-panel: #191817;
    --acc-panel-hover: #1f1e1c;
    --acc-well: #131211;
    --acc-line: rgba(255,255,255,.09);
    --acc-line-firm: rgba(255,255,255,.18);
    --acc-ink: #f3f1ee;
    --acc-ink-2: #a6a09a;
    --acc-ink-3: #7b756e;
    --acc-accent: #d9b58d;
    --acc-accent-ink: #e3c6a6;
    --acc-accent-wash: rgba(217,181,141,.12);
    --acc-elev-1: 0 1px 1px rgba(0,0,0,.34), 0 14px 30px -20px rgba(0,0,0,.8);
    --acc-elev-2: 0 1px 2px rgba(0,0,0,.4), 0 26px 54px -28px rgba(0,0,0,.9);
    --acc-elev-3: 0 44px 100px -30px rgba(0,0,0,.86);
    --acc-focus: 0 0 0 4px rgba(217,181,141,.24);
    --acc-grain-opacity: .22;
    --acc-grain-blend: overlay;
    --acc-glass: rgba(24,23,22,.74);
}
@media (min-width: 768px){ .acc-root{ --acc-head: 76px; } }

.acc-backdrop{ position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.acc-backdrop::before{
    content: ''; position: absolute; inset: 0;
    background:
        radial-gradient(1100px 620px at 8% -12%, rgba(186,146,110,.13), transparent 66%),
        radial-gradient(880px 520px at 96% 2%, rgba(118,140,158,.15), transparent 70%),
        linear-gradient(180deg, #f8f7f6 0%, #f2f1f0 48%, #ececeb 100%);
}
.acc-root[data-acc-theme='dark'] .acc-backdrop::before{
    background:
        radial-gradient(1100px 620px at 8% -12%, rgba(217,181,141,.13), transparent 66%),
        radial-gradient(880px 520px at 96% 2%, rgba(102,126,150,.12), transparent 70%),
        linear-gradient(180deg, #131211 0%, #0e0d0c 48%, #090908 100%);
}
.acc-backdrop::after{
    content: ''; position: absolute; inset: 0;
    background-image: ${GRAIN_TEXTURE};
    opacity: var(--acc-grain-opacity);
    mix-blend-mode: var(--acc-grain-blend);
}
.acc-shell{ position: relative; z-index: 1; }

.acc-num{ font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
.acc-ref{
    font-variant-numeric: tabular-nums;
    letter-spacing: .015em;
    font-feature-settings: "tnum" 1;
}
.acc-root ::selection{ background: var(--acc-accent-wash); color: var(--acc-ink); }
.acc-root :focus-visible{ outline: none; box-shadow: var(--acc-focus), var(--acc-hairline-card); }

/* Retour: une seule pastille pour les deux sorties, quitter la galerie et
   quitter un module ouvert. La fleche recule legerement au survol. */
.acc-crumb{ color: var(--acc-ink); }
.acc-crumb svg{ transition: transform .2s var(--acc-ease); }
.acc-crumb:hover svg{ transform: translateX(-2.5px); }
/* Double coque: la pastille est posee dans un ecrin de verre, exactement
   comme le bouton de retour l'est dans le bandeau du mode focus. */
.acc-crumb-shell{
    display: inline-flex; align-items: center; padding: 6px;
    border-radius: 999px;
    background: var(--acc-glass);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    box-shadow: var(--acc-hairline-card), var(--acc-elev-1);
}

/* Boutons et pastilles */
.acc-btn{
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    height: 34px; padding: 0 13px; border-radius: 999px;
    font-size: 12.5px; font-weight: 600; letter-spacing: -.005em;
    color: var(--acc-ink); background: var(--acc-panel);
    box-shadow: var(--acc-hairline-card), 0 1px 1px rgba(28,25,23,.04);
    transition: background .18s var(--acc-ease), box-shadow .18s var(--acc-ease), transform .18s var(--acc-ease), color .18s var(--acc-ease);
    white-space: nowrap; cursor: pointer;
}
.acc-btn:hover{ box-shadow: 0 0 0 .5px var(--acc-line-firm), 0 2px 6px -1px rgba(28,25,23,.10); }
.acc-btn:active{ transform: scale(.972); }
.acc-btn--quiet{ background: transparent; box-shadow: none; color: var(--acc-ink-2); }
.acc-btn--quiet:hover{ background: var(--acc-panel); color: var(--acc-ink); box-shadow: var(--acc-hairline-card); }
.acc-btn--well{ background: var(--acc-well); box-shadow: var(--acc-hairline-card); }
.acc-btn--well:hover{ background: var(--acc-panel); }
.acc-btn--dark{
    color: #fff;
    background: linear-gradient(180deg, #38332f 0%, #1c1a18 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.22), 0 1px 2px rgba(28,25,23,.28), 0 10px 22px -14px rgba(28,25,23,.6);
}
.acc-btn--dark:hover{ box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 2px 5px rgba(28,25,23,.3), 0 14px 26px -14px rgba(28,25,23,.66); }
.acc-root[data-acc-theme='dark'] .acc-btn--dark{
    color: #17150f;
    background: linear-gradient(180deg, #eddfcb 0%, #d9b58d 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 1px 2px rgba(0,0,0,.5);
}
.acc-btn--accent{ color: var(--acc-accent-ink); background: var(--acc-accent-wash); box-shadow: 0 0 0 .5px rgba(139,92,66,.22); }
.acc-root[data-acc-theme='dark'] .acc-btn--accent{ box-shadow: 0 0 0 .5px rgba(217,181,141,.26); }
.acc-btn--danger{ color: #a2382a; background: rgba(162,56,42,.08); box-shadow: 0 0 0 .5px rgba(162,56,42,.2); }
.acc-root[data-acc-theme='dark'] .acc-btn--danger{ color: #f0a79a; background: rgba(240,167,154,.12); box-shadow: 0 0 0 .5px rgba(240,167,154,.24); }
.acc-btn--sm{ height: 30px; padding: 0 11px; font-size: 12px; }
.acc-btn[disabled]{ opacity: .5; cursor: default; transform: none; }

/* Tuiles d'icone, dessinees comme des icones d'application */
.acc-tile{
    display: inline-grid; place-items: center; flex: none;
    width: var(--acc-tile-size, 34px); height: var(--acc-tile-size, 34px);
    border-radius: var(--acc-tile-radius, 10px);
    color: #fff;
    background-image: linear-gradient(180deg, var(--acc-tile-a), var(--acc-tile-b));
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,.42),
        inset 0 -1px 0 rgba(0,0,0,.14),
        0 1px 2px rgba(28,25,23,.24);
}
.acc-tile--graphite{ --acc-tile-a: #504a45; --acc-tile-b: #26221f; }
.acc-root[data-acc-theme='dark'] .acc-tile--graphite{ --acc-tile-a: #7d756d; --acc-tile-b: #4a443f; }
.acc-tile--warm{ --acc-tile-a: #a9744f; --acc-tile-b: #79462c; }
.acc-tile--gold{ --acc-tile-a: #d7a95f; --acc-tile-b: #a97a2c; }
.acc-tile--blue{ --acc-tile-a: #5b93c9; --acc-tile-b: #2e5f92; }
.acc-tile--green{ --acc-tile-a: #5fa07c; --acc-tile-b: #2f6b4c; }
.acc-tile--red{ --acc-tile-a: #cf7a6b; --acc-tile-b: #a03a29; }
.acc-tile--rose{ --acc-tile-a: #cd7b8d; --acc-tile-b: #9c3c52; }

/* Panneaux */
.acc-panel{
    position: relative;
    background: var(--acc-panel);
    border-radius: 18px;
    box-shadow: var(--acc-hairline-card), var(--acc-elev-1);
}
.acc-panel--raised{ box-shadow: var(--acc-hairline-card), var(--acc-elev-2); }
.acc-panel-head{
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    padding: 16px 18px;
    box-shadow: inset 0 -1px 0 var(--acc-line);
}
.acc-eyebrow{
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .13em;
    color: var(--acc-ink-3);
}
.acc-panel-title{
    margin-top: 4px;
    font-size: 19px; font-weight: 600; letter-spacing: -.018em; line-height: 1.2;
    color: var(--acc-ink);
}
.acc-panel-hint{ margin-top: 5px; font-size: 13px; line-height: 1.5; color: var(--acc-ink-2); max-width: 56ch; }
.acc-count{
    display: inline-flex; align-items: center; height: 20px; padding: 0 8px;
    border-radius: 999px; background: var(--acc-well); box-shadow: var(--acc-hairline-card);
    font-size: 11.5px; font-weight: 650; color: var(--acc-ink-2);
    font-variant-numeric: tabular-nums;
}

/* Grille de compteurs a hairlines pleines */
.acc-metrics{
    display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1px;
    background: var(--acc-line); border-radius: 18px; overflow: hidden;
    box-shadow: var(--acc-hairline-card), var(--acc-elev-1);
}
@media (min-width: 900px){ .acc-metrics{ grid-template-columns: repeat(4, minmax(0,1fr)); } }
.acc-metric{
    display: grid; align-content: space-between; gap: 18px; min-height: 122px;
    padding: 16px 18px; text-align: left;
    background: var(--acc-panel); color: inherit; cursor: pointer;
    transition: background .2s var(--acc-ease);
}
.acc-metric:hover{ background: var(--acc-panel-hover); }
.acc-metric-value{
    display: block; font-size: clamp(23px, 2.5vw, 29px); font-weight: 600;
    letter-spacing: -.028em; line-height: 1; color: var(--acc-ink);
    font-variant-numeric: tabular-nums;
}
.acc-metric-label{ display: block; margin-top: 7px; font-size: 12.5px; font-weight: 600; color: var(--acc-ink); }
.acc-metric-sub{ display: block; margin-top: 2px; font-size: 12px; color: var(--acc-ink-3); }
.acc-metric-chevron{ opacity: 0; transform: translateX(-3px); transition: opacity .2s var(--acc-ease), transform .2s var(--acc-ease); color: var(--acc-ink-3); }
.acc-metric:hover .acc-metric-chevron{ opacity: 1; transform: translateX(0); }

/* Rail de navigation lateral: masque sous 1024px au profit du controle segmente */
.acc-rail{ display: none; }
@media (min-width: 1024px){
    .acc-rail{ position: sticky; top: calc(var(--acc-head) + 20px); display: grid; gap: 2px; align-content: start; }
}
.acc-rail-group{ padding: 8px; }
.acc-nav-item{
    display: flex; align-items: center; gap: 10px; width: 100%;
    height: 38px; padding: 0 10px; border-radius: 10px;
    font-size: 13.5px; font-weight: 600; letter-spacing: -.008em;
    color: var(--acc-ink-2); background: transparent; text-align: left; cursor: pointer;
    transition: background .16s var(--acc-ease), color .16s var(--acc-ease), box-shadow .16s var(--acc-ease);
}
.acc-nav-item:hover{ background: var(--acc-well); color: var(--acc-ink); }
.acc-nav-item[aria-current='true']{
    color: var(--acc-ink);
    background: var(--acc-panel);
    box-shadow: var(--acc-hairline-card), 0 1px 2px rgba(28,25,23,.06);
}
.acc-nav-item[aria-current='true'] .acc-nav-icon{ color: var(--acc-accent); }
.acc-nav-icon{ flex: none; color: var(--acc-ink-3); transition: color .16s var(--acc-ease); }
.acc-nav-dot{ margin-left: auto; width: 5px; height: 5px; border-radius: 999px; background: var(--acc-accent); opacity: 0; transition: opacity .16s var(--acc-ease); }
.acc-nav-item[aria-current='true'] .acc-nav-dot{ opacity: 1; }
.acc-rail-sep{ height: 1px; margin: 6px 10px; background: var(--acc-line); }

/* Rail mobile en controle segmente */
.acc-segments{
    position: sticky; top: calc(var(--acc-head) + 8px); z-index: 25;
    display: flex; gap: 4px; padding: 5px; margin: 0 -4px;
    overflow-x: auto; scrollbar-width: none;
    border-radius: 999px;
    background: var(--acc-glass);
    backdrop-filter: saturate(180%) blur(18px);
    -webkit-backdrop-filter: saturate(180%) blur(18px);
    box-shadow: var(--acc-hairline-card), var(--acc-elev-1);
}
.acc-segments::-webkit-scrollbar{ display: none; }
@media (min-width: 1024px){ .acc-segments{ display: none; } }
.acc-segment{
    display: inline-flex; align-items: center; gap: 6px; flex: none;
    height: 32px; padding: 0 12px; border-radius: 999px;
    font-size: 12.5px; font-weight: 600; color: var(--acc-ink-2); cursor: pointer;
    transition: background .16s var(--acc-ease), color .16s var(--acc-ease), box-shadow .16s var(--acc-ease);
}
.acc-segment[aria-current='true']{ color: var(--acc-ink); background: var(--acc-panel); box-shadow: var(--acc-hairline-card), 0 1px 2px rgba(28,25,23,.08); }

/* Hero */
.acc-hero-name{
    font-size: clamp(27px, 3.5vw, 37px); font-weight: 600;
    letter-spacing: -.03em; line-height: 1.04; color: var(--acc-ink);
}
.acc-avatar{
    display: grid; place-items: center; flex: none;
    width: 54px; height: 54px; border-radius: 17px;
    font-size: 20px; font-weight: 600; letter-spacing: -.01em; color: #fff;
    background: linear-gradient(158deg, #a5714d 0%, #7c4a30 58%, #5e3823 100%);
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,.4),
        inset 0 -1px 0 rgba(0,0,0,.2),
        0 8px 20px -10px rgba(94,56,35,.72);
}
.acc-root[data-acc-theme='dark'] .acc-avatar{
    background: linear-gradient(158deg, #e6cdaa 0%, #c79f74 58%, #9d7548 100%);
    color: #221a12;
}
.acc-badge{
    display: inline-flex; align-items: center; gap: 5px;
    height: 22px; padding: 0 9px; border-radius: 999px;
    font-size: 11.5px; font-weight: 650; color: var(--acc-ink-2);
    background: var(--acc-panel); box-shadow: var(--acc-hairline-card);
}

/* Statuts */
.acc-status{
    display: inline-flex; align-items: center; gap: 6px; width: fit-content;
    height: 25px; padding: 0 10px; border-radius: 999px;
    font-size: 11.5px; font-weight: 650; letter-spacing: -.003em;
    color: var(--acc-status-ink);
    background: var(--acc-status-bg);
    box-shadow: 0 0 0 .5px var(--acc-status-ring);
}
.acc-status-dot{ width: 5px; height: 5px; border-radius: 999px; background: currentColor; }
.acc-status--neutral{ --acc-status-ink:#57514b; --acc-status-bg:rgba(87,81,75,.08); --acc-status-ring:rgba(87,81,75,.18); }
.acc-status--green{ --acc-status-ink:#2f6b4c; --acc-status-bg:rgba(47,107,76,.09); --acc-status-ring:rgba(47,107,76,.2); }
.acc-status--blue{ --acc-status-ink:#2e5f92; --acc-status-bg:rgba(46,95,146,.09); --acc-status-ring:rgba(46,95,146,.2); }
.acc-status--amber{ --acc-status-ink:#8a5a13; --acc-status-bg:rgba(138,90,19,.1); --acc-status-ring:rgba(138,90,19,.2); }
.acc-status--red{ --acc-status-ink:#a2382a; --acc-status-bg:rgba(162,56,42,.09); --acc-status-ring:rgba(162,56,42,.2); }
.acc-root[data-acc-theme='dark'] .acc-status--neutral{ --acc-status-ink:#c4bdb5; --acc-status-bg:rgba(196,189,181,.12); --acc-status-ring:rgba(196,189,181,.2); }
.acc-root[data-acc-theme='dark'] .acc-status--green{ --acc-status-ink:#8fd4ab; --acc-status-bg:rgba(143,212,171,.13); --acc-status-ring:rgba(143,212,171,.22); }
.acc-root[data-acc-theme='dark'] .acc-status--blue{ --acc-status-ink:#9dc6ef; --acc-status-bg:rgba(157,198,239,.13); --acc-status-ring:rgba(157,198,239,.22); }
.acc-root[data-acc-theme='dark'] .acc-status--amber{ --acc-status-ink:#e9bd76; --acc-status-bg:rgba(233,189,118,.13); --acc-status-ring:rgba(233,189,118,.22); }
.acc-root[data-acc-theme='dark'] .acc-status--red{ --acc-status-ink:#f0a79a; --acc-status-bg:rgba(240,167,154,.13); --acc-status-ring:rgba(240,167,154,.22); }

/* Listes et puits */
.acc-list > * + *{ box-shadow: inset 0 1px 0 var(--acc-line); }
.acc-well{
    border-radius: 14px; background: var(--acc-well);
    box-shadow: inset 0 0 0 .5px var(--acc-line);
}
.acc-note{ border-radius: 14px; padding: 12px 14px; box-shadow: inset 0 0 0 .5px var(--acc-note-ring); background: var(--acc-note-bg); }
.acc-note--blue{ --acc-note-bg: rgba(46,95,146,.06); --acc-note-ring: rgba(46,95,146,.18); }
.acc-note--amber{ --acc-note-bg: rgba(138,90,19,.06); --acc-note-ring: rgba(138,90,19,.18); }
.acc-root[data-acc-theme='dark'] .acc-note--blue{ --acc-note-bg: rgba(157,198,239,.08); --acc-note-ring: rgba(157,198,239,.18); }
.acc-root[data-acc-theme='dark'] .acc-note--amber{ --acc-note-bg: rgba(233,189,118,.08); --acc-note-ring: rgba(233,189,118,.18); }
.acc-note-title{ font-size: 12.5px; font-weight: 650; color: var(--acc-note-ink, var(--acc-ink)); }
.acc-note--blue .acc-note-title{ color: #2e5f92; }
.acc-note--amber .acc-note-title{ color: #8a5a13; }
.acc-root[data-acc-theme='dark'] .acc-note--blue .acc-note-title{ color: #9dc6ef; }
.acc-root[data-acc-theme='dark'] .acc-note--amber .acc-note-title{ color: #e9bd76; }
.acc-note-body{ margin-top: 4px; font-size: 12.5px; line-height: 1.55; color: var(--acc-ink-2); }

.acc-field{ display: grid; gap: 3px; padding: 12px 18px; }
.acc-field-key{ font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; color: var(--acc-ink-3); }
.acc-field-value{ font-size: 14.5px; font-weight: 550; color: var(--acc-ink); overflow-wrap: anywhere; }

.acc-thumb{
    position: relative; overflow: hidden; border-radius: 12px;
    background: var(--acc-well);
    box-shadow: inset 0 0 0 .5px var(--acc-line);
}
.acc-thumb img{ width: 100%; height: 100%; object-fit: cover; display: block; }
.acc-thumb::after{
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,0) 42%, rgba(28,25,23,.06));
}

.acc-order{ display: grid; gap: 14px; padding: 16px 18px; transition: background .2s var(--acc-ease); }
.acc-order:hover{ background: var(--acc-panel-hover); }
.acc-order-ref{ font-size: 15.5px; font-weight: 650; letter-spacing: -.012em; color: var(--acc-ink); }
.acc-order-total{ font-size: 17px; font-weight: 650; letter-spacing: -.02em; color: var(--acc-ink); font-variant-numeric: tabular-nums; }

.acc-empty{
    display: grid; justify-items: center; gap: 10px;
    padding: 40px 22px; text-align: center;
    border-radius: 14px; background: var(--acc-well);
    box-shadow: inset 0 0 0 .5px var(--acc-line);
}
.acc-empty-title{ font-size: 15.5px; font-weight: 650; color: var(--acc-ink); }
.acc-empty-body{ font-size: 13px; line-height: 1.55; color: var(--acc-ink-2); max-width: 42ch; }

/* Carte support */
.acc-support{
    position: relative; overflow: hidden; border-radius: 18px; color: #f6f3ef;
    background: linear-gradient(168deg, #302b27 0%, #1c1a18 52%, #131110 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.1), 0 24px 54px -30px rgba(20,18,16,.8);
}
.acc-root[data-acc-theme='dark'] .acc-support{
    background: linear-gradient(168deg, #232120 0%, #171615 52%, #111010 100%);
    box-shadow: inset 0 0 0 .5px var(--acc-line), 0 24px 54px -30px rgba(0,0,0,.9);
}
.acc-support::before{
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(520px 240px at 12% 0%, rgba(217,181,141,.2), transparent 70%);
}
.acc-support::after{
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image: ${GRAIN_TEXTURE}; opacity: .16; mix-blend-mode: overlay;
}

/* Feuilles modales */
.acc-scrim{
    position: fixed; inset: 0; z-index: 130;
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0; background: rgba(22,20,18,.44);
    backdrop-filter: blur(20px) saturate(150%);
    -webkit-backdrop-filter: blur(20px) saturate(150%);
    animation: acc-fade .22s var(--acc-ease) both;
}
@media (min-width: 640px){ .acc-scrim{ align-items: center; padding: 20px; } }
.acc-scrim-close{ position: absolute; inset: 0; cursor: default; }
.acc-scrim-close:focus-visible{ box-shadow: none; }
.acc-sheet{
    position: relative; z-index: 1; width: 100%; max-width: 480px;
    max-height: 92vh; overflow-y: auto;
    border-radius: 24px 24px 0 0;
    background: var(--acc-panel); color: var(--acc-ink);
    box-shadow: var(--acc-hairline-card), var(--acc-elev-3);
    animation: acc-rise .34s var(--acc-ease) both;
}
@media (min-width: 640px){
    .acc-sheet{ border-radius: 22px; animation: acc-pop .3s var(--acc-ease) both; }
}
.acc-grabber{ width: 38px; height: 5px; margin: 8px auto 0; border-radius: 999px; background: var(--acc-line-firm); }
@media (min-width: 640px){ .acc-grabber{ display: none; } }
.acc-toast{
    position: fixed; left: 50%; bottom: 22px; z-index: 140;
    width: calc(100% - 2rem); max-width: 420px; transform: translateX(-50%);
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 16px;
    font-size: 13px; font-weight: 550; color: var(--acc-ink);
    background: var(--acc-panel);
    box-shadow: var(--acc-hairline-card), var(--acc-elev-2);
    animation: acc-rise .3s var(--acc-ease) both;
}

.acc-input{
    width: 100%; padding: 11px 13px; border-radius: 12px;
    font-size: 14px; color: var(--acc-ink);
    background-color: var(--acc-well);
    box-shadow: inset 0 0 0 .5px var(--acc-line-firm);
    outline: none; transition: box-shadow .18s var(--acc-ease), background-color .18s var(--acc-ease);
}
.acc-input:focus{ background-color: var(--acc-panel); box-shadow: inset 0 0 0 1px var(--acc-accent), var(--acc-focus); }
select.acc-input{
    appearance: none; -webkit-appearance: none;
    padding-right: 38px; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' fill='none' stroke='%239d968e' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
}
.acc-check{
    display: flex; align-items: center; gap: 11px;
    padding: 11px 13px; border-radius: 12px;
    font-size: 13px; background: var(--acc-well);
    box-shadow: inset 0 0 0 .5px var(--acc-line);
    cursor: pointer; transition: background .18s var(--acc-ease);
}
.acc-check:hover{ background: var(--acc-panel-hover); }
.acc-check input{ accent-color: var(--acc-accent); width: 16px; height: 16px; }

.acc-skel{
    border-radius: 8px;
    background: linear-gradient(90deg, var(--acc-well) 8%, var(--acc-panel-hover) 34%, var(--acc-well) 62%);
    background-size: 260% 100%;
    animation: acc-shimmer 1.5s linear infinite;
}
.acc-root[data-acc-theme='dark'] .acc-skel{
    background: linear-gradient(90deg, rgba(255,255,255,.05) 8%, rgba(255,255,255,.1) 34%, rgba(255,255,255,.05) 62%);
    background-size: 260% 100%;
}

/* ------------------------------------------------------------------ *
 * Mode focus: un module s'ouvre en grand, le reste de la page s'efface.
 * L'ouverture se joue en deux temps: le decor recule (opening), puis le
 * module rejoint sa position pleine largeur par une animation FLIP.
 * ------------------------------------------------------------------ */
.acc-root .acc-hero,
.acc-root .acc-segments,
.acc-root .acc-rail,
.acc-root .acc-metrics,
.acc-root [data-acc-section]{
    transition: opacity .26s var(--acc-ease), transform .3s var(--acc-ease), filter .26s var(--acc-ease);
}
.acc-root[data-acc-mode='opening'] .acc-hero,
.acc-root[data-acc-mode='opening'] .acc-segments,
.acc-root[data-acc-mode='opening'] .acc-rail,
.acc-root[data-acc-mode='opening'] .acc-metrics,
.acc-root[data-acc-mode='opening'] [data-acc-focused='false']{
    opacity: 0;
    transform: scale(.968) translateY(8px);
    filter: blur(7px);
    pointer-events: none;
}
.acc-root[data-acc-mode='opening'] [data-acc-focused='true']{
    z-index: 3;
    box-shadow: var(--acc-hairline-card), var(--acc-elev-3);
}
.acc-root[data-acc-mode='focus'] .acc-hero,
.acc-root[data-acc-mode='focus'] .acc-segments,
.acc-root[data-acc-mode='focus'] .acc-rail,
.acc-root[data-acc-mode='focus'] .acc-metrics,
.acc-root[data-acc-mode='focus'] [data-acc-focused='false']{ display: none !important; }
.acc-root[data-acc-mode='focus'] .acc-body,
.acc-root[data-acc-mode='focus'] .acc-pair{ grid-template-columns: minmax(0,1fr) !important; }
/* La marge haute fusionnerait hors de .acc-root et decalerait le point de
   collage du socle par rapport a la fin de page: c'est le socle qui porte
   cet espace, via son propre rembourrage. */
.acc-root[data-acc-mode='focus'] .acc-body{ margin-top: 0 !important; }
.acc-root[data-acc-mode='focus'] [data-acc-focused='true']{ box-shadow: var(--acc-hairline-card), var(--acc-elev-2); }
/* Un module court ne doit pas laisser de course de defilement residuelle:
   sans cela le panneau glisse sous le bandeau collant et le chevauche. La
   hauteur retenue laisse exactement de quoi chasser le bandeau promotionnel. */
.acc-root[data-acc-mode='focus']{ min-height: calc(100vh - var(--acc-head)); }

/* Le socle porte le collage et le flou, la pastille garde sa marge visuelle.
   Le flou doit vivre sur le parent: un element a backdrop-filter fonde un
   backdrop root, donc un enfant floutant n'aurait plus rien a echantillonner.
   Ses rembourrages valent exactement les marges de repos, en haut comme en
   bas: une fois colle sous l'en-tete, l'espace beige autour de la pastille
   appartient au socle, donc le module ne peut plus le traverser. Les marges
   negatives annulent ces rembourrages dans le flux, la position au repos est
   inchangee, et la bande floutee avale le contenu qui passe dessous. */
.acc-focusdock{
    position: sticky; top: calc(var(--acc-head) + env(safe-area-inset-top, 0px)); z-index: 30;
    margin-bottom: -20px; padding: 20px 0;
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
}
.acc-focusbar{
    display: flex; align-items: center; gap: 8px;
    padding: 6px; border-radius: 999px;
    background: var(--acc-glass);
    box-shadow: var(--acc-hairline-card), var(--acc-elev-1);
    animation: acc-bar-in .44s var(--acc-ease) both;
}
.acc-focus-back-label{ display: none; }
@media (min-width: 430px){ .acc-focus-back-label{ display: inline; } }
.acc-focus-title{
    display: none; align-items: center; gap: 8px; min-width: 0;
    font-size: 13.5px; font-weight: 650; letter-spacing: -.012em; color: var(--acc-ink);
}
@media (min-width: 720px){ .acc-focus-title{ display: inline-flex; } }
.acc-focus-switch{
    display: flex; align-items: center; gap: 2px; margin-left: auto;
    max-width: 62%; overflow-x: auto; scrollbar-width: none;
}
.acc-focus-switch::-webkit-scrollbar{ display: none; }
.acc-focus-chip{
    display: grid; place-items: center; flex: none;
    width: 32px; height: 32px; border-radius: 999px;
    color: var(--acc-ink-3); cursor: pointer;
    transition: background .16s var(--acc-ease), color .16s var(--acc-ease), transform .16s var(--acc-ease);
}
.acc-focus-chip:hover{ background: var(--acc-well); color: var(--acc-ink); }
.acc-focus-chip:active{ transform: scale(.9); }
.acc-focus-chip[aria-current='true']{
    color: var(--acc-accent); background: var(--acc-accent-wash);
    box-shadow: 0 0 0 .5px var(--acc-line);
}

.acc-root [data-acc-flip='enter'] > *{ animation: acc-focus-content .42s var(--acc-ease) both; }
.acc-root [data-acc-flip='enter'] > *:nth-child(2){ animation-delay: .07s; }
.acc-root [data-acc-flip='enter'] > *:nth-child(3){ animation-delay: .13s; }
.acc-root [data-acc-flip='enter'] > *:nth-child(n+4){ animation-delay: .18s; }
.acc-root [data-acc-swap='in']{ animation: acc-swap-in .44s var(--acc-ease) both; }
.acc-root[data-acc-returning='true'] .acc-hero{ animation: acc-return .52s var(--acc-ease) both; }
.acc-root[data-acc-returning='true'] .acc-segments{ animation: acc-return .52s .04s var(--acc-ease) both; }
.acc-root[data-acc-returning='true'] .acc-metrics{ animation: acc-return .52s .05s var(--acc-ease) both; }
.acc-root[data-acc-returning='true'] .acc-rail{ animation: acc-return .52s .07s var(--acc-ease) both; }
.acc-root[data-acc-returning='true'] [data-acc-section]:not([data-acc-flip='exit']){ animation: acc-return .52s .1s var(--acc-ease) both; }

@keyframes acc-shimmer{ from{ background-position: 130% 0; } to{ background-position: -130% 0; } }
@keyframes acc-fade{ from{ opacity: 0; } to{ opacity: 1; } }
@keyframes acc-pop{ from{ opacity: 0; transform: translateY(10px) scale(.975); } to{ opacity: 1; transform: none; } }
@keyframes acc-rise{ from{ opacity: 0; transform: translateY(26px); } to{ opacity: 1; transform: none; } }
@keyframes acc-bar-in{ from{ opacity: 0; transform: translateY(-12px) scale(.96); } to{ opacity: 1; transform: none; } }
@keyframes acc-focus-content{ from{ opacity: 0; transform: translateY(12px); } to{ opacity: 1; transform: none; } }
@keyframes acc-return{ from{ opacity: 0; transform: translateY(14px) scale(.982); } to{ opacity: 1; transform: none; } }
@keyframes acc-swap-in{ from{ opacity: 0; transform: translateY(16px) scale(.988); } to{ opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce){
    .acc-root *{ animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

/* Courbe partagee avec --acc-ease: les animations JS doivent respirer comme le CSS. */
const ACC_EASE = 'cubic-bezier(.32,.72,0,1)';
const ACC_OPEN_DELAY = 230;

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const prefersReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

/**
 * Anime un noeud depuis sa geometrie precedente vers sa geometrie actuelle.
 * L'echelle est bornee pour que le contenu ne se deforme jamais franchement:
 * on cherche l'impression d'un module qui s'ouvre, pas un zoom litteral.
 */
const runFlip = (node, first, direction) => {
    if (!node || !first || typeof node.animate !== 'function') return;
    const last = node.getBoundingClientRect();
    if (!last.width || !first.width) return;

    const maxShift = window.innerHeight * 0.86;
    const dx = clampValue(first.left - last.left, -window.innerWidth, window.innerWidth);
    const dy = clampValue(first.top - last.top, -maxShift, maxShift);
    const scale = clampValue(first.width / last.width, 0.86, 1.14);

    node.dataset.accFlip = direction;
    node.animate(
        [
            {
                transformOrigin: 'top left',
                transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
                opacity: 0.55,
            },
            { transformOrigin: 'top left', transform: 'none', opacity: 1 },
        ],
        { duration: direction === 'enter' ? 520 : 460, easing: ACC_EASE, fill: 'both' }
    ).addEventListener('finish', (event) => { event.target.cancel(); });

    window.setTimeout(() => {
        if (node.dataset.accFlip === direction) delete node.dataset.accFlip;
    }, 760);
};

const formatPrice = (price = 0) => (
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(price) || 0)
);

const formatDate = (value) => {
    const millis = getMillis(value);
    if (!millis) return 'Date indisponible';
    return new Date(millis).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const formatShortDate = (value) => {
    const millis = getMillis(value);
    if (!millis) return '—';
    return new Date(millis).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getOrderTotal = (order) => {
    if (typeof order?.total === 'number') return order.total;
    return (order?.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
};

const getRefundAmount = (order) => {
    const amount = Number(order?.refundAmount);
    if (Number.isFinite(amount) && amount > 0) return amount / 100;
    return getOrderTotal(order);
};

const getItemImage = (item) => (
    Array.isArray(item?.images) ? item.images[0] :
    Array.isArray(item?.image) ? item.image[0] :
    item?.image || item?.imageUrl || item?.mainImage || FALLBACK_ITEM_IMAGES[0]
);

const getOrderImage = (order, index = 0) => (
    getItemImage(order?.items?.[0]) || FALLBACK_ITEM_IMAGES[index % FALLBACK_ITEM_IMAGES.length]
);

const getOrderNumber = (order) => {
    const id = order?.orderNumber || order?.id || '';
    return `CMD-${String(id).slice(0, 10).toUpperCase()}`;
};

const getOrderItemsSummary = (order) => (
    (order?.items || [])
        .map((item) => item?.titleSnapshot || item?.name)
        .filter(Boolean)
        .join(', ')
);

const getOrderItemsCount = (order) => (
    (order?.items || []).reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)
);

const getDocumentLabel = (document) => (
    document?.kind === 'sandbox_refund_confirmation'
        ? 'Confirmation de remboursement'
        : 'Reçu de paiement'
);

const getDocumentAmount = (document) => (
    document?.kind === 'sandbox_refund_confirmation'
        ? document.refundedCents
        : document.capturedCents
);

const getStatusInfo = (status = '') => {
    switch (status) {
        case 'completed':
            return { label: 'Livrée', tone: 'green', icon: CheckCircle };
        case 'shipped':
            return { label: 'Expédiée', tone: 'blue', icon: Truck };
        case 'cancelled_by_client':
        case 'cancelled':
        case 'canceled':
            return { label: 'Annulée', tone: 'red', icon: X };
        case 'payment_failed':
            return { label: 'Paiement échoué', tone: 'red', icon: X };
        case 'refund_pending':
            return { label: 'Remboursement en cours', tone: 'amber', icon: WalletCards };
        case 'refunded':
            return { label: 'Remboursée', tone: 'blue', icon: CheckCircle };
        case 'refund_failed':
            return { label: 'Remboursement à vérifier', tone: 'red', icon: AlertTriangle };
        case 'paid':
            return { label: 'Payée', tone: 'green', icon: CheckCircle };
        default:
            return { label: 'Préparée', tone: 'neutral', icon: Package };
    }
};

const canCancel = (order) => {
    if (order?.schemaVersion === 2) {
        return Array.isArray(order.allowedActions) &&
            order.allowedActions.includes('request_cancellation');
    }
    const status = order?.status || '';
    const isPaidStripeOrder = status === 'paid' || Boolean(order?.paidAt) || (
        Boolean(order?.stripePaymentIntentId)
        && order?.paymentMethod !== 'deferred'
        && status !== 'pending_payment'
    );
    if (isPaidStripeOrder) return false;
    if (status === 'shipped' || status === 'completed' || status === 'canceled' || status === 'payment_failed' || status.includes('cancelled')) return false;
    if (!order?.createdAt?.seconds) return false;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const diffDays = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
};

const canRequestReturn = (order) => (
    order?.schemaVersion === 2
    && ['paid', 'shipped', 'completed'].includes(order?.status)
    && !['pending', 'full', 'needs_review'].includes(order?.refundStatus)
    && !order?.latestCustomerReturnRequest
);

const getCustomerReturnRequestCopy = (request) => {
    if (!request) return null;
    switch (request.status) {
        case 'pending_review':
            return 'Votre demande a été transmise à l’atelier et doit être examinée.';
        case 'return_authorized':
            return 'Le retour est autorisé. Le remboursement sera lancé après réception et inspection de la pièce.';
        case 'refund_initiated':
            return 'Le remboursement a été lancé et attend la confirmation de Stripe.';
        case 'completed':
            return 'Votre demande est terminée et le remboursement a été confirmé.';
        case 'refund_failed':
            return 'Le remboursement demande une vérification par l’atelier.';
        case 'rejected':
            return `La demande a été refusée${request.decisionReason ? ` : ${request.decisionReason}` : '.'}`;
        default:
            return 'Votre demande est en cours de traitement.';
    }
};

const getRefundHelpText = (status = '') => {
    if (status === 'refund_pending') {
        return 'Le remboursement a été initié par l’atelier. Stripe indique un crédit visible sous environ 5 à 10 jours ouvrables selon votre banque.';
    }
    if (status === 'refunded') {
        return 'Le remboursement a été confirmé. Selon votre banque, le crédit peut apparaître sous quelques jours ouvrables.';
    }
    if (status === 'refund_failed') {
        return 'Le remboursement doit être vérifié par l’atelier. Contactez-nous si vous n’avez pas déjà été recontacté.';
    }
    return '';
};

const getInitials = (name = '', email = '') => {
    const source = (name || email || '').trim();
    if (!source) return 'SV';
    const parts = source.replace(/[^\p{L}\p{N}\s.-]/gu, ' ').split(/[\s.-]+/).filter(Boolean);
    if (parts.length === 0) return 'SV';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const IconTile = ({ icon: Icon, tone = 'graphite', size = 34, radius = 10 }) => (
    <span
        className={`acc-tile acc-tile--${tone}`}
        style={{ '--acc-tile-size': `${size}px`, '--acc-tile-radius': `${radius}px` }}
        aria-hidden="true"
    >
        <Icon size={Math.round(size * 0.5)} strokeWidth={2} />
    </span>
);

const Panel = ({ children, className = '', sectionRef, section, raised = false, id, focused }) => (
    <section
        id={id}
        ref={sectionRef}
        data-acc-section={section}
        data-acc-focused={focused}
        style={{ scrollMarginTop: 'calc(var(--acc-head) + 60px)' }}
        className={`acc-panel${raised ? ' acc-panel--raised' : ''} ${className}`}
    >
        {children}
    </section>
);

const PanelHead = ({ icon, tone, eyebrow, title, hint, aside, count }) => (
    <header className="acc-panel-head">
        <div className="flex min-w-0 items-start gap-3">
            {icon ? <span className="mt-0.5 flex"><IconTile icon={icon} tone={tone} /></span> : null}
            <div className="min-w-0">
                {eyebrow ? <p className="acc-eyebrow">{eyebrow}</p> : null}
                <h2 className="acc-panel-title">
                    {title}
                    {typeof count === 'number' ? <span className="acc-count ml-2 align-middle">{count}</span> : null}
                </h2>
                {hint ? <p className="acc-panel-hint">{hint}</p> : null}
            </div>
        </div>
        {aside ? <div className="flex shrink-0 items-center gap-2 pt-0.5">{aside}</div> : null}
    </header>
);

const StatusPill = ({ status }) => {
    const Icon = status.icon;
    return (
        <span className={`acc-status acc-status--${status.tone}`}>
            <span className="acc-status-dot" />
            <Icon size={12} strokeWidth={2.2} />
            {status.label}
        </span>
    );
};

const MetricCell = ({ icon: Icon, tone = 'graphite', value, label, sub, onClick }) => (
    <button type="button" onClick={onClick} className="acc-metric group">
        <span className="flex items-center justify-between">
            <IconTile icon={Icon} tone={tone} size={30} radius={9} />
            <ChevronRight size={16} strokeWidth={2} className="acc-metric-chevron" />
        </span>
        <span className="min-w-0">
            <strong className="acc-metric-value">{value}</strong>
            <span className="acc-metric-label">{label}</span>
            <span className="acc-metric-sub">{sub}</span>
        </span>
    </button>
);

const EmptyState = ({ icon: Icon, tone = 'graphite', title, body, action }) => (
    <div className="acc-empty">
        <IconTile icon={Icon} tone={tone} size={44} radius={13} />
        <p className="acc-empty-title">{title}</p>
        {body ? <p className="acc-empty-body">{body}</p> : null}
        {action}
    </div>
);

const MyOrdersView = ({
    user,
    onBack,
    darkMode,
    wishlistItems = [],
    items = [],
    onOpenWishlist,
    onLogout,
}) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelSuccess, setShowCancelSuccess] = useState(false);
    const [showContactPopup, setShowContactPopup] = useState(false);
    const [orderToCancelId, setOrderToCancelId] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [ordersCursor, setOrdersCursor] = useState(null);
    const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [copiedTrackingOrderId, setCopiedTrackingOrderId] = useState(null);
    const [returnDraft, setReturnDraft] = useState(null);
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
    const [returnNotice, setReturnNotice] = useState(null);
    const [rewards, setRewards] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(true);
    const [copiedRewardId, setCopiedRewardId] = useState(null);
    const [activeSection, setActiveSection] = useState('commandes');
    const [focusedSection, setFocusedSection] = useState(null);
    const [focusMode, setFocusMode] = useState('overview'); // overview | opening | focus
    const [isReturning, setIsReturning] = useState(false);
    const enterIntentRef = useRef(null);
    const exitIntentRef = useRef(null);
    const swapPendingRef = useRef(false);
    const restoreScrollRef = useRef(0);
    const openTimerRef = useRef(null);
    const returnTimerRef = useRef(null);
    const closeFocusRef = useRef(null);
    const focusSwitchRef = useRef(null);
    const cancellationRequestIdsRef = useRef(new Map());
    const returnRequestIdsRef = useRef(new Map());
    const rootRef = useRef(null);
    const topRef = useRef(null);
    const ordersRef = useRef(null);
    const advantagesRef = useRef(null);
    const wishlistRef = useRef(null);
    const infoRef = useRef(null);
    const addressesRef = useRef(null);
    const invoicesRef = useRef(null);
    const helpRef = useRef(null);

    // Une seule table associe l'identifiant de section a son noeud: le rail,
    // les compteurs, le commutateur du mode focus et le FLIP y puisent tous.
    const sectionRefs = useMemo(() => ({
        commandes: ordersRef,
        avantages: advantagesRef,
        documents: invoicesRef,
        souhaits: wishlistRef,
        adresse: addressesRef,
        profil: infoRef,
        support: helpRef,
    }), []);
    const sectionFlag = (id) => (focusedSection ? String(focusedSection === id) : undefined);
    // Les paires de modules restent des items de grille meme videes de leur
    // contenu: sans ce drapeau, leur gouttiere s'ajoute a l'espace sous le
    // bandeau et les sections du bas se retrouvent plus basses que les autres.
    const groupFlag = (...ids) => (focusedSection ? String(ids.includes(focusedSection)) : undefined);

    /**
     * Position de lecture d'un module ouvert. On ne remonte jamais plus haut
     * que necessaire: le bandeau promotionnel deja chasse par le scroll ne
     * doit pas reapparaitre, et celui qui n'a pas encore bouge doit rester.
     * La cible haute place le contenu juste sous l'en-tete collant du site.
     */
    /**
     * Cale la hauteur du module ouvert pour que la course de defilement
     * s'arrete pile a la position de lecture. Les quelques pixels de rab
     * suffisaient sinon a faire glisser le panneau sous le bandeau et a
     * manger la marge qui les separe. La mesure tient compte de tout ce qui
     * precede et suit l'espace client (banniere, en-tete, menu), dont les
     * hauteurs ne sont pas connues du CSS.
     */
    const syncFocusHeight = (active) => {
        const root = rootRef.current;
        if (!root) return;
        root.style.minHeight = '';
        if (!active) return;
        const head = parseFloat(
            window.getComputedStyle(root).getPropertyValue('--acc-head')
        ) || 64;
        const above = root.getBoundingClientRect().top + window.scrollY;
        const below = Math.max(
            0,
            document.documentElement.scrollHeight - above - root.offsetHeight
        );
        root.style.minHeight = `${Math.max(0, window.innerHeight - head - below)}px`;
    };

    const scrollToFocusTop = () => {
        const root = rootRef.current;
        if (!root) return;
        const head = parseFloat(
            window.getComputedStyle(root).getPropertyValue('--acc-head')
        ) || 64;
        const contentTop = Math.max(0, root.getBoundingClientRect().top + window.scrollY - head);
        window.scrollTo(0, Math.min(window.scrollY, contentTop));
    };

    const customerName = user?.displayName || user?.email?.split('@')?.[0] || 'Client';
    const createdAt = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Inscription récente';

    const enrichedWishlist = useMemo(() => (
        wishlistItems.map(wishlistItem => {
            const live = items.find(item => item.id === wishlistItem.originalId || item.id === wishlistItem.id);
            return live || { id: wishlistItem.originalId || wishlistItem.id, ...wishlistItem, images: [wishlistItem.image] };
        })
    ), [items, wishlistItems]);

    // Ouvert en grand, le module montre toute la selection; en vue d'ensemble
    // il reste un apercu de quatre pieces.
    const isWishlistFocused = focusedSection === 'souhaits';
    const wishlistPreview = useMemo(() => (
        isWishlistFocused ? enrichedWishlist : enrichedWishlist.slice(0, 4)
    ), [enrichedWishlist, isWishlistFocused]);

    const latestOrder = orders[0];
    const latestShipping = latestOrder?.shipping || latestOrder?.shippingSnapshot || {};
    const hasShippingAddress = Boolean(
        latestShipping.address || latestShipping.street || latestShipping.line1
        || latestShipping.city || latestShipping.zip || latestShipping.postalCode
    );
    const addressLines = hasShippingAddress
        ? [
            latestShipping.fullName || latestShipping.name || customerName,
            latestShipping.address || latestShipping.street || latestShipping.line1,
            latestShipping.line2,
            formatShippingCityLine(latestShipping),
            latestShipping.country === 'FR'
                ? 'France'
                : (latestShipping.country || 'France'),
            latestShipping.phone || user?.phoneNumber,
        ].filter(Boolean)
        : [];

    const recentOrders = COMMERCE_V2_ORDER_READERS_ENABLED || focusedSection === 'commandes'
        ? orders
        : orders.slice(0, 6);
    const hasAddress = addressLines.length > 1;
    const refundedTotal = orders.reduce((sum, order) => (
        getRefundHelpText(order.status) ? sum + getRefundAmount(order) : sum
    ), 0);
    const orderDocuments = useMemo(() => (
        orders.flatMap((order) => (
            (order.documents || []).map((document) => ({ order, document }))
        ))
    ), [orders]);
    const latestReward = rewards[0] || null;
    const initials = getInitials(user?.displayName, user?.email);

    useEffect(() => {
        if (!user) return;
        if (COMMERCE_V2_ORDER_READERS_ENABLED) {
            let cancelled = false;
            setLoading(true);
            listMyOrdersV2({ pageSize: 25 })
                .then((result) => {
                    if (cancelled) return;
                    setOrders((result.orders || []).map((order) => ({
                        ...order,
                        ...adaptCommerceOrder(order, order.id),
                        allowedActions: order.allowedActions || []
                    })));
                    setOrdersCursor(result.nextCursor || null);
                    setLoading(false);
                })
                .catch((error) => {
                    if (cancelled) return;
                    console.error('Error fetching v2 orders:', error);
                    setLoading(false);
                });
            return () => {
                cancelled = true;
            };
        }

        const q = query(
            collection(db, 'orders'),
            where('userEmail', '==', user.email),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsub = onSnapshot(q, (snap) => {
            const fetchedOrders = snap.docs
                .map(d => ({ id: d.id, ...d.data() }));

            setOrders(fetchedOrders);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching orders:', err);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!user || user.isAnonymous) return undefined;
        let cancelled = false;
        setLoadingRewards(true);
        listMyNewsletterRewards()
            .then((result) => {
                if (!cancelled) setRewards(result.rewards || []);
            })
            .catch((error) => {
                if (!cancelled) console.error('Customer rewards loading failed:', error);
            })
            .finally(() => {
                if (!cancelled) setLoadingRewards(false);
            });
        return () => { cancelled = true; };
    }, [user]);

    // Surlignage du rail lateral aligne sur la section reellement lue.
    useEffect(() => {
        const container = rootRef.current;
        if (!container || typeof IntersectionObserver === 'undefined') return undefined;
        const nodes = Array.from(container.querySelectorAll('[data-acc-section]'));
        if (nodes.length === 0) return undefined;

        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            const next = visible[0]?.target?.dataset?.accSection;
            if (next) setActiveSection(next);
        }, { rootMargin: '-180px 0px -62% 0px', threshold: [0, 0.15, 0.5] });

        nodes.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, [loading, orders.length, orderDocuments.length, wishlistPreview.length]);

    // Bascule vers le plein cadre: la mise en page a change, on rejoue le
    // trajet du module depuis l'endroit exact ou l'utilisateur l'a quitte.
    useLayoutEffect(() => {
        if (focusMode !== 'focus') return;
        const intent = enterIntentRef.current;
        if (!intent) return;
        enterIntentRef.current = null;
        syncFocusHeight(true);
        scrollToFocusTop();
        runFlip(sectionRefs[intent.id]?.current, intent.first, 'enter');
    }, [focusMode, sectionRefs]);

    // Retour a la vue d'ensemble: le module regagne sa place pendant que le
    // decor remonte, et le scroll d'origine est restitue sans saut visible.
    useLayoutEffect(() => {
        if (focusMode !== 'overview') return;
        const intent = exitIntentRef.current;
        if (!intent) return;
        exitIntentRef.current = null;
        syncFocusHeight(false);
        window.scrollTo(0, restoreScrollRef.current || 0);
        runFlip(sectionRefs[intent.id]?.current, intent.first, 'exit');
    }, [focusMode, sectionRefs]);

    // Passage direct d'un module a un autre depuis le commutateur du bandeau.
    useEffect(() => {
        if (focusMode !== 'focus' || !focusedSection || !swapPendingRef.current) return undefined;
        swapPendingRef.current = false;
        const node = sectionRefs[focusedSection]?.current;
        if (!node) return undefined;
        syncFocusHeight(true);
        scrollToFocusTop();
        node.dataset.accSwap = 'in';
        const timer = window.setTimeout(() => { delete node.dataset.accSwap; }, 560);
        return () => window.clearTimeout(timer);
    }, [focusedSection, focusMode, sectionRefs]);

    // Un changement de taille de fenetre invalide la hauteur calculee.
    useEffect(() => {
        if (focusMode !== 'focus') return undefined;
        const handleResize = () => syncFocusHeight(true);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [focusMode, focusedSection]);

    useEffect(() => () => {
        if (rootRef.current) rootRef.current.style.minHeight = '';
    }, []);

    // Sur ecran etroit le commutateur defile: la pastille active reste visible.
    useEffect(() => {
        if (focusMode !== 'focus') return;
        const active = focusSwitchRef.current?.querySelector('[aria-current="true"]');
        active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }, [focusedSection, focusMode]);

    useEffect(() => () => {
        window.clearTimeout(openTimerRef.current);
        window.clearTimeout(returnTimerRef.current);
    }, []);

    useEffect(() => {
        if (!returnNotice || returnDraft) return undefined;
        const timer = window.setTimeout(() => setReturnNotice(null), 5200);
        return () => window.clearTimeout(timer);
    }, [returnNotice, returnDraft]);

    // Echap ferme la feuille active, comme une fenetre systeme.
    useEffect(() => {
        const hasOverlay = Boolean(returnDraft || orderToCancelId || showContactPopup || showCancelSuccess);
        if (!hasOverlay) return undefined;
        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            if (isSubmittingReturn || isCancelling) return;
            setReturnDraft(null);
            setOrderToCancelId(null);
            setShowContactPopup(false);
            setShowCancelSuccess(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [returnDraft, orderToCancelId, showContactPopup, showCancelSuccess, isSubmittingReturn, isCancelling]);

    // Echap referme le module ouvert, mais seulement si aucune feuille ne le
    // recouvre: la feuille reste prioritaire.
    useEffect(() => {
        if (focusMode === 'overview') return undefined;
        if (returnDraft || orderToCancelId || showContactPopup || showCancelSuccess || selectedDocument) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closeFocusRef.current?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusMode, returnDraft, orderToCancelId, showContactPopup, showCancelSuccess, selectedDocument]);

    const copyRewardCode = async (reward) => {
        if (!reward?.code) return;
        try {
            await navigator.clipboard.writeText(reward.code);
            setCopiedRewardId(reward.rewardId);
            window.setTimeout(() => setCopiedRewardId(null), 1800);
        } catch (error) {
            console.error('Reward code copy failed:', error);
        }
    };

    const loadMoreOrders = async () => {
        if (!COMMERCE_V2_ORDER_READERS_ENABLED || !ordersCursor || loadingMoreOrders) return;
        setLoadingMoreOrders(true);
        try {
            const result = await listMyOrdersV2({
                pageSize: 25,
                cursor: ordersCursor
            });
            setOrders((current) => [
                ...current,
                ...(result.orders || []).map((order) => ({
                    ...order,
                    ...adaptCommerceOrder(order, order.id),
                    allowedActions: order.allowedActions || []
                }))
            ]);
            setOrdersCursor(result.nextCursor || null);
        } finally {
            setLoadingMoreOrders(false);
        }
    };

    const handleConfirmCancel = async () => {
        const orderId = orderToCancelId;

        try {
            setIsCancelling(true);
            let requestId = cancellationRequestIdsRef.current.get(orderId);
            if (!requestId) {
                requestId = createCommerceCommandId('cancel');
                cancellationRequestIdsRef.current.set(orderId, requestId);
            }
            await requestOrderCancellation(
                orderId,
                'Annulation explicite demandee depuis espace client',
                requestId
            );

            setShowCancelSuccess(true);
            setOrders((current) => current.map((order) => (
                order.id === orderId
                    ? { ...order, allowedActions: [] }
                    : order
            )));
            setOrderToCancelId(null);
        } catch (e) {
            console.error('Erreur annulation:', e);
            setOrderToCancelId(null);
            setReturnNotice({
                type: 'error',
                text: 'L’annulation n’a pas pu être transmise. Réessayez dans quelques instants.'
            });
        } finally {
            setIsCancelling(false);
            setLoading(false);
        }
    };

    /**
     * Ouvre un module en plein cadre. Le decor recule d'abord (ACC_OPEN_DELAY),
     * puis la mise en page bascule et le FLIP prend le relais.
     */
    const openSection = (id) => {
        if (!id || !sectionRefs[id]) return;
        if (focusMode !== 'overview') {
            switchFocusSection(id);
            return;
        }

        const reduce = prefersReducedMotion();
        restoreScrollRef.current = window.scrollY;
        enterIntentRef.current = {
            id,
            first: reduce ? null : sectionRefs[id].current?.getBoundingClientRect() || null,
        };

        setFocusedSection(id);
        setActiveSection(id);
        window.clearTimeout(openTimerRef.current);
        if (reduce) {
            setFocusMode('focus');
            return;
        }
        setFocusMode('opening');
        openTimerRef.current = window.setTimeout(() => setFocusMode('focus'), ACC_OPEN_DELAY);
    };

    const switchFocusSection = (id) => {
        if (!id || !sectionRefs[id] || id === focusedSection) return;
        // Une ouverture encore en cours est abandonnee au profit du nouveau module.
        enterIntentRef.current = null;
        swapPendingRef.current = !prefersReducedMotion();
        setFocusedSection(id);
        setActiveSection(id);
        window.clearTimeout(openTimerRef.current);
        setFocusMode('focus');
    };

    const closeFocus = () => {
        if (focusMode === 'overview') return;
        const id = focusedSection;
        const reduce = prefersReducedMotion();

        window.clearTimeout(openTimerRef.current);
        exitIntentRef.current = {
            id,
            first: reduce ? null : sectionRefs[id]?.current?.getBoundingClientRect() || null,
        };

        setFocusedSection(null);
        setFocusMode('overview');
        setIsReturning(!reduce);
        window.clearTimeout(returnTimerRef.current);
        returnTimerRef.current = window.setTimeout(() => setIsReturning(false), 700);
    };

    closeFocusRef.current = closeFocus;

    const goToGallery = () => {
        onBack?.();
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    // Le module reste dans l'espace client; la page dediee garde son propre lien.
    const openWishlistPage = () => {
        if (onOpenWishlist) onOpenWishlist();
        else openSection('souhaits');
    };

    const openReturnRequest = (order) => {
        setReturnNotice(null);
        setReturnDraft({
            order,
            reason: 'changed_mind',
            note: '',
            lines: (order.items || [])
                .filter((line) => line.lineId)
                .map((line) => ({
                    lineId: line.lineId,
                    quantity: Number(line.quantity || 1),
                    title: line.titleSnapshot || line.name || 'Article',
                    selected: true
                }))
        });
    };

    const submitReturnRequest = async (event) => {
        event.preventDefault();
        if (!returnDraft || isSubmittingReturn) return;
        const lines = returnDraft.lines
            .filter((line) => line.selected)
            .map(({ lineId, quantity }) => ({ lineId, quantity }));
        if (lines.length === 0) {
            setReturnNotice({ type: 'error', text: 'Sélectionnez au moins un article.' });
            return;
        }
        setIsSubmittingReturn(true);
        setReturnNotice(null);
        try {
            let requestId = returnRequestIdsRef.current.get(returnDraft.order.id);
            if (!requestId) {
                requestId = createCommerceCommandId('customer-return');
                returnRequestIdsRef.current.set(returnDraft.order.id, requestId);
            }
            const result = await requestCustomerReturn({
                orderId: returnDraft.order.id,
                requestId,
                lines,
                reason: returnDraft.reason,
                note: returnDraft.note
            });
            setOrders((current) => current.map((order) => (
                order.id === returnDraft.order.id
                    ? { ...order, latestCustomerReturnRequest: result.request }
                    : order
            )));
            setReturnDraft(null);
            setReturnNotice({
                type: 'success',
                text: 'Votre demande a été transmise à l’atelier.'
            });
        } catch (error) {
            console.error('Customer return request failed:', error);
            setReturnNotice({
                type: 'error',
                text: 'La demande n’a pas pu être transmise. Réessayez dans quelques instants.'
            });
        } finally {
            setIsSubmittingReturn(false);
        }
    };

    const navItems = [
        { id: 'commandes', label: 'Commandes', Icon: ShoppingBag, tone: 'graphite' },
        { id: 'avantages', label: 'Avantages', Icon: TicketPercent, tone: 'gold' },
        { id: 'documents', label: 'Documents', Icon: FileText, tone: 'blue' },
        { id: 'souhaits', label: 'Liste de souhaits', Icon: Heart, tone: 'rose' },
        { id: 'adresse', label: 'Adresse', Icon: MapPin, tone: 'warm' },
        { id: 'profil', label: 'Profil', Icon: UserRound, tone: 'graphite' },
        { id: 'support', label: 'Support', Icon: Headphones, tone: 'warm' },
    ];

    const focusedNav = navItems.find((item) => item.id === focusedSection) || null;
    const ordersCountLabel = loading ? '—' : orders.length;
    const documentsCountLabel = loading ? '—' : orderDocuments.length;

    return (
        <div
            ref={rootRef}
            className="acc-root"
            data-acc-theme={darkMode ? 'dark' : 'light'}
            data-acc-mode={focusMode}
            data-acc-returning={isReturning ? 'true' : undefined}
        >
            <style dangerouslySetInnerHTML={{ __html: ACCOUNT_SURFACE_CSS }} />
            <div className="acc-backdrop" aria-hidden="true" />

            <div className="acc-shell mx-auto max-w-[1240px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
                <header ref={topRef} className="acc-hero pb-2.5 pt-6 lg:pb-3.5 lg:pt-7">
                    <span className="acc-crumb-shell">
                        <button type="button" onClick={goToGallery} className="acc-btn acc-crumb">
                            <ArrowLeft size={15} strokeWidth={2.2} />
                            Galerie
                        </button>
                    </span>

                    <div className="mt-0.5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,352px)] lg:items-center lg:gap-10">
                    <div className="flex min-w-0 flex-col items-start gap-3.5 sm:flex-row sm:items-center sm:gap-4">
                        <span className="acc-avatar" aria-hidden="true">{initials}</span>
                        <div className="min-w-0">
                            <h1 className="acc-hero-name truncate">Bonjour {customerName}</h1>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <span className="acc-badge">
                                    <ShieldCheck size={13} strokeWidth={2} style={{ color: 'var(--acc-accent)' }} />
                                    Espace personnel
                                </span>
                                <span className="acc-badge">
                                    <UserRound size={13} strokeWidth={2} />
                                    <span className="max-w-[210px] truncate">{user?.email || 'Compte connecté'}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="acc-panel acc-panel--raised p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="acc-eyebrow">Dernier dossier</p>
                            {!loading && latestOrder ? <StatusPill status={getStatusInfo(latestOrder.status)} /> : null}
                        </div>

                        {loading ? (
                            <div className="mt-3.5 flex items-center gap-3">
                                <div className="acc-skel h-[52px] w-[52px] rounded-[12px]" />
                                <div className="min-w-0 flex-1">
                                    <div className="acc-skel h-4 w-32" />
                                    <div className="acc-skel mt-2 h-3 w-24" />
                                </div>
                            </div>
                        ) : latestOrder ? (
                            <>
                                <div className="mt-3.5 flex items-center gap-3">
                                    <div className="acc-thumb h-[52px] w-[52px] shrink-0">
                                        <img src={getOrderImage(latestOrder, 0)} alt="" loading="lazy" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="acc-order-ref acc-ref truncate">{getOrderNumber(latestOrder)}</p>
                                        <p className="mt-0.5 text-[12.5px]" style={{ color: 'var(--acc-ink-2)' }}>
                                            {formatShortDate(latestOrder.createdAt)}
                                        </p>
                                    </div>
                                    <p className="acc-order-total ml-auto">{formatPrice(getOrderTotal(latestOrder))}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openSection('commandes')}
                                    className="acc-btn acc-btn--well mt-4 w-full"
                                >
                                    Voir le dossier
                                    <ChevronRight size={15} strokeWidth={2} />
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="mt-3 text-[17px] font-semibold" style={{ letterSpacing: '-.02em' }}>Aucune commande</p>
                                <p className="mt-1.5 text-[13px] leading-6" style={{ color: 'var(--acc-ink-2)' }}>
                                    La galerie est prête quand vous l’êtes.
                                </p>
                                <button type="button" onClick={goToGallery} className="acc-btn acc-btn--dark mt-4 w-full">
                                    Découvrir la galerie
                                    <ArrowRight size={15} strokeWidth={2} />
                                </button>
                            </>
                        )}
                    </div>
                    </div>
                </header>

                <nav className="acc-segments" aria-label="Sections de l’espace client">
                    {navItems.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => openSection(id)}
                            className="acc-segment"
                            aria-current={activeSection === id ? 'true' : undefined}
                        >
                            <Icon size={14} strokeWidth={2} />
                            {label}
                        </button>
                    ))}
                    <button type="button" onClick={onLogout} className="acc-segment">
                        <LogOut size={14} strokeWidth={2} />
                        Quitter
                    </button>
                </nav>

                <div className="acc-body mt-4 grid items-start gap-6 lg:mt-5 lg:grid-cols-[212px_minmax(0,1fr)] lg:gap-7">
                    <aside className="acc-rail" aria-label="Navigation de l’espace client">
                        <div className="acc-panel acc-rail-group">
                            {navItems.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => openSection(id)}
                                    className="acc-nav-item"
                                    aria-current={activeSection === id ? 'true' : undefined}
                                >
                                    <Icon size={16} strokeWidth={2} className="acc-nav-icon" />
                                    <span className="truncate">{label}</span>
                                    <span className="acc-nav-dot" />
                                </button>
                            ))}
                            <div className="acc-rail-sep" />
                            <button type="button" onClick={onLogout} className="acc-nav-item">
                                <LogOut size={16} strokeWidth={2} className="acc-nav-icon" />
                                <span className="truncate">Quitter</span>
                            </button>
                        </div>
                        <p className="px-3 pt-1 text-[11.5px] leading-5" style={{ color: 'var(--acc-ink-3)' }}>
                            Membre depuis {createdAt}
                        </p>
                    </aside>

                    <main className="grid min-w-0 gap-5">
                        {focusMode === 'focus' && focusedNav ? (
                            <div className="acc-focusdock">
                            <div className="acc-focusbar">
                                <button
                                    type="button"
                                    onClick={closeFocus}
                                    className="acc-btn acc-crumb shrink-0"
                                    aria-label="Revenir à la vue d’ensemble"
                                >
                                    <ArrowLeft size={15} strokeWidth={2.2} />
                                    <span className="acc-focus-back-label">Vue d’ensemble</span>
                                </button>
                                <span className="acc-focus-title">
                                    <IconTile icon={focusedNav.Icon} tone={focusedNav.tone} size={26} radius={8} />
                                    <span className="truncate">{focusedNav.label}</span>
                                </span>
                                <span ref={focusSwitchRef} className="acc-focus-switch" aria-label="Changer de module">
                                    {navItems.map(({ id, label, Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => switchFocusSection(id)}
                                            className="acc-focus-chip"
                                            aria-current={focusedSection === id ? 'true' : undefined}
                                            aria-label={label}
                                            title={label}
                                        >
                                            <Icon size={15} strokeWidth={2} />
                                        </button>
                                    ))}
                                </span>
                            </div>
                            </div>
                        ) : null}

                        <div className="acc-metrics">
                            <MetricCell
                                icon={ShoppingBag}
                                tone="graphite"
                                value={ordersCountLabel}
                                label="Commandes"
                                sub="Historique complet"
                                onClick={() => openSection('commandes')}
                            />
                            <MetricCell
                                icon={Receipt}
                                tone="blue"
                                value={documentsCountLabel}
                                label="Documents"
                                sub="Reçus et confirmations"
                                onClick={() => openSection('documents')}
                            />
                            <MetricCell
                                icon={Heart}
                                tone="rose"
                                value={wishlistItems.length}
                                label="Pièces suivies"
                                sub="Liste de souhaits"
                                onClick={() => openSection('souhaits')}
                            />
                            <MetricCell
                                icon={WalletCards}
                                tone="green"
                                value={loading ? '—' : formatPrice(refundedTotal)}
                                label="Remboursements"
                                sub="Suivi Stripe"
                                onClick={() => openSection('documents')}
                            />
                        </div>

                        <Panel
                            id="avantages"
                            sectionRef={advantagesRef}
                            section="avantages"
                            focused={sectionFlag('avantages')}
                            className="overflow-hidden"
                        >
                            <div className="grid gap-5 p-[18px] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3">
                                        <IconTile icon={TicketPercent} tone="gold" />
                                        <p className="acc-eyebrow">Mes avantages</p>
                                    </div>

                                    {loadingRewards ? (
                                        <>
                                            <div className="acc-skel mt-4 h-7 w-60 max-w-full" />
                                            <div className="acc-skel mt-3 h-3.5 w-44 max-w-full" />
                                        </>
                                    ) : latestReward ? (
                                        <>
                                            <h2 className="mt-3.5 text-[22px] font-semibold leading-tight" style={{ letterSpacing: '-.022em' }}>
                                                {latestReward.percentage} % à utiliser chez Seconde Vie
                                            </h2>
                                            <p className="acc-panel-hint">
                                                Code associé à votre adresse e-mail, valable jusqu’au {latestReward.expiresAt ? formatDate(latestReward.expiresAt) : 'délai indiqué par l’atelier'}.
                                                {rewards.length > 1 ? ` ${rewards.length - 1} autre avantage reste dans votre historique.` : ''}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="mt-3.5 text-[20px] font-semibold leading-tight" style={{ letterSpacing: '-.02em' }}>
                                                Aucun code enregistré
                                            </h2>
                                            <p className="acc-panel-hint">
                                                Retournez une carte dans la galerie avec cette adresse e-mail pour retrouver votre gain ici.
                                            </p>
                                        </>
                                    )}
                                </div>

                                {latestReward ? (
                                    <button
                                        type="button"
                                        onClick={() => copyRewardCode(latestReward)}
                                        className="acc-well group flex min-w-[224px] items-center justify-between gap-4 p-4 text-left transition-transform duration-200 active:scale-[.985]"
                                        aria-label={`Copier le code ${latestReward.code}`}
                                    >
                                        <span className="min-w-0">
                                            <span className="acc-eyebrow" style={{ color: 'var(--acc-accent)' }}>Votre code</span>
                                            <strong className="acc-ref mt-1.5 block text-[19px] font-semibold" style={{ letterSpacing: '.05em' }}>
                                                {latestReward.code}
                                            </strong>
                                        </span>
                                        <span className="acc-btn acc-btn--dark h-9 w-9 shrink-0 !px-0">
                                            {copiedRewardId === latestReward.rewardId
                                                ? <Check size={16} strokeWidth={2.4} />
                                                : <Copy size={15} strokeWidth={2} />}
                                        </span>
                                    </button>
                                ) : null}
                            </div>

                            {rewards.length > 1 ? (
                                <div className="px-[18px] py-4" style={{ boxShadow: 'inset 0 1px 0 var(--acc-line)' }}>
                                    <p className="acc-eyebrow">Historique des codes</p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {rewards.slice(1).map((reward) => (
                                            <button
                                                key={reward.rewardId}
                                                type="button"
                                                onClick={() => copyRewardCode(reward)}
                                                className="acc-well flex min-h-12 items-center justify-between gap-3 px-3 py-2.5 text-left transition-transform duration-200 active:scale-[.985]"
                                            >
                                                <span className="min-w-0">
                                                    <strong className="acc-ref block truncate text-[13px] font-semibold">{reward.code}</strong>
                                                    <small className="mt-0.5 block text-[11.5px]" style={{ color: 'var(--acc-ink-3)' }}>
                                                        {reward.percentage} % · {formatShortDate(reward.createdAt)}
                                                    </small>
                                                </span>
                                                {copiedRewardId === reward.rewardId
                                                    ? <Check size={15} strokeWidth={2.4} style={{ color: 'var(--acc-accent)' }} />
                                                    : <Copy size={14} strokeWidth={2} style={{ color: 'var(--acc-ink-3)' }} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </Panel>

                        <Panel
                            sectionRef={ordersRef}
                            section="commandes"
                            focused={sectionFlag('commandes')}
                            className="overflow-hidden"
                        >
                            <PanelHead
                                icon={ShoppingBag}
                                tone="graphite"
                                eyebrow="Historique"
                                title="Commandes"
                                count={!loading && orders.length > 0 ? orders.length : undefined}
                                hint="Paiement, livraison et remboursement restent lisibles dans le même dossier."
                                aside={(
                                    <button type="button" onClick={() => openSection('documents')} className="acc-btn acc-btn--well acc-btn--sm">
                                        Documents
                                        <ArrowUpRight size={14} strokeWidth={2} />
                                    </button>
                                )}
                            />

                            {loading ? (
                                <div className="acc-list">
                                    {[0, 1, 2].map((row) => (
                                        <div key={row} className="flex items-center gap-4 p-[18px]">
                                            <div className="acc-skel h-[64px] w-[64px] rounded-[12px]" />
                                            <div className="min-w-0 flex-1">
                                                <div className="acc-skel h-4 w-36 max-w-full" />
                                                <div className="acc-skel mt-2.5 h-3 w-24" />
                                            </div>
                                            <div className="acc-skel h-6 w-20 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : recentOrders.length === 0 ? (
                                <div className="p-[18px]">
                                    <EmptyState
                                        icon={Package}
                                        title="Aucune commande pour le moment"
                                        body="Chaque pièce restaurée que vous commandez apparaîtra ici avec son suivi, ses documents et son remboursement éventuel."
                                        action={(
                                            <button type="button" onClick={goToGallery} className="acc-btn acc-btn--dark mt-1">
                                                Découvrir la galerie
                                                <ArrowRight size={15} strokeWidth={2} />
                                            </button>
                                        )}
                                    />
                                </div>
                            ) : (
                                <div className="acc-list">
                                    {recentOrders.map((order, index) => {
                                        const status = getStatusInfo(order.status);
                                        const refundHelpText = getRefundHelpText(order.status);
                                        const itemsSummary = getOrderItemsSummary(order);
                                        const itemsCount = getOrderItemsCount(order);
                                        const documents = order.documents || [];
                                        const customerReturnCopy = getCustomerReturnRequestCopy(
                                            order.latestCustomerReturnRequest
                                        );
                                        const isTracked = ['shipped', 'delivered'].includes(order.fulfillmentStatus);

                                        return (
                                            <article key={order.id} className="acc-order">
                                                <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
                                                    <div className="acc-thumb h-16 w-16">
                                                        <img src={getOrderImage(order, index)} alt="" loading="lazy" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="acc-order-ref acc-ref">{getOrderNumber(order)}</p>
                                                        <p className="mt-1 text-[12.5px]" style={{ color: 'var(--acc-ink-2)' }}>
                                                            {formatDate(order.createdAt)}
                                                            {itemsCount > 0 ? ` · ${itemsCount} ${itemsCount > 1 ? 'pièces' : 'pièce'}` : ''}
                                                        </p>
                                                        {itemsSummary ? (
                                                            <p className="mt-2 line-clamp-2 text-[13.5px] leading-5" style={{ color: 'var(--acc-ink)' }}>
                                                                {itemsSummary}
                                                            </p>
                                                        ) : null}
                                                        <div className="mt-2.5 sm:hidden">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <StatusPill status={status} />
                                                                <p className="acc-order-total">{formatPrice(getOrderTotal(order))}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                                                        <p className="acc-order-total">{formatPrice(getOrderTotal(order))}</p>
                                                        <StatusPill status={status} />
                                                    </div>
                                                </div>

                                                {refundHelpText ? (
                                                    <div className="acc-note acc-note--blue sm:ml-20">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="acc-note-title">
                                                                Remboursement · <span className="acc-num">{formatPrice(getRefundAmount(order))}</span>
                                                            </p>
                                                            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--acc-ink-3)' }}>Stripe</span>
                                                        </div>
                                                        <p className="acc-note-body">{refundHelpText}</p>
                                                    </div>
                                                ) : null}

                                                {customerReturnCopy ? (
                                                    <div className="acc-note acc-note--amber sm:ml-20">
                                                        <p className="acc-note-title">Demande de retour</p>
                                                        <p className="acc-note-body">{customerReturnCopy}</p>
                                                    </div>
                                                ) : null}

                                                {isTracked ? (
                                                    <div className="acc-note acc-note--blue sm:ml-20">
                                                        <div className="flex items-center gap-2.5">
                                                            <IconTile icon={Truck} tone="blue" size={26} radius={8} />
                                                            <p className="acc-note-title">Suivi de livraison</p>
                                                        </div>
                                                        {order.shipmentTracking?.mode === 'tracked' ? (
                                                            <>
                                                                <p className="acc-note-body">{order.shipmentTracking.carrierLabel}</p>
                                                                <p className="acc-ref mt-1 break-all text-[13.5px] font-semibold">
                                                                    {order.shipmentTracking.trackingNumber}
                                                                </p>
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            try {
                                                                                await navigator.clipboard.writeText(order.shipmentTracking.trackingNumber);
                                                                                setCopiedTrackingOrderId(order.id);
                                                                            } catch {
                                                                                setCopiedTrackingOrderId(null);
                                                                            }
                                                                        }}
                                                                        className="acc-btn acc-btn--sm"
                                                                    >
                                                                        {copiedTrackingOrderId === order.id
                                                                            ? <Check size={14} strokeWidth={2.4} />
                                                                            : <Copy size={14} strokeWidth={2} />}
                                                                        {copiedTrackingOrderId === order.id ? 'Numéro copié' : 'Copier le numéro'}
                                                                    </button>
                                                                    {order.shipmentTracking.trackingUrl ? (
                                                                        <a
                                                                            href={order.shipmentTracking.trackingUrl}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="acc-btn acc-btn--dark acc-btn--sm"
                                                                        >
                                                                            Suivre mon colis
                                                                            <ExternalLink size={13} strokeWidth={2} />
                                                                        </a>
                                                                    ) : null}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className="acc-note-body">
                                                                Cette expédition ne possède pas de numéro de suivi. Le transporteur vous communiquera directement les modalités de remise.
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : null}

                                                <div className="flex flex-wrap items-center gap-2 sm:ml-20">
                                                    {documents.length > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => (
                                                                documents.length === 1
                                                                    ? setSelectedDocument({ order, document: documents[0] })
                                                                    : openSection('documents')
                                                            )}
                                                            className="acc-btn acc-btn--sm"
                                                        >
                                                            <FileText size={14} strokeWidth={2} />
                                                            {documents.length === 1 ? 'Ouvrir le document' : `${documents.length} documents`}
                                                        </button>
                                                    ) : (
                                                        <span className="acc-btn acc-btn--well acc-btn--sm" style={{ color: 'var(--acc-ink-3)', cursor: 'default' }}>
                                                            <FileText size={14} strokeWidth={2} />
                                                            Document à venir
                                                        </span>
                                                    )}

                                                    {canRequestReturn(order) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openReturnRequest(order)}
                                                            className="acc-btn acc-btn--accent acc-btn--sm"
                                                        >
                                                            Demander un retour ou un remboursement
                                                        </button>
                                                    ) : null}

                                                    {COMMERCE_V2_CLIENT_COMMANDS_ENABLED && canCancel(order) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setOrderToCancelId(order.id)}
                                                            className="acc-btn acc-btn--danger acc-btn--sm"
                                                        >
                                                            Annuler la commande
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </article>
                                        );
                                    })}

                                    {COMMERCE_V2_ORDER_READERS_ENABLED && ordersCursor ? (
                                        <div className="flex justify-center p-[18px]">
                                            <button
                                                type="button"
                                                onClick={loadMoreOrders}
                                                disabled={loadingMoreOrders}
                                                className="acc-btn acc-btn--well"
                                            >
                                                {loadingMoreOrders ? <Loader2 size={14} className="animate-spin" /> : null}
                                                {loadingMoreOrders ? 'Chargement…' : 'Charger plus de commandes'}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </Panel>

                        <div className="acc-pair grid gap-5 xl:grid-cols-2" data-acc-focused={groupFlag('documents', 'souhaits')}>
                            <Panel
                                sectionRef={invoicesRef}
                                section="documents"
                                focused={sectionFlag('documents')}
                                className="flex flex-col overflow-hidden"
                            >
                                <PanelHead
                                    icon={Receipt}
                                    tone="blue"
                                    eyebrow="Documents"
                                    title="Documents de commande"
                                    count={orderDocuments.length > 0 ? orderDocuments.length : undefined}
                                    hint="Reçus de paiement et confirmations de remboursement émis pour vos commandes."
                                />

                                {orderDocuments.length > 0 ? (
                                    <div className="acc-list">
                                        {orderDocuments.map(({ order, document }) => (
                                            <article
                                                key={`${order.id}-${document.documentId}`}
                                                className="flex flex-col gap-3 p-[18px] sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <IconTile
                                                        icon={document.kind === 'sandbox_refund_confirmation' ? WalletCards : FileText}
                                                        tone={document.kind === 'sandbox_refund_confirmation' ? 'green' : 'blue'}
                                                        size={32}
                                                        radius={9}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-[14px] font-semibold" style={{ letterSpacing: '-.012em' }}>
                                                            {getDocumentLabel(document)}
                                                        </p>
                                                        <p className="acc-num mt-1 break-words text-[12.5px] leading-5" style={{ color: 'var(--acc-ink-2)' }}>
                                                            {getOrderNumber(order)} · {formatShortDate(document.issuedAt)}
                                                            {Number.isSafeInteger(getDocumentAmount(document))
                                                                ? ` · ${formatPrice(getDocumentAmount(document) / 100)}`
                                                                : ''}
                                                        </p>
                                                        <p className="acc-eyebrow mt-1.5">Sandbox · document non fiscal</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDocument({ order, document })}
                                                    className="acc-btn shrink-0 self-start sm:self-center"
                                                >
                                                    <FileText size={14} strokeWidth={2} />
                                                    Ouvrir
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-1 flex-col justify-center p-[18px]">
                                        <EmptyState
                                            icon={Receipt}
                                            tone="blue"
                                            title="Aucun reçu émis"
                                            body="Les reçus de paiement et confirmations de remboursement apparaîtront ici dès la première opération."
                                        />
                                    </div>
                                )}

                                <p className="mt-auto px-[18px] py-4 text-[11.5px] leading-5" style={{ color: 'var(--acc-ink-3)', boxShadow: 'inset 0 1px 0 var(--acc-line)' }}>
                                    Ces documents attestent les opérations du sandbox. Ils ne constituent ni une facture ni un avoir fiscal.
                                </p>
                            </Panel>

                            <Panel
                                sectionRef={wishlistRef}
                                section="souhaits"
                                focused={sectionFlag('souhaits')}
                                className="flex flex-col overflow-hidden"
                            >
                                <PanelHead
                                    icon={Heart}
                                    tone="rose"
                                    eyebrow="Sélection"
                                    title="Liste de souhaits"
                                    count={enrichedWishlist.length > 0 ? enrichedWishlist.length : undefined}
                                    hint="Les pièces que vous gardez sous la main."
                                    aside={(
                                        <button type="button" onClick={openWishlistPage} className="acc-btn acc-btn--well acc-btn--sm">
                                            Ouvrir
                                            <ArrowUpRight size={14} strokeWidth={2} />
                                        </button>
                                    )}
                                />

                                <div className="flex flex-1 flex-col justify-center p-[18px]">
                                    {wishlistPreview.length === 0 ? (
                                        <EmptyState
                                            icon={Heart}
                                            tone="rose"
                                            title="Votre liste de souhaits est vide"
                                            body="Les pièces ajoutées au cœur apparaîtront ici."
                                            action={(
                                                <button type="button" onClick={openWishlistPage} className="acc-btn mt-1">
                                                    Ouvrir la liste de souhaits
                                                    <ArrowUpRight size={14} strokeWidth={2} />
                                                </button>
                                            )}
                                        />
                                    ) : (
                                        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4${isWishlistFocused ? ' lg:grid-cols-5 xl:grid-cols-6' : ''}`}>
                                            {wishlistPreview.map((item, index) => {
                                                const image = getItemImage(item) || FALLBACK_ITEM_IMAGES[index % FALLBACK_ITEM_IMAGES.length];
                                                const price = item.currentPrice || item.startingPrice || item.price;
                                                return (
                                                    <article key={`${item.id || index}-wishlist-preview`} className="group min-w-0">
                                                        <div className="acc-thumb aspect-[3/4] w-full">
                                                            <img
                                                                src={image}
                                                                alt={item.name || 'Pièce restaurée'}
                                                                loading="lazy"
                                                                className="transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-hover:scale-[1.04]"
                                                            />
                                                        </div>
                                                        <h3 className="mt-2.5 truncate text-[13px] font-semibold" style={{ letterSpacing: '-.01em' }}>
                                                            {item.name || 'Pièce restaurée'}
                                                        </h3>
                                                        <p className="acc-num mt-0.5 truncate text-[12.5px]" style={{ color: 'var(--acc-ink-2)' }}>
                                                            {price ? formatPrice(price) : 'Prix sur demande'}
                                                        </p>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Panel>
                        </div>

                        <div className="acc-pair grid gap-5 xl:grid-cols-2" data-acc-focused={groupFlag('adresse', 'profil')}>
                            <Panel
                                sectionRef={addressesRef}
                                section="adresse"
                                focused={sectionFlag('adresse')}
                                className="flex flex-col overflow-hidden"
                            >
                                <PanelHead
                                    icon={MapPin}
                                    tone="warm"
                                    eyebrow="Livraison"
                                    title="Adresses"
                                    hint="Les informations reprennent votre dernière commande."
                                    aside={(
                                        <span className={`acc-status acc-status--${hasAddress ? 'green' : 'neutral'}`}>
                                            <span className="acc-status-dot" />
                                            {hasAddress ? 'Enregistrée' : 'À compléter'}
                                        </span>
                                    )}
                                />

                                <div className="grid flex-1 gap-4 p-[18px] sm:grid-cols-2">
                                    <div className="acc-well min-w-0 p-4">
                                        <p className="acc-eyebrow">Livraison</p>
                                        <div className="mt-2.5 space-y-0.5 text-[13.5px] leading-6">
                                            {hasAddress
                                                ? addressLines.map((line) => <p key={line}>{line}</p>)
                                                : <p style={{ color: 'var(--acc-ink-2)' }}>Adresse à compléter</p>}
                                        </div>
                                    </div>
                                    <div className="acc-well min-w-0 p-4">
                                        <p className="acc-eyebrow">Facturation</p>
                                        <div className="mt-2.5 space-y-0.5 text-[13.5px] leading-6">
                                            {hasAddress
                                                ? addressLines.map((line) => <p key={`billing-${line}`}>{line}</p>)
                                                : <p style={{ color: 'var(--acc-ink-2)' }}>Identique à l’adresse de livraison</p>}
                                        </div>
                                    </div>
                                </div>
                            </Panel>

                            <Panel
                                sectionRef={infoRef}
                                section="profil"
                                focused={sectionFlag('profil')}
                                className="flex flex-col overflow-hidden"
                            >
                                <PanelHead
                                    icon={UserRound}
                                    tone="graphite"
                                    eyebrow="Compte"
                                    title="Informations personnelles"
                                    hint="Profil utilisé pour les commandes et confirmations e-mail."
                                />

                                <dl className="acc-list flex flex-1 flex-col">
                                    {[
                                        ['Nom complet', customerName],
                                        ['E-mail', user?.email || 'Non renseigné'],
                                        ['Téléphone', user?.phoneNumber || latestShipping.phone || 'À compléter'],
                                        ['Date d’inscription', createdAt],
                                    ].map(([label, value]) => (
                                        <div key={label} className="acc-field flex-1 content-center">
                                            <dt className="acc-field-key">{label}</dt>
                                            <dd className="acc-field-value">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </Panel>
                        </div>

                        <section
                            ref={helpRef}
                            data-acc-section="support"
                            data-acc-focused={sectionFlag('support')}
                            style={{ scrollMarginTop: 'calc(var(--acc-head) + 60px)' }}
                            className="acc-support"
                        >
                            <div className="relative z-[1] grid items-center gap-5 p-[22px] md:grid-cols-[minmax(0,1fr)_auto] md:p-6">
                                <div className="flex min-w-0 items-start gap-4">
                                    <IconTile icon={Headphones} tone="warm" size={42} radius={13} />
                                    <div className="min-w-0">
                                        <h2 className="text-[20px] font-semibold leading-tight" style={{ letterSpacing: '-.022em' }}>
                                            Besoin d’aide ?
                                        </h2>
                                        <p className="mt-2 max-w-xl text-[13.5px] leading-6" style={{ color: 'rgba(246,243,239,.72)' }}>
                                            Pour une question de livraison, de document ou de remboursement, l’atelier reprend le dossier de commande avec vous.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start gap-2 md:items-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactPopup(true)}
                                        className="acc-btn"
                                        style={{ background: '#fff', color: '#1a1918' }}
                                    >
                                        Nous contacter
                                        <ArrowRight size={15} strokeWidth={2} />
                                    </button>
                                    <p className="text-[12px]" style={{ color: 'rgba(246,243,239,.56)' }}>Réponse sous 24 h ouvrées</p>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {returnNotice && !returnDraft ? (
                <div className="acc-toast" role="status" aria-live="polite">
                    <IconTile
                        icon={returnNotice.type === 'error' ? AlertTriangle : Check}
                        tone={returnNotice.type === 'error' ? 'red' : 'green'}
                        size={26}
                        radius={8}
                    />
                    <span className="min-w-0">{returnNotice.text}</span>
                </div>
            ) : null}

            {returnDraft ? (
                <div className="acc-scrim" role="dialog" aria-modal="true" aria-label="Demande de retour ou de remboursement">
                    <form onSubmit={submitReturnRequest} className="acc-sheet">
                        <div className="acc-grabber" />
                        <div className="p-[22px]">
                            <IconTile icon={WalletCards} tone="warm" size={40} radius={12} />
                            <p className="acc-eyebrow mt-4">Demande client</p>
                            <h3 className="mt-1.5 text-[22px] font-semibold leading-tight" style={{ letterSpacing: '-.024em' }}>
                                Retour ou remboursement
                            </h3>
                            <p className="acc-panel-hint">
                                L’atelier choisira un remboursement direct si la pièce est encore sur place, sinon le remboursement interviendra après son retour et son inspection.
                            </p>

                            <fieldset className="mt-5 grid gap-2">
                                <legend className="acc-field-key mb-2">Articles concernés</legend>
                                {returnDraft.lines.map((line, index) => (
                                    <label key={line.lineId} className="acc-check">
                                        <input
                                            type="checkbox"
                                            checked={line.selected}
                                            onChange={(event) => setReturnDraft((current) => ({
                                                ...current,
                                                lines: current.lines.map((item, itemIndex) => (
                                                    itemIndex === index
                                                        ? { ...item, selected: event.target.checked }
                                                        : item
                                                ))
                                            }))}
                                        />
                                        <span className="min-w-0 flex-1 truncate font-semibold">{line.title}</span>
                                        <span className="acc-num" style={{ color: 'var(--acc-ink-3)' }}>x{line.quantity}</span>
                                    </label>
                                ))}
                            </fieldset>

                            <label className="mt-5 block">
                                <span className="acc-field-key">Motif</span>
                                <select
                                    value={returnDraft.reason}
                                    onChange={(event) => setReturnDraft((current) => ({ ...current, reason: event.target.value }))}
                                    className="acc-input mt-2"
                                >
                                    <option value="changed_mind">J’ai changé d’avis</option>
                                    <option value="damaged">La pièce est endommagée</option>
                                    <option value="not_as_expected">La pièce ne correspond pas à mes attentes</option>
                                    <option value="other">Autre motif</option>
                                </select>
                            </label>

                            <label className="mt-4 block">
                                <span className="acc-field-key">Commentaire facultatif</span>
                                <textarea
                                    value={returnDraft.note}
                                    onChange={(event) => setReturnDraft((current) => ({ ...current, note: event.target.value.slice(0, 1000) }))}
                                    rows={4}
                                    className="acc-input mt-2 resize-none"
                                    placeholder="Précisez votre demande…"
                                />
                            </label>

                            {returnNotice?.type === 'error' ? (
                                <p className="mt-3 text-[12.5px] font-semibold" style={{ color: '#a2382a' }}>{returnNotice.text}</p>
                            ) : null}

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReturnDraft(null)}
                                    disabled={isSubmittingReturn}
                                    className="acc-btn acc-btn--well h-11"
                                >
                                    Annuler
                                </button>
                                <button type="submit" disabled={isSubmittingReturn} className="acc-btn acc-btn--dark h-11">
                                    {isSubmittingReturn ? <Loader2 size={14} className="animate-spin" /> : null}
                                    Envoyer la demande
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : null}

            {showCancelSuccess && (
                <div className="acc-scrim" role="dialog" aria-modal="true" aria-label="Annulation confirmée">
                    <div className="acc-sheet max-w-[420px]">
                        <div className="acc-grabber" />
                        <div className="p-[26px] text-center">
                            <span className="mx-auto flex w-fit"><IconTile icon={Check} tone="green" size={48} radius={15} /></span>
                            <h3 className="mt-5 text-[21px] font-semibold" style={{ letterSpacing: '-.024em' }}>Annulation confirmée</h3>
                            <p className="mt-2.5 text-[13.5px] leading-6" style={{ color: 'var(--acc-ink-2)' }}>
                                Votre demande a bien été traitée. La commande a été retirée de votre historique.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowCancelSuccess(false)}
                                className="acc-btn acc-btn--dark mt-6 h-11 w-full"
                            >
                                J’ai compris
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {orderToCancelId && (
                <div className="acc-scrim">
                    <button
                        type="button"
                        className="acc-scrim-close"
                        aria-label="Fermer"
                        onClick={() => setOrderToCancelId(null)}
                    />
                    <div className="acc-sheet max-w-[420px]" role="dialog" aria-modal="true" aria-label="Confirmer l’annulation">
                        <div className="acc-grabber" />
                        <div className="p-[26px] text-center">
                            <span className="mx-auto flex w-fit"><IconTile icon={AlertTriangle} tone="gold" size={48} radius={15} /></span>
                            <h3 className="mt-5 text-[21px] font-semibold" style={{ letterSpacing: '-.024em' }}>Confirmer l’annulation</h3>
                            <p className="mt-2.5 text-[13.5px] leading-6" style={{ color: 'var(--acc-ink-2)' }}>
                                Cette action annule uniquement une commande non payée ou en attente de paiement. Une commande carte déjà payée demande un remboursement traité par l’atelier.
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOrderToCancelId(null)}
                                    disabled={isCancelling}
                                    className="acc-btn acc-btn--well h-11"
                                >
                                    Retour
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmCancel}
                                    disabled={isCancelling}
                                    className="acc-btn acc-btn--danger h-11"
                                >
                                    {isCancelling ? <><Loader2 size={14} className="animate-spin" /> Traitement</> : 'Confirmer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showContactPopup && (
                <div className="acc-scrim">
                    <button
                        type="button"
                        className="acc-scrim-close"
                        aria-label="Fermer"
                        onClick={() => setShowContactPopup(false)}
                    />
                    <div className="acc-sheet max-w-[420px]" role="dialog" aria-modal="true" aria-label="Contact vendeur">
                        <div className="acc-grabber" />
                        <button
                            type="button"
                            onClick={() => setShowContactPopup(false)}
                            className="acc-btn acc-btn--quiet absolute right-3 top-3 h-9 w-9 !px-0"
                            aria-label="Fermer"
                        >
                            <X size={17} strokeWidth={2} />
                        </button>

                        <div className="p-[26px] text-center">
                            <span className="mx-auto flex w-fit"><IconTile icon={MessageCircle} tone="graphite" size={48} radius={15} /></span>
                            <h3 className="mt-5 text-[21px] font-semibold" style={{ letterSpacing: '-.024em' }}>Contact vendeur</h3>
                            <p className="mt-2.5 text-[13.5px] leading-6" style={{ color: 'var(--acc-ink-2)' }}>
                                Pour toute question sur votre commande, contactez <strong style={{ color: 'var(--acc-ink)' }}>{CONTACT_NAME}</strong>.
                            </p>

                            {BUSINESS_PHONE && (
                                <a href={`tel:${BUSINESS_PHONE_TEL}`} className="acc-btn acc-btn--dark acc-num mt-6 h-11 w-full text-[15px]">
                                    {BUSINESS_PHONE}
                                </a>
                            )}

                            {REVIEW_URL && (
                                <a
                                    href={REVIEW_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="acc-btn acc-btn--quiet mx-auto mt-4"
                                >
                                    <Star size={14} strokeWidth={2} />
                                    Laisser un avis
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedDocument ? (
                <CommerceDocumentModal
                    entry={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                />
            ) : null}
        </div>
    );
};

export default MyOrdersView;
