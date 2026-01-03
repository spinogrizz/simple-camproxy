import express from 'express';
import { loadConfig } from './config/loader.js';
import { CameraManager } from './cameras/camera-manager.js';
import { CacheService } from './services/cache-service.js';
import { ImageService } from './services/image-service.js';
import { AuthService } from './services/auth-service.js';
import { SnapshotStorage } from './services/snapshot-storage.js';
import { ipExtractorMiddleware } from './middleware/local-ip.js';
import { errorHandler } from './middleware/error-handler.js';
import { createCameraRoutes } from './routes/camera-routes.js';
import { createWebRoutes } from './routes/web-routes.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('Starting camproxy...');

    // Загрузка конфигурации
    const config = await loadConfig();

    // Инициализация сервисов
    const cacheService = new CacheService({ stdTTL: 2, checkperiod: 3 });
    const imageService = new ImageService(config.cameras.qualities);
    const authService = new AuthService(config.access);
    const cameraManager = new CameraManager(config.cameras);
    const snapshotStorage = new SnapshotStorage();

    // Создание Express приложения
    const app = express();
    const PORT = process.env.PORT || 3000;

    const trustProxyIps = process.env.TRUST_PROXY_IPS;
    const trustProxyFlag = process.env.TRUST_PROXY;
    if (trustProxyIps && trustProxyIps.trim()) {
      const proxyList = trustProxyIps.split(',').map(item => item.trim()).filter(Boolean);
      app.set('trust proxy', proxyList);
      logger.info(`Trust proxy enabled for: ${proxyList.join(', ')}`);
    } else if (trustProxyFlag && trustProxyFlag !== '0' && trustProxyFlag.toLowerCase() !== 'false') {
      app.set('trust proxy', true);
      logger.info('Trust proxy enabled');
    }

    // Глобальные middleware
    app.use(express.json());
    app.use(ipExtractorMiddleware());

    // Статические файлы для веб-интерфейса (защищены авторизацией)
    app.use(express.static('src/public', {
      setHeaders: (res, path) => {
        // Для статических файлов не применяем авторизацию здесь,
        // она будет в роутах
      }
    }));

    // Роуты (префиксы указаны в самих роутах)
    app.use('/', createCameraRoutes(cameraManager, cacheService, imageService, authService, snapshotStorage));
    app.use('/', createWebRoutes(cameraManager, authService));

    // Health check endpoint (без авторизации)
    app.get('/health', (req, res) => {
      const stats = cacheService.getStats();
      res.json({
        status: 'ok',
        cameras: cameraManager.getAllCameras().length,
        cache: stats
      });
    });

    // Обработка ошибок (должна быть последней)
    app.use(errorHandler);

    // Запуск сервера
    app.listen(PORT, () => {
      logger.info(`camproxy listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
      logger.info(`Log level: ${process.env.LOG_LEVEL || 'info'}`);
      logger.info(`Cameras: ${cameraManager.getAllCameras().length}`);
      logger.info(`Users: ${authService.users.size}`);
      logger.info('Ready to serve requests');
    });

  } catch (error) {
    logger.error('Failed to start camproxy:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Запуск приложения
main();
