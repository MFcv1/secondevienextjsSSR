import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const form = readFileSync(new URL('../src/kit/marketplace/QuoteFormIsland.jsx', import.meta.url), 'utf8');
const prep = readFileSync(new URL('../src/kit/marketplace/quotePhotoPrep.js', import.meta.url), 'utf8');
function section(source, start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Section introuvable : ${start}`);
  return source.slice(from, to);
}

function photoHarness() {
  let sequence = 0;
  const pending = [];
  const created = [], revoked = [];
  const scope = vm.createContext({
    useCallback: fn => fn,
    useEffect: fn => { scope.cleanup = fn(); },
    photoPreviewsRef: { current: [] }, photoQueueRef: { current: null },
    photoTasksRef: { current: new Map() }, submittingRef: { current: false },
    setPhotoPreviews() {}, setPhotoNotice() {}, trackQuoteStart() {},
    MAX_PHOTOS: 10,
    createQuotePhotoId: () => `photo-${sequence++}`,
    isLikelyImageFile: () => true,
    quotePhotoErrorMessage: () => 'Format illisible ici. Exportez-la en JPEG.',
    prepareQuotePhoto: file => new Promise((resolve, reject) => pending.push({ file, resolve, reject })),
    URL: {
      createObjectURL: blob => { const url = `blob:preview-${created.length}`; created.push({ url, blob }); return url; },
      revokeObjectURL: url => revoked.push(url),
    },
  });
  vm.runInContext(section(prep, 'export const createQuotePhotoQueue', 'export const quotePhotoToBase64').replace('export ', '')
    + section(form, '    const commitPhotos =', '    const trackQuoteStart =')
    + section(form, '    const preparePhoto =', '    const retryPhoto =')
    + '\nglobalThis.add = handleFiles;', scope);
  return { scope, pending, created, revoked };
}

test('la sélection enregistre ses tâches avant de rendre la main, puis libère le fichier brut', async () => {
  const h = photoHarness();
  h.scope.add([{ name: 'meuble.jpg' }]);
  assert.equal(h.scope.photoTasksRef.current.size, 1);
  await new Promise(setImmediate);
  h.pending[0].resolve({ blob: { jpeg: true } });
  await Promise.all(h.scope.photoTasksRef.current.values());
  assert.equal(h.scope.photoPreviewsRef.current[0].status, 'ready');
  assert.equal(h.scope.photoPreviewsRef.current[0].file, null);
  h.scope.cleanup();
  assert.deepEqual(h.revoked, ['blob:preview-0']);
});

test('quitter le formulaire pendant une préparation ne crée aucun aperçu tardif', async () => {
  const h = photoHarness();
  h.scope.add([{ name: 'meuble.jpg' }, { name: 'pieds.jpg' }]);
  const tasks = [...h.scope.photoTasksRef.current.values()];
  await new Promise(setImmediate);
  h.scope.cleanup();
  h.pending[0].resolve({ blob: {} });
  await Promise.all(tasks);
  assert.equal(h.created.length, 0);
  assert.equal(h.pending.length, 1, 'la seconde image ne doit pas être décodée après le départ');
});

test('la file poursuit après une erreur et ignore les photos retirées avant leur tour', async () => {
  const h = photoHarness();
  h.scope.photoPreviewsRef.current = [{ id: 'bad' }, { id: 'removed' }, { id: 'good' }];
  vm.runInContext('globalThis.run = preparePhoto;', h.scope);
  const tasks = ['bad', 'removed', 'good'].map(id => h.scope.run(id, { name: id }));
  h.scope.photoPreviewsRef.current = h.scope.photoPreviewsRef.current.filter(p => p.id !== 'removed');
  await new Promise(setImmediate);
  h.pending[0].reject(new Error('decode failed'));
  await new Promise(setImmediate);
  assert.equal(h.pending[1].file.name, 'good');
  h.pending[1].resolve({ blob: {} });
  await Promise.all(tasks);
  assert.deepEqual(Array.from(h.scope.photoPreviewsRef.current, p => p.status), ['error', 'ready']);
});

test('l’envoi attend la préparation puis revient aux Photos en cas d’erreur, sans créer de demande', async () => {
  let finish;
  const scope = vm.createContext({
    submittingRef: { current: false }, trackQuoteStart() {}, step: 6, ESTIMATE_STEP_INDEX: 6,
    PHOTO_STEP_INDEX: 2, validateContact: () => true, setErrors() {},
    photoPreviewsRef: { current: [{ status: 'preparing' }] },
    photoTasksRef: { current: new Map([['one', new Promise(resolve => { finish = resolve; })]]) },
    setSubmissionState: value => { scope.state = value; },
    setPhotoNotice: value => { scope.notice = value; },
    goToStep: value => { assert.equal(scope.submittingRef.current, false); scope.destination = value; },
  });
  vm.runInContext(section(form, '    const handleSubmit =', '    const inputClass =') + '\nglobalThis.submit = handleSubmit;', scope);
  const submit = scope.submit({ preventDefault() {} });
  assert.equal(scope.state.message, 'Préparation des photos…');
  scope.photoPreviewsRef.current[0].status = 'error';
  finish();
  await submit;
  assert.equal(scope.destination, 2);
  assert.equal(scope.state.status, 'idle');
  assert.match(scope.notice, /Réessayez ou retirez/);
});

test('les grilles restent dans le cadre pour 1 à 10 photos sur ordinateur et mobile', () => {
  const scope = vm.createContext({});
  vm.runInContext(section(form, 'const PHOTO_STEP_INDEX', 'const formatRange') + '\nglobalThis.compute = computePhotoGrid;', scope);
  for (const width of [280, 335, 375, 480, 640, 800, 1100, 1280]) {
    for (const height of [80, 180, 280, 380, 480]) {
      for (let count = 1; count <= 10; count++) {
        for (const desktop of [true, false]) {
          const grid = scope.compute({ width, height, count, desktop });
          assert.ok(grid.columns * grid.size + (grid.columns - 1) * grid.gap <= width);
          const rows = Math.ceil(count / grid.columns);
          if (desktop && !grid.scroll) assert.ok(rows * grid.size + (rows - 1) * grid.gap <= height);
        }
      }
    }
  }
});
