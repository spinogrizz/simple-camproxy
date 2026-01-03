import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

export function createWebRoutes(cameraManager, authService) {
  const router = express.Router();

  // API для получения списка камер (требует авторизацию)
  router.get('/api/cameras', authMiddleware(authService), (req, res) => {
    try {
      const allCameras = cameraManager.getAllCameras();

      // Фильтруем камеры по правам доступа пользователя
      const allowedCameras = allCameras.filter(camera => {
        return authService.isAuthorized(req.user, camera.id);
      });

      logger.debug(`User ${req.user.username} has access to ${allowedCameras.length}/${allCameras.length} cameras`);

      res.json({ cameras: allowedCameras });
    } catch (error) {
      logger.error('Failed to get cameras list:', error.message);
      res.status(500).json({ error: 'Failed to get cameras list' });
    }
  });

  // Главная страница (веб-интерфейс)
  // Не требует авторизации, так как статические файлы уже защищены в index.js
  router.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'src/public' });
  });

  return router;
}
