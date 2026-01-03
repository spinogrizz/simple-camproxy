import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import path from 'path';

export function createWebRoutes(cameraManager, authService) {
  const router = express.Router();

  // API для получения списка камер и настроек (требует авторизацию)
  router.get('/:unique_link/api/cameras', authMiddleware(authService), (req, res) => {
    try {
      const allCameras = cameraManager.getAllCameras();

      // Фильтруем камеры по правам доступа пользователя
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

  // Главная страница (веб-интерфейс) с авторизацией
  router.get('/:unique_link', authMiddleware(authService), (req, res) => {
    res.sendFile('index.html', { root: path.join(process.cwd(), 'src/public') });
  });

  return router;
}
