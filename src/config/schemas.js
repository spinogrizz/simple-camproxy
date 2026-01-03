export function validateCamerasConfig(config) {
  // Проверка наличия секций
  if (!config.cameras || !Array.isArray(config.cameras)) {
    throw new Error('cameras.yaml: "cameras" must be an array');
  }

  if (!config.qualities) {
    throw new Error('cameras.yaml: "qualities" section is required');
  }

  // Валидация пресетов качества
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

  // Валидация камер
  config.cameras.forEach((camera, idx) => {
    if (!camera.id || !camera.name || !camera.type) {
      throw new Error(`cameras.yaml: Camera at index ${idx} missing required fields (id, name, type)`);
    }

    if (!['unifi', 'reolink'].includes(camera.type)) {
      throw new Error(`cameras.yaml: Invalid camera type "${camera.type}" for camera "${camera.id}"`);
    }

    // Валидация специфичных полей
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
      // username/password могут быть глобальными или локальными
      const hasGlobal = config.reolink && config.reolink.username && config.reolink.password;
      const hasLocal = camera.username && camera.password;
      if (!hasGlobal && !hasLocal) {
        throw new Error(`cameras.yaml: Reolink camera "${camera.id}" must have username/password either globally or locally`);
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
    // Проверяем обязательные поля
    if (!user.unique_link) {
      throw new Error(`access.yaml: User at index ${idx} missing unique_link`);
    }

    // allowedCameras может быть 'all' или массивом
    if (user.allowedCameras &&
        user.allowedCameras !== 'all' &&
        !Array.isArray(user.allowedCameras)) {
      throw new Error(`access.yaml: User "${user.unique_link}" allowedCameras must be 'all' or array`);
    }

    // allowFromIPs должен быть массивом
    if (user.allowFromIPs && !Array.isArray(user.allowFromIPs)) {
      throw new Error(`access.yaml: User "${user.unique_link}" allowFromIPs must be an array`);
    }

    // refreshInterval должен быть числом если указан
    if (user.refreshInterval && typeof user.refreshInterval !== 'number') {
      throw new Error(`access.yaml: User "${user.unique_link}" refreshInterval must be a number`);
    }

    // quality должен быть одним из допустимых значений
    if (user.quality && !['low', 'medium', 'high'].includes(user.quality)) {
      throw new Error(`access.yaml: User "${user.unique_link}" quality must be one of: low, medium, high`);
    }
  });

  return true;
}
