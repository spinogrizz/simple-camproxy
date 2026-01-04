import { logger } from '../utils/logger.js';

export function ipExtractorMiddleware() {
  return (req, res, next) => {
    const ip = getClientIp(req);
    req.clientIp = ip;
    logger.debug(`Request from ${ip}`);
    logger.debug(`Proxy headers: x-forwarded-for=${req.headers['x-forwarded-for'] || 'none'}; x-real-ip=${req.headers['x-real-ip'] || 'none'}; forwarded=${req.headers['forwarded'] || 'none'}`);
    next();
  };
}

function getClientIp(req) {
  if (req.app && req.app.get('trust proxy')) {
    return req.ip;
  }

  // Check proxy headers (for nginx proxy manager, etc)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to socket
  return req.socket.remoteAddress || req.connection.remoteAddress || 'unknown';
}
