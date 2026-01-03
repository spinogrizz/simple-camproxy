import { logger } from '../utils/logger.js';

export function authMiddleware(authService) {
  return (req, res, next) => {
    // Пропускаем локальные IP без авторизации
    if (req.isLocalIp) {
      req.user = {
        username: 'local',
        allowedCameras: '*',
        isLocal: true
      };
      logger.debug(`Local IP ${req.clientIp} authenticated as 'local' user`);
      return next();
    }

    // Проверяем Basic Auth
    const authHeader = req.headers.authorization;
    const credentials = authService.parseBasicAuth(authHeader);

    if (!credentials) {
      logger.debug('No valid Basic Auth credentials provided');
      return sendAuthRequired(res);
    }

    const user = authService.authenticate(credentials.username, credentials.password);

    if (!user) {
      logger.warn(`Failed authentication attempt from ${req.clientIp}: ${credentials.username}`);
      return sendAuthRequired(res);
    }

    req.user = { ...user, isLocal: false };
    next();
  };
}

function sendAuthRequired(res) {
  res.setHeader('WWW-Authenticate', 'Basic realm="camproxy"');
  res.status(401).json({ error: 'Authentication required' });
}
