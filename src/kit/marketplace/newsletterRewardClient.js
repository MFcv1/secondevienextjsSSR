'use client';

import { getCallableFunction } from '../config/firebaseLazy';

const execute = async (name, payload) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const createNewsletterPlayId = () => (
  globalThis.crypto?.randomUUID?.()
  || Array.from(globalThis.crypto.getRandomValues(new Uint8Array(20)), (value) => value.toString(16).padStart(2, '0')).join('')
);

/* -------------------------------------------------------------------------
 * Repli local de developpement
 *
 * Les callables Gen2 exigent un jeton App Check enregistre : depuis un poste
 * de developpement le tirage echoue donc systematiquement, ce qui rend le jeu
 * de cartes intestable en local. On rejoue alors la mecanique du serveur
 * (memes ponderations, meme forme de reponse) pour pouvoir travailler l'UI.
 *
 * Ce repli n'existe qu'en build de developpement ET sur un hote local : un
 * `next build` (NODE_ENV=production), le sandbox et la production appellent
 * toujours la vraie fonction, et une erreur y reste une erreur.
 * ---------------------------------------------------------------------- */

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/* Adresses privees, de liaison locale et plage partagee des operateurs
   (100.64.0.0/10, celle qu'utilisent les VPN mailles type Tailscale). Un poste
   de developpement est couramment atteint depuis une autre machine du reseau,
   et `next dev` annonce lui-meme une adresse reseau a cote de localhost : s'y
   connecter desactivait le repli et faisait echouer tout tirage, alors que la
   meme page servie depuis localhost fonctionnait. */
const PRIVATE_HOSTNAME = /^(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

const canSimulateLocally = () => {
  if (process.env.NODE_ENV === 'production') return false;
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return LOCAL_HOSTNAMES.has(hostname)
    || hostname.endsWith('.local')
    || PRIVATE_HOSTNAME.test(hostname);
};

/* En local l'appel n'echoue pas vite : App Check met une dizaine de secondes a
   rendre son 403, pendant lesquelles la carte reste en vol. On ne l'attend pas
   pour basculer sur la simulation. Ce delai ne s'applique qu'aux hotes de
   developpement : ailleurs, l'appel garde son comportement normal. */
const LOCAL_FALLBACK_MS = 3000;

// Ponderations identiques a functions/src/newsletter/newsletterRewardDomain.js
const SIMULATED_WEIGHTS = [
  { percentage: 5, ceiling: 55 },
  { percentage: 10, ceiling: 85 },
  { percentage: 15, ceiling: 100 },
];

const SIMULATED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const simulatedPlays = new Map();

const randomInt = (bound) => {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] % bound;
};

const simulateDraw = (playId) => {
  // Le serveur memorise le tirage par playId : un rejeu rend le meme gain.
  if (!simulatedPlays.has(playId)) {
    const roll = randomInt(100);
    simulatedPlays.set(playId, SIMULATED_WEIGHTS.find((tier) => roll < tier.ceiling).percentage);
  }
  return {
    percentage: simulatedPlays.get(playId),
    expiresAt: new Date(Date.now() + SIMULATED_TTL_MS).toISOString(),
  };
};

const simulateClaim = (playId, email) => {
  const percentage = simulatedPlays.get(playId) || 5;
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let index = 0; index < 6; index += 1) suffix += alphabet[randomInt(alphabet.length)];
  const now = new Date();
  return {
    reward: {
      rewardId: `local_${playId.slice(0, 12)}`,
      code: `SV${percentage}-${suffix}`,
      percentage,
      status: 'active',
      campaign: 'newsletter_welcome_2026',
      emailStatus: 'sent',
      emailLower: String(email || '').trim().toLowerCase(),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SIMULATED_TTL_MS).toISOString(),
    },
    simulated: true,
  };
};

const withLocalFallback = async (label, call, simulate) => {
  const local = canSimulateLocally();
  try {
    if (!local) return await call();
    const pending = call();
    // L'appel peut echouer apres que la course a ete tranchee par le delai :
    // on absorbe ce rejet tardif, sans quoi il remonte en rejet non gere.
    pending.catch(() => {});
    let timer;
    try {
      return await Promise.race([
        pending,
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`pas de reponse en ${LOCAL_FALLBACK_MS} ms`)),
            LOCAL_FALLBACK_MS,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    if (!local) throw error;
    console.warn(
      `[newsletter] ${label} indisponible en local (${error?.code || error?.message || 'erreur inconnue'}). `
      + 'Tirage simule cote navigateur pour permettre le test de l’interface.',
    );
    return simulate();
  }
};

export const drawNewsletterReward = ({ playId, cardIndex }) => withLocalFallback(
  'drawNewsletterReward',
  () => execute('drawNewsletterReward', { playId, cardIndex }),
  () => simulateDraw(playId),
);

export const claimNewsletterReward = ({ playId, email, consent }) => withLocalFallback(
  'claimNewsletterReward',
  () => execute('claimNewsletterReward', { playId, email, consent }),
  () => simulateClaim(playId, email),
);

export const listMyNewsletterRewards = () => execute('listMyNewsletterRewards', {});
