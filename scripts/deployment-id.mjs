import { randomBytes } from 'node:crypto';

const VALID_DEPLOYMENT_ID = /^[A-Za-z0-9_-]+$/;

export const createDeploymentId = ({
  now = () => Date.now(),
  entropy = () => randomBytes(6).toString('hex'),
} = {}) => {
  const deploymentId = `sv-${Number(now()).toString(36)}-${String(entropy())}`;

  if (!VALID_DEPLOYMENT_ID.test(deploymentId)) {
    throw new Error('Le deploymentId genere contient des caracteres non autorises.');
  }

  return deploymentId;
};

export const ensureDeploymentId = (environment, options) => {
  const configuredDeploymentId = String(environment.NEXT_DEPLOYMENT_ID || '').trim();
  const deploymentId = configuredDeploymentId || createDeploymentId(options);

  if (!VALID_DEPLOYMENT_ID.test(deploymentId)) {
    throw new Error(
      'NEXT_DEPLOYMENT_ID doit contenir uniquement des lettres, chiffres, tirets ou underscores.',
    );
  }

  environment.NEXT_DEPLOYMENT_ID = deploymentId;

  return {
    deploymentId,
    generated: !configuredDeploymentId,
  };
};
