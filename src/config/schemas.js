import { validateCamera } from '../cameras/index.js';

export async function validateCamerasConfig(config) {
  if (!config.cameras || !Array.isArray(config.cameras)) {
    throw new Error('cameras.yaml: "cameras" must be an array');
  }

  if (!config.qualities) {
    throw new Error('cameras.yaml: "qualities" section is required');
  }

  const requiredQualities = ['low', 'medium', 'high'];
  requiredQualities.forEach(q => {
    if (q !== 'high' && !config.qualities[q]) {
      throw new Error(`cameras.yaml: quality preset "${q}" is required`);
    }
    if (q !== 'high') {
      const preset = config.qualities[q];
      if (!preset.maxWidth || !preset.maxHeight || !preset.quality) {
        throw new Error(`cameras.yaml: quality preset "${q}" must have maxWidth, maxHeight, and quality`);
      }
    }
  });

  for (const camera of config.cameras) {
    if (!camera.id || !camera.name || !camera.type) {
      throw new Error(`Camera missing required fields (id, name, type)`);
    }

    await validateCamera(camera, config);
  }

  return true;
}

export function validateAccessConfig(config) {
  if (!config.users || !Array.isArray(config.users)) {
    throw new Error('access.yaml: "users" must be an array');
  }

  if (config.users.length === 0) {
    throw new Error('access.yaml: at least one user is required');
  }

  config.users.forEach((user, idx) => {
    if (!user.unique_link) {
      throw new Error(`access.yaml: User at index ${idx} missing unique_link`);
    }

    if (user.allowedCameras &&
        user.allowedCameras !== 'all' &&
        !Array.isArray(user.allowedCameras)) {
      throw new Error(`access.yaml: User "${user.unique_link}" allowedCameras must be 'all' or array`);
    }

    if (user.allowFromIPs && !Array.isArray(user.allowFromIPs)) {
      throw new Error(`access.yaml: User "${user.unique_link}" allowFromIPs must be an array`);
    }

    if (user.refreshInterval && typeof user.refreshInterval !== 'number') {
      throw new Error(`access.yaml: User "${user.unique_link}" refreshInterval must be a number`);
    }

    if (user.quality && !['low', 'medium', 'high'].includes(user.quality)) {
      throw new Error(`access.yaml: User "${user.unique_link}" quality must be one of: low, medium, high`);
    }
  });

  return true;
}
