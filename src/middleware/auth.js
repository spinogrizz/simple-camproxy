import { logger } from '../utils/logger.js';

export function authMiddleware(authService) {
  return (req, res, next) => {
    // Extract unique_link from route params
    const uniqueLink = req.params.unique_link;
    const clientIp = req.clientIp;

    if (!uniqueLink) {
      logger.warn(`[AUTH FAILED] No unique_link in request params (IP: ${clientIp})`);
      return sendAccessDenied(res, 'Invalid link');
    }

    // Get user by unique_link
    const user = authService.getUserByLink(uniqueLink);

    if (!user) {
      logger.warn(`[AUTH FAILED] User not found for link: ${uniqueLink} (IP: ${clientIp})`);
      return sendAccessDenied(res, 'Invalid link');
    }

    // Check IP access (logging inside checkIpAccess)
    if (!authService.checkIpAccess(user, clientIp)) {
      return sendAccessDenied(res, 'Access denied from your IP address');
    }

    // Authentication successful
    req.user = user;
    next();
  };
}

function sendAccessDenied(res, message) {
  res.status(403).json({ error: message });
}
