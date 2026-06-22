#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { DEPLOY_TARGETS, PROJECT_NAME, SANDBOX } from './config.mjs';
import {
  checkBuildArtifact,
  checkEnvFile,
  checkFirebaseCLI,
  checkFirebaseJson,
  checkGitStatus,
  getCurrentProject,
  getFirebaseUser,
} from './checks.mjs';
import {
  buildProject,
  deployAppHosting,
  deployEverything,
  deployFirestore,
  deployFunctions,
  deployStorage,
  switchProject,
} from './runner.mjs';

const ok = (msg) => console.log(chalk.green(`  OK  ${msg}`));
const warn = (msg) => console.log(chalk.yellow(`  !   ${msg}`));
const fail = (msg) => console.log(chalk.red(`  X   ${msg}`));
const step = (title) => {
  console.log('');
  console.log(chalk.bold(`  -- ${title}`));
  console.log('');
};

function showHeader() {
  console.clear();

  const project = getCurrentProject();
  const git = checkGitStatus();
  const badge = project.envName === 'sandbox'
    ? chalk.bgCyan.black.bold(' SANDBOX ')
    : chalk.bgGray.white.bold(' INCONNU ');

  console.log('');
  console.log(chalk.bold.white('  FIREBASE DEPLOY DASHBOARD'));
  console.log(chalk.gray(`       ${PROJECT_NAME}`));
  console.log('');
  console.log(`  Projet cible  ->  ${chalk.bgCyan.black.bold(' SANDBOX ')}  ${chalk.gray(SANDBOX.projectId)}`);
  console.log(`  Projet actif  ->  ${badge}  ${chalk.gray(project.projectId ?? '?')}`);

  if (git.ok) {
    const branchLabel = git.clean
      ? chalk.green(`${git.branch} clean`)
      : chalk.yellow(`${git.branch} - ${git.changes} fichier(s) non commite(s)`);
    console.log(`  Branch git    ->  ${branchLabel}`);
  }

  console.log('');
  console.log(chalk.gray('  ' + '-'.repeat(64)));
  console.log(`  ${chalk.cyan('App Hosting')}  ${chalk.underline(SANDBOX.url)}`);
  console.log(`  ${chalk.cyan('Health URL')}    ${chalk.underline(new URL(SANDBOX.healthPath, SANDBOX.url).toString())}`);
  console.log(`  ${chalk.cyan('Rollouts')}      ${chalk.underline(SANDBOX.rolloutConsoleUrl)}`);
  console.log(`  ${chalk.cyan('Backend ID')}    ${SANDBOX.appHostingBackendId}`);
  console.log(chalk.gray('  ' + '-'.repeat(64)));
  console.log('');
}

async function checkGalleryHealth() {
  const url = new URL(SANDBOX.healthPath, SANDBOX.url).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });
    return { ok: response.ok, status: response.status, url };
  } catch (err) {
    return { ok: false, error: err.message, url };
  } finally {
    clearTimeout(timeout);
  }
}

function showInfraCommands() {
  step('COMMANDES INFRA ET OBSERVABILITE');
  console.log(chalk.gray('  npm run infra:env'));
  console.log(chalk.gray('  npm run infra:deploy'));
  console.log(chalk.gray(`  firebase functions:log --project ${SANDBOX.projectId}`));
  console.log(chalk.gray(`  firebase functions:log --only stripeWebhook --project ${SANDBOX.projectId}`));
  console.log('');
  console.log(`  Rollback App Hosting : ${chalk.underline(SANDBOX.rolloutConsoleUrl)}`);
  console.log(chalk.gray('  Ouvrir le backend App Hosting, choisir un rollout stable, puis lancer Roll back depuis la console Firebase.'));
  console.log('');
}

function runPreChecks({ requireBuild = false } = {}) {
  const cli = checkFirebaseCLI();
  if (!cli.ok) return cli;
  ok(`Firebase CLI ${cli.version}`);

  const env = checkEnvFile();
  if (!env.ok) return env;
  ok(`${SANDBOX.envFile} pointe vers ${SANDBOX.projectId}`);

  const firebaseJson = checkFirebaseJson();
  if (!firebaseJson.ok) return firebaseJson;
  ok(`firebase.json declare ${DEPLOY_TARGETS.appHosting}`);

  const git = checkGitStatus();
  if (git.ok && git.clean) {
    ok(`Git : branch "${git.branch}" clean`);
  } else if (git.ok) {
    warn(`Git : ${git.changes} fichier(s) non commite(s) sur "${git.branch}"`);
  }

  if (requireBuild) {
    const build = checkBuildArtifact();
    if (!build.ok) return build;
    ok(`Build Next verifie dans .next/ pour ${SANDBOX.projectId}`);
  }

  return { ok: true };
}

