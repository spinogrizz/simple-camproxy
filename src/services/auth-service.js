import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export class AuthService {
  constructor(accessConfig) {
    this.users = new Map();

    // Загружаем пользователей и хешируем пароли
    accessConfig.users.forEach(user => {
      this.users.set(user.username, {
        passwordHash: this.hashPassword(user.password),
        allowedCameras: user.allowedCameras || '*'
      });
    });

    logger.info(`Auth service initialized with ${this.users.size} users`);
  }

  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  authenticate(username, password) {
    const user = this.users.get(username);
    if (!user) {
      logger.debug(`Authentication failed: user "${username}" not found`);
      return null;
    }

    const passwordHash = this.hashPassword(password);
    if (passwordHash === user.passwordHash) {
      logger.debug(`Authentication successful: ${username}`);
      return {
        username,
        allowedCameras: user.allowedCameras
      };
    }

    logger.warn(`Authentication failed: invalid password for user "${username}"`);
    return null;
  }

  isAuthorized(user, cameraId) {
    // Пользователь с правами '*' имеет доступ ко всем камерам
    if (user.allowedCameras === '*') {
      return true;
    }

    // Проверяем массив разрешенных камер
    if (Array.isArray(user.allowedCameras)) {
      return user.allowedCameras.includes(cameraId);
    }

    return false;
  }

  parseBasicAuth(authHeader) {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null;
    }

    try {
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [username, password] = credentials.split(':');

      if (!username || !password) {
        return null;
      }

      return { username, password };
    } catch (error) {
      logger.error('Failed to parse Basic Auth header:', error.message);
      return null;
    }
  }
}
