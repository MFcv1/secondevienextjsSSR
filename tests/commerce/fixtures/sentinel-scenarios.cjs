'use strict';

const scenarios = {
  passing: async (context) => {
    context.equal(1, 1);
  },
  'false-assertion': async (context) => {
    context.equal('expected', 'deliberately-false');
  },
  'rejected-promise': async () => {
    throw new Error('deliberate rejected promise');
  },
  timeout: async () => new Promise(() => {}),
  incomplete: async (context) => {
    context.incomplete('deliberate incomplete scenario');
  },
  skipped: async (context) => {
    context.skip('deliberate skipped scenario');
  },
  todo: async (context) => {
    context.todo('deliberate todo scenario');
  },
  cancelled: async (context) => {
    context.cancel('deliberate cancelled scenario');
  },
  'open-handle': async (context) => {
    setInterval(() => {}, 1000);
    context.ok(true);
  },
};

module.exports = { scenarios };
