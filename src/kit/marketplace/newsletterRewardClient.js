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

const canSimulateLocally = () => {
  if (process.env.NODE_ENV === 'production') return false;
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return LOCAL_HOSTNAMES.has(hostname) || hostname.startsWith('192.168.');
};

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
  try {
    return await call();
  } catch (error) {
    if (!canSimulateLocally()) throw error;
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
