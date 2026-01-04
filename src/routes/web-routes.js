import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import path from 'path';

export function createWebRoutes(cameraManager, authService) {
  const router = express.Router();

  // API to get camera list and settings (requires auth)
  router.get('/:unique_link/api/cameras', authMiddleware(authService), (req, res) => {
    try {
      const allCameras = cameraManager.getAllCameras();

      // Filter cameras by user access rights
      const allowedCameras = allCameras.filter(camera => {
        return authService.isAuthorized(req.user, camera.id);
      });

      logger.debug(`User ${req.user.name} has access to ${allowedCameras.length}/${allCameras.length} cameras`);

      res.json({
        cameras: allowedCameras,
        settings: {
          refreshInterval: req.user.refreshInterval,
          quality: req.user.quality
        }
      });
    } catch (error) {
      logger.error('Failed to get cameras list:', error.message);
      res.status(500).json({ error: 'Failed to get cameras list' });
    }
  });

  // Main page (web interface) with auth
  router.get('/:unique_link', authMiddleware(authService), (req, res) => {
    res.sendFile('index.html', { root: path.join(process.cwd(), 'src/public') });
  });

  return router;
}
