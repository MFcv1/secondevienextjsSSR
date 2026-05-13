import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FORBIDDEN_IDS, SANDBOX } from './config.mjs';

const TEXT_EXTENSIONS = new Set(['.js', '.json', '.html', '.rsc', '.txt']);

function parseVersion(raw) {
  const match = raw.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function isAtLeast(version, minimum) {
  for (let i = 0; i < minimum.length; i += 1) {
    if (version[i] > minimum[i]) return true;
    if (version[i] < minimum[i]) return false;
  }
  return true;
}

function walkFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export function checkFirebaseCLI() {
  try {
    const rawVersion = execSync('firebase --version', { stdio: 'pipe' }).toString();
    const version = parseVersion(rawVersion);
    if (!version) {
      return { ok: false, error: `Version Firebase CLI illisible : ${rawVersion.trim()}` };
    }
    if (!isAtLeast(version, [14, 4, 0])) {
      return {
        ok: false,
        error: `Firebase CLI ${rawVersion.trim()} trop ancien. App Hosting local source demande 14.4.0 minimum.`,
      };
    }
    return { ok: true, version: rawVersion.trim() };
  } catch {
    return {
      ok: false,
      error: 'Firebase CLI non installe. Lance : npm install -g firebase-tools',
    };
  }
}

export function getFirebaseUser() {
  try {
    const result = execSync('firebase login:list', { stdio: 'pipe' }).toString();
    const match = result.match(/Logged in as (\S+)/);
    if (match) return { ok: true, email: match[1] };
    return { ok: false, error: 'Non connecte a Firebase. Lance : firebase login' };
  } catch {
    return { ok: false, error: 'Impossible de verifier le compte Firebase' };
  }
}

export function getCurrentProject() {
  try {
    const result = execSync('firebase use', { stdio: 'pipe' }).toString();
    const hasSandbox = result.includes(SANDBOX.projectId);
    const projectId = hasSandbox
      ? SANDBOX.projectId
      : result.split(/\r?\n/).find(Boolean)?.trim() ?? null;
    return {
      ok: true,
      projectId,
      envName: projectId === SANDBOX.projectId ? SANDBOX.name : null,
    };
  } catch {
    return {
      ok: false,
      error: 'Aucun projet Firebase actif. Lance une action du dashboard pour basculer en sandbox.',
    };
  }
}

export function checkEnvFile() {
  if (!fs.existsSync(SANDBOX.envFile)) {
    return { ok: false, error: `Fichier ${SANDBOX.envFile} introuvable` };
  }

  const content = fs.readFileSync(SANDBOX.envFile, 'utf8');
  const accepted = [
    `VITE_FIREBASE_PROJECT_ID=${SANDBOX.projectId}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${SANDBOX.projectId}`,
  ];

  if (!accepted.some((line) => content.includes(line))) {
    return {
      ok: false,
      error: `${SANDBOX.envFile} ne pointe pas vers "${SANDBOX.projectId}"`,
    };
  }

  return { ok: true };
}

export function checkFirebaseJson() {
  if (!fs.existsSync('firebase.json')) {
    return { ok: false, error: 'firebase.json introuvable' };
  }

  const config = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  const appHosting = Array.isArray(config.apphosting) ? config.apphosting : [];
  const backend = appHosting.find((entry) => entry.backendId === SANDBOX.appHostingBackendId);

  if (!backend) {
    return {
      ok: false,
      error: `firebase.json ne declare pas apphosting:${SANDBOX.appHostingBackendId}`,
    };
  }

  return { ok: true };
}

export function checkBuildArtifact() {
  if (!fs.existsSync(path.join('.next', 'BUILD_ID'))) {
    return { ok: false, error: 'Aucun build Next dans .next/. Lance npm run build.' };
  }

  const files = [
    ...walkFiles(path.join('.next', 'static')),
    ...walkFiles(path.join('.next', 'server')),
  ].filter((file) => TEXT_EXTENSIONS.has(path.extname(file)));

  let foundProjectId = false;
  const foundForbidden = new Set();

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(SANDBOX.projectId)) foundProjectId = true;
    for (const forbiddenId of FORBIDDEN_IDS) {
      if (content.includes(forbiddenId)) foundForbidden.add(forbiddenId);
    }
  }

  if (foundForbidden.size > 0) {
    return {
      ok: false,
      error: `ALERTE : le build contient des IDs interdits : ${[...foundForbidden].join(', ')}`,
    };
  }

  if (!foundProjectId) {
    return {
      ok: false,
      error: `Le build ne contient pas "${SANDBOX.projectId}". Mauvais environnement de build ?`,
    };
  }

  return { ok: true };
}

export function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { stdio: 'pipe' }).toString().trim();
    const branch = execSync('git branch --show-current', { stdio: 'pipe' }).toString().trim();
    return {
      ok: true,
      clean: status === '',
      branch,
      changes: status.split('\n').filter(Boolean).length,
    };
  } catch {
    return { ok: false, error: 'Impossible de lire le statut git' };
  }
}