async function switchToSandbox() {
  const spinner = ora(`  Bascule vers ${SANDBOX.projectId}...`).start();
  const result = switchProject();
  if (!result.ok) {
    spinner.fail(chalk.red(`  X  ${result.error}`));
    return false;
  }
  spinner.succeed(chalk.green(`  OK Projet Firebase actif -> ${SANDBOX.projectId}`));
  return true;
}

async function runBuildGate() {
  step(`BUILD SANDBOX (npm run ${SANDBOX.buildScript})`);
  const result = await buildProject();
  if (!result.ok) {
    fail(`Build echoue : ${result.error}`);
    return false;
  }

  step('VERIFICATION POST-BUILD');
  const artifact = checkBuildArtifact();
  if (!artifact.ok) {
    fail(artifact.error);
    return false;
  }

  ok(`.next/ contient ${SANDBOX.projectId}`);
  ok('Aucun ID Firebase interdit detecte dans les artefacts Next controles');
  return true;
}

async function runAppDeploy() {
  const start = Date.now();
  step('PRE-CHECKS');
  const checks = runPreChecks();
  if (!checks.ok) { fail(checks.error); return; }
  if (!await switchToSandbox()) return;
  if (!await runBuildGate()) return;

  step(`DEPLOIEMENT APP HOSTING -> ${SANDBOX.label}`);
  console.log(chalk.gray(`  firebase deploy --only ${DEPLOY_TARGETS.appHosting} --project ${SANDBOX.projectId}`));
  console.log('');

  const result = await deployAppHosting();
  if (!result.ok) { fail(`Deploiement echoue : ${result.error}`); return; }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  ok(`App Hosting sandbox deploye en ${duration}s`);
  console.log(`  URL : ${chalk.underline(SANDBOX.url)}`);
  console.log(`  Rollouts : ${chalk.underline(SANDBOX.rolloutConsoleUrl)}`);
  const health = await checkGalleryHealth();
  health.ok
    ? ok(`Health /galerie OK (${health.status}) - ${health.url}`)
    : warn(`Health /galerie non confirme : ${health.error || `HTTP ${health.status}`} - ${health.url}`);
  console.log('');
}

async function runFunctionsDeploy() {
  step('DEPLOY FUNCTIONS -> SANDBOX');
  const checks = runPreChecks();
  if (!checks.ok) { fail(checks.error); return; }
  if (!await switchToSandbox()) return;

  console.log(chalk.gray(`\n  firebase deploy --only ${DEPLOY_TARGETS.functions} --project ${SANDBOX.projectId}\n`));
  const result = await deployFunctions();
  result.ok ? ok('Cloud Functions deployees en sandbox') : fail(result.error);
  console.log('');
}

async function runFirestoreDeploy() {
  step('DEPLOY FIRESTORE RULES + INDEXES -> SANDBOX');
  const checks = runPreChecks();
  if (!checks.ok) { fail(checks.error); return; }
  if (!await switchToSandbox()) return;

  console.log(chalk.gray(`\n  firebase deploy --only ${DEPLOY_TARGETS.firestore} --project ${SANDBOX.projectId}\n`));
  const result = await deployFirestore();
  result.ok ? ok('Firestore rules + indexes deployes en sandbox') : fail(result.error);
  console.log('');
}

async function runStorageDeploy() {
  step('DEPLOY STORAGE RULES -> SANDBOX');
  const checks = runPreChecks();
  if (!checks.ok) { fail(checks.error); return; }
  if (!await switchToSandbox()) return;

  console.log(chalk.gray(`\n  firebase deploy --only ${DEPLOY_TARGETS.storage} --project ${SANDBOX.projectId}\n`));
  const result = await deployStorage();
  result.ok ? ok('Storage rules deployees en sandbox') : fail(result.error);
  console.log('');
}

