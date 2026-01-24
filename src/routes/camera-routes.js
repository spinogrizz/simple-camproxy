import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

export function createCameraRoutes(cameraManager, cacheService, imageService, authService, snapshotStorage) {
  const router = express.Router();

  function parseCropParam(cropParam) {
    if (!cropParam) {
      return null;
    }

    const raw = Array.isArray(cropParam) ? cropParam[0] : cropParam;
    if (typeof raw !== 'string') {
      throw new Error('Invalid crop parameter. Use crop=x,y,w,h');
    }

    const parts = raw.split(',').map(part => part.trim());
    if (parts.length !== 4) {
      throw new Error('Invalid crop parameter. Use crop=x,y,w,h');
    }

    const values = parts.map(value => Number(value));
    if (values.some(value => !Number.isFinite(value) || !Number.isInteger(value))) {
      throw new Error('Invalid crop parameter. Use crop=x,y,w,h');
    }

    const [left, top, width, height] = values;
    if (left < 0 || top < 0 || width <= 0 || height <= 0) {
      throw new Error('Invalid crop parameter. Use crop=x,y,w,h');
    }

    return { left, top, width, height, key: `${left},${top},${width},${height}` };
  }

  function parseRotateParam(rotateParam) {
    if (!rotateParam) {
      return null;
    }

    const raw = Array.isArray(rotateParam) ? rotateParam[0] : rotateParam;
    const angle = Number(raw);

    if (!Number.isFinite(angle)) {
      throw new Error('Invalid rotate parameter. Use rotate=degrees (e.g. rotate=2.5)');
    }

    // Limit to reasonable range for corrections
    if (angle < -45 || angle > 45) {
      throw new Error('Invalid rotate parameter. Must be between -45 and 45 degrees');
    }

    return angle;
  }

  router.get('/:unique_link/camera/:id/:quality', authMiddleware(authService), async (req, res, next) => {
    try {
      const { id, quality } = req.params;
      const crop = parseCropParam(req.query.crop);
      const rotate = parseRotateParam(req.query.rotate);
      const cropKey = crop ? crop.key : null;
      const rotateKey = rotate !== null ? rotate.toString() : null;

      // Validate quality
      const validQualities = ['low', 'medium', 'high'];
      if (!validQualities.includes(quality)) {
        throw new Error(`Invalid quality parameter. Must be one of: ${validQualities.join(', ')}`);
      }

      // Check camera access
      if (!authService.isAuthorized(req.user, id)) {
        throw new Error(`Unauthorized: No access to camera "${id}"`);
      }

      // Check cache (only for requests without crop/rotate)
      if (!crop && rotate === null) {
        const cached = cacheService.get(id, quality, null);
        if (cached) {
          logger.debug(`Cache hit: ${id}:${quality}`);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Camera-Id', id);
          res.setHeader('X-Quality', quality);
          return res.send(cached);
        }
      }

      // Get snapshot from camera
      logger.info(`Fetching snapshot: ${id}:${quality} for user ${req.user.name}`);
      const rawSnapshot = await cameraManager.getSnapshot(id);

      // Process image (high quality returns as is)
      const processedSnapshot = await imageService.processImage(rawSnapshot, quality, { crop, rotate });

      // Cache result (only for requests without crop/rotate)
      if (!crop && rotate === null) {
        cacheService.set(id, quality, null, processedSnapshot);
      }

      // Save to file for preview (only for requests without crop/rotate)
      if (snapshotStorage && !crop && rotate === null) {
        snapshotStorage.save(id, quality, processedSnapshot).catch(err => {
          logger.error('Failed to save snapshot to storage:', err.message);
        });
      }

      // Send response
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Camera-Id', id);
      res.setHeader('X-Quality', quality);
      res.send(processedSnapshot);

    } catch (error) {
      next(error);
    }
  });

  // Preview endpoint - returns last saved snapshot (for initial display)
  router.get('/:unique_link/camera/:id/:quality/preview', authMiddleware(authService), async (req, res, next) => {
    try {
      const { id, quality } = req.params;

      // Validate quality
      const validQualities = ['low', 'medium', 'high'];
      if (!validQualities.includes(quality)) {
        throw new Error(`Invalid quality parameter. Must be one of: ${validQualities.join(', ')}`);
      }

      // Check camera access
      if (!authService.isAuthorized(req.user, id)) {
        throw new Error(`Unauthorized: No access to camera "${id}"`);
      }

      // Load from storage
      if (snapshotStorage) {
        const snapshot = await snapshotStorage.load(id, quality);
        if (snapshot) {
          logger.debug(`Preview hit: ${id}:${quality}`);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('X-Preview', 'true');
          res.setHeader('X-Camera-Id', id);
          res.setHeader('X-Quality', quality);
          return res.send(snapshot);
        }
      }

      // If not in storage - return 404
      res.status(404).json({ error: 'Preview not available' });

    } catch (error) {
      next(error);
    }
  });

  return router;
}
