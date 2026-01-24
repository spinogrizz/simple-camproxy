export function validateCamerasConfig(config) {
  // Check required sections
  if (!config.cameras || !Array.isArray(config.cameras)) {
    throw new Error('cameras.yaml: "cameras" must be an array');
  }

  if (!config.qualities) {
    throw new Error('cameras.yaml: "qualities" section is required');
  }

  // Validate quality presets
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

  // Validate cameras
  config.cameras.forEach((camera, idx) => {
    if (!camera.id || !camera.name || !camera.type) {
      throw new Error(`cameras.yaml: Camera at index ${idx} missing required fields (id, name, type)`);
    }

    const validTypes = ['unifi', 'reolink', 'dahua', 'hikvision', 'iptronic'];
    if (!validTypes.includes(camera.type)) {
      throw new Error(`cameras.yaml: Invalid camera type "${camera.type}" for camera "${camera.id}"`);
    }

    // Validate type-specific fields
    if (camera.type === 'unifi') {
      if (!camera.cameraId) {
        throw new Error(`cameras.yaml: UniFi camera "${camera.id}" missing cameraId`);
      }
      if (!config.unifi) {
        throw new Error('cameras.yaml: "unifi" section is required for UniFi cameras');
      }
      if (!config.unifi.baseUrl || !config.unifi.apiKey) {
        throw new Error('cameras.yaml: "unifi" section must have baseUrl and apiKey');
      }
    }

    if (camera.type === 'reolink') {
      if (!camera.host) {
        throw new Error(`cameras.yaml: Reolink camera "${camera.id}" missing host`);
      }
      const hasGlobal = config.reolink && config.reolink.username && config.reolink.password;
      const hasLocal = camera.username && camera.password;
      if (!hasGlobal && !hasLocal) {
        throw new Error(`cameras.yaml: Reolink camera "${camera.id}" must have username/password either globally or locally`);
      }
    }

    if (camera.type === 'dahua') {
      if (!camera.host) {
        throw new Error(`cameras.yaml: Dahua camera "${camera.id}" missing host`);
      }
      const hasGlobal = config.dahua && config.dahua.username && config.dahua.password;
      const hasLocal = camera.username && camera.password;
      if (!hasGlobal && !hasLocal) {
        throw new Error(`cameras.yaml: Dahua camera "${camera.id}" must have username/password either globally or locally`);
      }
    }

    if (camera.type === 'hikvision') {
      if (!camera.host) {
        throw new Error(`cameras.yaml: Hikvision camera "${camera.id}" missing host`);
      }
      const hasGlobal = config.hikvision && config.hikvision.username && config.hikvision.password;
      const hasLocal = camera.username && camera.password;
      if (!hasGlobal && !hasLocal) {
        throw new Error(`cameras.yaml: Hikvision camera "${camera.id}" must have username/password either globally or locally`);
      }
    }

    if (camera.type === 'iptronic') {
      if (!camera.host) {
        throw new Error(`cameras.yaml: IPtronic camera "${camera.id}" missing host`);
      }
      const hasGlobal = config.iptronic && config.iptronic.username && config.iptronic.password;
      const hasLocal = camera.username && camera.password;
      if (!hasGlobal && !hasLocal) {
        throw new Error(`cameras.yaml: IPtronic camera "${camera.id}" must have username/password either globally or locally`);
      }
    }
  });

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
    // Check required fields
    if (!user.unique_link) {
      throw new Error(`access.yaml: User at index ${idx} missing unique_link`);
    }

    // allowedCameras can be 'all' or array
    if (user.allowedCameras &&
        user.allowedCameras !== 'all' &&
        !Array.isArray(user.allowedCameras)) {
      throw new Error(`access.yaml: User "${user.unique_link}" allowedCameras must be 'all' or array`);
    }

    // allowFromIPs must be array
    if (user.allowFromIPs && !Array.isArray(user.allowFromIPs)) {
      throw new Error(`access.yaml: User "${user.unique_link}" allowFromIPs must be an array`);
    }

    // refreshInterval must be number if specified
    if (user.refreshInterval && typeof user.refreshInterval !== 'number') {
      throw new Error(`access.yaml: User "${user.unique_link}" refreshInterval must be a number`);
    }

    // quality must be one of allowed values
    if (user.quality && !['low', 'medium', 'high'].includes(user.quality)) {
      throw new Error(`access.yaml: User "${user.unique_link}" quality must be one of: low, medium, high`);
    }
  });

  return true;
}
