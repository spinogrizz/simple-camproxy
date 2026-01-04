import { fetchUnifiSnapshot } from './unifi-camera.js';
import { fetchReolinkSnapshot } from './reolink-camera.js';
import { logger } from '../utils/logger.js';

export class CameraManager {
  constructor(config) {
    this.config = config;
    this.cameras = new Map();

    // Create camera map for quick access
    config.cameras.forEach(camera => {
      this.cameras.set(camera.id, camera);
    });

    logger.info(`Camera manager initialized with ${this.cameras.size} cameras`);
  }

  async getSnapshot(id) {
    const camera = this.cameras.get(id);

    if (!camera) {
      throw new Error(`Camera not found: ${id}`);
    }

    logger.debug(`Getting snapshot for camera: ${id} (${camera.type})`);

    // Route to appropriate function based on camera type
    if (camera.type === 'unifi') {
      return fetchUnifiSnapshot(this.config, camera.cameraId);
    } else if (camera.type === 'reolink') {
      return fetchReolinkSnapshot(this.config, camera);
    } else {
      throw new Error(`Unknown camera type: ${camera.type}`);
    }
  }

  getCamera(id) {
    return this.cameras.get(id);
  }

  getAllCameras() {
    return Array.from(this.cameras.values()).map(cam => ({
      id: cam.id,
      name: cam.name,
      type: cam.type
    }));
  }
}
