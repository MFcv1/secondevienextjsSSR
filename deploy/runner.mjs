import { spawn, execSync } from 'node:child_process';
import { DEPLOY_TARGETS, SANDBOX } from './config.mjs';

function runLive(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (exitCode) => {
      const windowsLibuvShutdownCode = 3221226505;
      if (exitCode === 0 || exitCode === windowsLibuvShutdownCode) {
        resolve();
        return;
      }
      reject(new Error(`La commande a echoue (code de sortie : ${exitCode})`));
    });

    proc.on('error', (err) => {
      reject(new Error(`Impossible de lancer "${command}" : ${err.message}`));
    });
  });
}

export function switchProject() {
  try {
    execSync(`firebase use ${SANDBOX.alias}`, { stdio: 'pipe' });
    return { ok: true };
  } catch {
    try {
      execSync(`firebase use ${SANDBOX.projectId}`, { stdio: 'pipe' });
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: `Impossible de basculer vers "${SANDBOX.projectId}". Verifie .firebaserc.`,
      };
    }
  }
}

export async function buildProject() {
  try {
    await runLive('npm', ['run', SANDBOX.buildScript]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function deployOnly(targets) {
  try {
    await runLive('firebase', [
      'deploy',
      '--only',
      targets.join(','),
      '--project',
      SANDBOX.projectId,
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export const deployAppHosting = () => deployOnly([DEPLOY_TARGETS.appHosting]);
export const deployFunctions = () => deployOnly([DEPLOY_TARGETS.functions]);
export const deployFirestore = () => deployOnly([DEPLOY_TARGETS.firestore]);
export const deployStorage = () => deployOnly([DEPLOY_TARGETS.storage]);

export const deployEverything = () => deployOnly([
  DEPLOY_TARGETS.appHosting,
  DEPLOY_TARGETS.functions,
  DEPLOY_TARGETS.firestore,
  DEPLOY_TARGETS.storage,
]);
