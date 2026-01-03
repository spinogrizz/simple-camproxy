import NodeCache from 'node-cache';
import { logger } from '../utils/logger.js';

export class CacheService {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 2,  // TTL по умолчанию 2 секунды
      checkperiod: options.checkperiod || 3,
      useClones: false  // Не клонируем буферы для производительности
    });

    this.cache.on('expired', (key) => {
      logger.debug(`Cache expired: ${key}`);
    });

    logger.info('Cache service initialized with TTL:', this.cache.options.stdTTL, 'seconds');
  }

  getCacheKey(cameraId, quality) {
    return `${cameraId}:${quality}`;
  }

  get(cameraId, quality) {
    const key = this.getCacheKey(cameraId, quality);
    return this.cache.get(key);
  }

  set(cameraId, quality, imageBuffer) {
    const key = this.getCacheKey(cameraId, quality);
    this.cache.set(key, imageBuffer);
    logger.debug(`Cached: ${key}`);
  }

  getStats() {
    return this.cache.getStats();
  }

  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }
}