async function runEverythingDeploy() {
  console.log('');
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Tout deployer sur la SANDBOX (${SANDBOX.projectId}) ?`,
    default: false,
  }]);
  if (!confirm) {
    console.log(chalk.yellow('\n  Annule.\n'));
    return;
  }

  const start = Date.now();
  step('PRE-CHECKS');
  const checks = runPreChecks();
  if (!checks.ok) { fail(checks.error); return; }
  if (!await switchToSandbox()) return;
  if (!await runBuildGate()) return;

  step('DEPLOIEMENT COMPLET -> SANDBOX');
  const only = [
    DEPLOY_TARGETS.appHosting,
    DEPLOY_TARGETS.functions,
    DEPLOY_TARGETS.firestore,
    DEPLOY_TARGETS.storage,
  ].join(',');
  console.log(chalk.gray(`  firebase deploy --only ${only} --project ${SANDBOX.projectId}`));
  console.log(chalk.gray('  (App Hosting + Functions + Firestore rules/indexes + Storage rules)'));
  console.log('');

  const result = await deployEverything();
  if (!result.ok) { fail(`Deploiement echoue : ${result.error}`); return; }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  ok(`Tout deploye en sandbox en ${duration}s`);
  console.log(`  URL : ${chalk.underline(SANDBOX.url)}`);
  console.log(`  Rollouts : ${chalk.underline(SANDBOX.rolloutConsoleUrl)}`);
  const health = await checkGalleryHealth();
  health.ok
    ? ok(`Health /galerie OK (${health.status}) - ${health.url}`)
    : warn(`Health /galerie non confirme : ${health.error || `HTTP ${health.status}`} - ${health.url}`);
  console.log('');
}

async function showStatus() {
  step('ETAT COMPLET DU SYSTEME');

  const cli = checkFirebaseCLI();
  cli.ok ? ok(`Firebase CLI ${cli.version}`) : fail(cli.error);

  const user = getFirebaseUser();
  user.ok ? ok(`Compte connecte : ${chalk.bold(user.email)}`) : fail(user.error);

  const project = getCurrentProject();
  if (project.ok && project.envName === 'sandbox') {
    ok(`Projet actif : ${chalk.bgCyan.black(' SANDBOX ')} ${project.projectId}`);
  } else if (project.ok) {
    warn(`Projet actif hors sandbox : ${project.projectId ?? 'inconnu'}`);
  } else {
    warn(project.error);
  }

  const env = checkEnvFile();
  env.ok ? ok(`${SANDBOX.envFile} valide`) : fail(env.error);

  const firebaseJson = checkFirebaseJson();
  firebaseJson.ok ? ok(`firebase.json configure ${DEPLOY_TARGETS.appHosting}`) : fail(firebaseJson.error);

  const build = checkBuildArtifact();
  build.ok ? ok('.next/ verifie pour la sandbox') : warn(build.error);

  const health = await checkGalleryHealth();
  health.ok
    ? ok(`Health /galerie OK (${health.status}) - ${health.url}`)
    : warn(`Health /galerie non confirme : ${health.error || `HTTP ${health.status}`} - ${health.url}`);

  const git = checkGitStatus();
  if (git.ok) {
    git.clean
      ? ok(`Git : branch "${git.branch}" clean`)
      : warn(`Git : branch "${git.branch}" - ${git.changes} fichier(s) non commite(s)`);
  }

  showInfraCommands();
  console.log('');
}

async function main() {
  if (process.argv.includes('--status')) {
    await showStatus();
    return;
  }

  const cli = checkFirebaseCLI();
  if (!cli.ok) {
    console.log(chalk.red(`\n  ERREUR : ${cli.error}\n`));
    process.exit(1);
  }

  let running = true;
  while (running) {
    showHeader();

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Que veux-tu faire ?',
      pageSize: 10,
      choices: [
        {
          name: `${chalk.cyan.bold('Deployer App Hosting SANDBOX')}  ${chalk.gray('build local + source deploy Next SSR')}`,
          value: 'app',
        },
        new inquirer.Separator(chalk.gray('  ' + '-'.repeat(48))),
        { name: `Functions uniquement            ${chalk.gray('(sans rebuild du site)')}`, value: 'functions' },
        { name: `Firestore rules + indexes      ${chalk.gray('(firestore.rules + firestore.indexes.json)')}`, value: 'firestore' },
        { name: `Storage rules uniquement       ${chalk.gray('(storage.rules)')}`, value: 'storage' },
        new inquirer.Separator(chalk.gray('  ' + '-'.repeat(48))),
        {
          name: `${chalk.magenta.bold('TOUT deployer en SANDBOX')}    ${chalk.gray('app + functions + firestore + storage')}`,
          value: 'everything',
        },
        new inquirer.Separator(chalk.gray('  ' + '-'.repeat(48))),
        { name: 'Voir l\'etat complet', value: 'status' },
        { name: chalk.gray('Quitter'), value: 'quit' },
      ],
    }]);

    switch (action) {
      case 'app':
        await runAppDeploy();
        break;
      case 'functions':
        await runFunctionsDeploy();
        break;
      case 'firestore':
        await runFirestoreDeploy();
        break;
      case 'storage':
        await runStorageDeploy();
        break;
      case 'everything':
        await runEverythingDeploy();
        break;
      case 'status':
        await showStatus();
        break;
      case 'quit':
        running = false;
        console.log(chalk.gray('\n  Au revoir.\n'));
        break;
    }

    if (running) {
      await inquirer.prompt([{
        type: 'input',
        name: '_',
        message: chalk.gray('Appuie sur Entree pour revenir au menu...'),
      }]);
    }
  }
}

main().catch((err) => {
  console.error(chalk.red(`\n  ERREUR FATALE : ${err.message}\n`));
  process.exit(1);
});
