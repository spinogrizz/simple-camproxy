import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';

export class SnapshotStorage {
  constructor() {
    this.storageDir = process.env.SNAPSHOT_STORAGE || '/tmp/camproxy-snapshots';
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      logger.info(`Snapshot storage initialized at ${this.storageDir}`);
    } catch (error) {
      logger.error('Failed to create snapshot storage directory:', error.message);
    }
  }

  getFilePath(cameraId, quality) {
    return path.join(this.storageDir, `${cameraId}_${quality}.jpg`);
  }

  async save(cameraId, quality, imageBuffer) {
    try {
      const filePath = this.getFilePath(cameraId, quality);
      await fs.writeFile(filePath, imageBuffer);
      logger.debug(`Saved snapshot: ${cameraId}:${quality} (${imageBuffer.length} bytes)`);
    } catch (error) {
      logger.error(`Failed to save snapshot ${cameraId}:${quality}:`, error.message);
    }
  }

  async load(cameraId, quality) {
    try {
      const filePath = this.getFilePath(cameraId, quality);
      const buffer = await fs.readFile(filePath);
      logger.debug(`Loaded snapshot from storage: ${cameraId}:${quality} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to load snapshot ${cameraId}:${quality}:`, error.message);
      }
      return null;
    }
  }

  async exists(cameraId, quality) {
    try {
      const filePath = this.getFilePath(cameraId, quality);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
