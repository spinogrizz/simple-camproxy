import { logger } from '../utils/logger.js';

export function ipExtractorMiddleware() {
  return (req, res, next) => {
    const ip = getClientIp(req);
    req.clientIp = ip;
    logger.debug(`Request from ${ip}`);
    next();
  };
}

function getClientIp(req) {
  // Проверяем заголовки прокси (для работы за nginx proxy manager и т.д.)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback на socket
  return req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
}
