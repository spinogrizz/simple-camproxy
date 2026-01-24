export class BaseCamera {
  constructor(config, camera) {
    this.config = config;
    this.camera = camera;
  }

  getCredentials(globalConfigKey) {
    const username = this.camera.username || this.config[globalConfigKey]?.username;
    const password = this.camera.password || this.config[globalConfigKey]?.password;
    return { username, password };
  }

  async fetchSnapshot() {
    throw new Error('fetchSnapshot must be implemented');
  }

  static validate(camera, config, globalKey) {
    if (!camera.host) {
      throw new Error(`Camera "${camera.id}" missing host`);
    }
    const hasGlobal = config[globalKey]?.username && config[globalKey]?.password;
    const hasLocal = camera.username && camera.password;
    if (!hasGlobal && !hasLocal) {
      throw new Error(`Camera "${camera.id}" must have username/password either globally or locally`);
    }
  }
}
