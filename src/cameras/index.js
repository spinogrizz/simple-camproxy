import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorsPath = path.join(__dirname, 'vendors');

const classCache = new Map();

function getSupportedTypes() {
  return fs.readdirSync(vendorsPath)
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));
}

async function loadCameraClass(type) {
  if (classCache.has(type)) {
    return classCache.get(type);
  }
  try {
    const module = await import(`./vendors/${type}.js`);
    classCache.set(type, module.default);
    return module.default;
  } catch (err) {
    throw new Error(`Unknown camera type: ${type}`);
  }
}

export async function validateCamera(camera, config) {
  const supportedTypes = getSupportedTypes();
  if (!supportedTypes.includes(camera.type)) {
    throw new Error(`Invalid camera type "${camera.type}". Supported: ${supportedTypes.join(', ')}`);
  }
  const CameraClass = await loadCameraClass(camera.type);
  CameraClass.validate(camera, config);
}

export class CameraManager {
  constructor(config) {
    this.config = config;
    this.cameras = new Map();
    config.cameras.forEach(cam => this.cameras.set(cam.id, cam));
    logger.info(`Camera manager initialized with ${this.cameras.size} cameras`);
  }

  async getSnapshot(id) {
    const camera = this.cameras.get(id);
    if (!camera) throw new Error(`Camera not found: ${id}`);

    const CameraClass = await loadCameraClass(camera.type);
    const instance = new CameraClass(this.config, camera);
    return instance.fetchSnapshot();
  }

  getCamera(id) {
    return this.cameras.get(id);
  }

  getAllCameras() {
    return Array.from(this.cameras.values())
      .map(c => ({ id: c.id, name: c.name, type: c.type }));
  }
}
