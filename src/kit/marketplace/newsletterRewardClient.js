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

export const drawNewsletterReward = ({ playId, cardIndex }) => (
  execute('drawNewsletterReward', { playId, cardIndex })
);

export const claimNewsletterReward = ({ playId, email, consent }) => (
  execute('claimNewsletterReward', { playId, email, consent })
);

export const listMyNewsletterRewards = () => execute('listMyNewsletterRewards', {});
