import { logger } from '../utils/logger.js';

export function authMiddleware(authService) {
  return (req, res, next) => {
    // Извлекаем unique_link из параметров роута
    const uniqueLink = req.params.unique_link;
    const clientIp = req.clientIp;

    if (!uniqueLink) {
      logger.warn(`[AUTH FAILED] No unique_link in request params (IP: ${clientIp})`);
      return sendAccessDenied(res, 'Invalid link');
    }

    // Получаем пользователя по unique_link
    const user = authService.getUserByLink(uniqueLink);

    if (!user) {
      logger.warn(`[AUTH FAILED] User not found for link: ${uniqueLink} (IP: ${clientIp})`);
      return sendAccessDenied(res, 'Invalid link');
    }

    // Проверяем IP доступ (логирование внутри checkIpAccess)
    if (!authService.checkIpAccess(user, clientIp)) {
      return sendAccessDenied(res, 'Access denied from your IP address');
    }

    // Аутентификация успешна
    req.user = user;
    next();
  };
}

function sendAccessDenied(res, message) {
  res.status(403).json({ error: message });
}
