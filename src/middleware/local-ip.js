import { logger } from '../utils/logger.js';

export function localIpMiddleware() {
  return (req, res, next) => {
    const ip = getClientIp(req);
    req.isLocalIp = isLocalIp(ip);
    req.clientIp = ip;
    logger.debug(`Request from ${ip}, local: ${req.isLocalIp}`);
    next();
  };
}

function getClientIp(req) {
  // Проверяем заголовки прокси
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

function isLocalIp(ip) {
  if (!ip || ip === 'unknown') return false;

  // Убираем IPv6 префикс если есть
  const cleanIp = ip.replace(/^::ffff:/, '');

  // Проверка на локальные диапазоны
  const localPatterns = [
    /^127\./,                        // 127.0.0.0/8 (localhost)
    /^10\./,                         // 10.0.0.0/8 (private)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (private)
    /^192\.168\./,                   // 192.168.0.0/16 (private)
    /^::1$/,                         // IPv6 localhost
    /^fe80:/,                        // IPv6 link-local
    /^fc00:/,                        // IPv6 unique local
  ];

  return localPatterns.some(pattern => pattern.test(cleanIp));
}
