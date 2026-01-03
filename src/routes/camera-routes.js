import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

export function createCameraRoutes(cameraManager, cacheService, imageService, authService, snapshotStorage) {
  const router = express.Router();

  router.get('/:unique_link/camera/:id/:quality', authMiddleware(authService), async (req, res, next) => {
    try {
      const { id, quality } = req.params;

      // Валидация качества
      const validQualities = ['low', 'medium', 'high'];
      if (!validQualities.includes(quality)) {
        throw new Error(`Invalid quality parameter. Must be one of: ${validQualities.join(', ')}`);
      }

      // Проверяем права доступа к камере
      if (!authService.isAuthorized(req.user, id)) {
        throw new Error(`Unauthorized: No access to camera "${id}"`);
      }

      // Проверяем кэш
      const cached = cacheService.get(id, quality);
      if (cached) {
        logger.debug(`Cache hit: ${id}:${quality}`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Camera-Id', id);
        res.setHeader('X-Quality', quality);
        return res.send(cached);
      }

      // Получаем снимок с камеры
      logger.info(`Fetching snapshot: ${id}:${quality} for user ${req.user.name}`);
      const rawSnapshot = await cameraManager.getSnapshot(id);

      // Обрабатываем изображение (для high - возвращается as is)
      const processedSnapshot = await imageService.processImage(rawSnapshot, quality);

      // Кэшируем
      cacheService.set(id, quality, processedSnapshot);

      // Сохраняем в файл для preview
      if (snapshotStorage) {
        snapshotStorage.save(id, quality, processedSnapshot).catch(err => {
          logger.error('Failed to save snapshot to storage:', err.message);
        });
      }

      // Отправляем ответ
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Camera-Id', id);
      res.setHeader('X-Quality', quality);
      res.send(processedSnapshot);

    } catch (error) {
      next(error);
    }
  });

  // Preview endpoint - возвращает последний сохраненный снапшот (для начального отображения)
  router.get('/:unique_link/camera/:id/:quality/preview', authMiddleware(authService), async (req, res, next) => {
    try {
      const { id, quality } = req.params;

      // Валидация качества
      const validQualities = ['low', 'medium', 'high'];
      if (!validQualities.includes(quality)) {
        throw new Error(`Invalid quality parameter. Must be one of: ${validQualities.join(', ')}`);
      }

      // Проверяем права доступа к камере
      if (!authService.isAuthorized(req.user, id)) {
        throw new Error(`Unauthorized: No access to camera "${id}"`);
      }

      // Загружаем из storage
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

      // Если нет в storage - возвращаем 404
      res.status(404).json({ error: 'Preview not available' });

    } catch (error) {
      next(error);
    }
  });

  return router;
}
