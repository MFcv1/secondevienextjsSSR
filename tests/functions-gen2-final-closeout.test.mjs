import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  loadEvidence,
  runCloseout,
  trackedMarkdownReferences,
  validateEvidence,
  validateReferenceState
} from '../scripts/functions-gen2-final-closeout.mjs';

function clone(value) {
  return structuredClone(value);
}

test('les archives suivies par Git ne bloquent pas la cloture, les references actives oui', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-doc-closeout-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = [
    '_DOCS/ETAT_PROJET.md',
    'doc/archives/2026-09-04/map.md',
    'doc/archives-active/README.md'
  ];
  for (const file of files) {
    const absolutePath = path.join(root, file);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, 'Reference: FINALISATION_MIGRATION_GEN2.md\n');
  }
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['add', '--', ...files], { cwd: root });
  assert.deepEqual(trackedMarkdownReferences(root).sort(), [
    '_DOCS/ETAT_PROJET.md',
    'doc/archives-active/README.md'
  ]);
});

test('le verrou de cloture accepte uniquement le mode correspondant aux preuves courantes', () => {
  const evidence = loadEvidence();
  const mode = evidence.f6.automation.status === 'DISABLED'
    ? 'closed'
    : evidence.f6.status === 'COMPLETE' ? 'ready' : 'preflight';
  const result = runCloseout(undefined, mode);
  assert.equal(result.status, 'PASS');
  assert.equal(result.observationReady, mode !== 'preflight');
  assert.equal(result.referenceFiles.length > 0, mode !== 'closed');
});

test('la cloture refuse la fenetre F6 encore incomplete', () => {
  assert.throws(() => validateEvidence(loadEvidence(), { requireReady: true }), /F6 pas marquee COMPLETE/);
});

test('la cloture accepte uniquement une preuve de sept jours complete', () => {
  const evidence = clone(loadEvidence());
  evidence.f6.status = 'COMPLETE';
  evidence.f6.window.observedSeconds = 604801;
  evidence.f6.checkpoints.push({
    ...evidence.f6.checkpoints.at(-1),
    checkedAt: '2026-08-30T21:13:01.000Z',
    observedSeconds: 604801,
    request5xx: 0,
    errorSeverityEntries: 0,
    unqualifiedErrors: 0,
    qualification: 'NODE22_FINAL_WINDOW_QUIET_QUALIFIED'
  });
  evidence.f6.acceptance = {
    fullDurationReached: true,
    revisionUnchanged: true,
    configUnchanged: true,
    allErrorsQualified: true,
    readyToClose: true
  };
  assert.equal(validateEvidence(evidence, { requireReady: true }).observationReady, true);
  evidence.f5.finalConfig.maxInstances = 3;
  assert.throws(() => validateEvidence(evidence, { requireReady: true }), /Configuration finale F5 incoherente/);
});

test('le mode ferme refuse le plan, ses references et un heartbeat actif', () => {
  assert.throws(() => validateReferenceState({
    planExists: true,
    referenceFiles: ['AGENTS.md'],
    automationStatus: 'ACTIVE'
  }, 'closed'), /Plan temporaire encore present/);
  assert.doesNotThrow(() => validateReferenceState({
    planExists: false,
    referenceFiles: [],
    automationStatus: 'DISABLED'
  }, 'closed'));
});
