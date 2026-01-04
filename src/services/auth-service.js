import ipaddr from 'ipaddr.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  constructor(accessConfig) {
    this.users = new Map();

    // Load users by unique_link
    accessConfig.users.forEach(user => {
      this.users.set(user.unique_link, {
        unique_link: user.unique_link,
        name: user.name || user.unique_link,
        refreshInterval: user.refreshInterval || 5000,
        quality: user.quality || 'medium',
        allowedCameras: user.allowedCameras || 'all',
        allowFromIPs: user.allowFromIPs || []
      });
    });

    logger.info(`Auth service initialized with ${this.users.size} users`);
  }

  getUserByLink(link) {
    const user = this.users.get(link);
    if (!user) {
      logger.debug(`User not found for link: ${link}`);
      return null;
    }
    return user;
  }

  checkIpAccess(user, clientIp) {
    if (!user.allowFromIPs || user.allowFromIPs.length === 0) {
      logger.warn(`[ACCESS DENIED] No IP restrictions configured for user ${user.name} (IP: ${clientIp})`);
      return false;
    }

    // Remove IPv6 prefix if present
    const cleanIp = clientIp.replace(/^::ffff:/, '');
    logger.debug(`[ACCESS CHECK] User: ${user.name}, IP: ${cleanIp}, Rules: ${user.allowFromIPs.join(', ')}`);

    try {
      const addr = ipaddr.process(cleanIp);

      for (const rule of user.allowFromIPs) {
        // Check CIDR notation
        if (rule.includes('/')) {
          try {
            const range = ipaddr.parseCIDR(rule);
            if (addr.match(range)) {
              logger.debug(`[ACCESS GRANTED] User: ${user.name}, IP: ${cleanIp} matched CIDR: ${rule}`);
              return true;
            }
          } catch (error) {
            logger.error(`Invalid CIDR notation: ${rule}`, error.message);
            continue;
          }
        } else {
          // Check exact IP match
          try {
            const ruleAddr = ipaddr.process(rule);
            if (addr.toString() === ruleAddr.toString()) {
              logger.debug(`[ACCESS GRANTED] User: ${user.name}, IP: ${cleanIp} matched IP: ${rule}`);
              return true;
            }
          } catch (error) {
            logger.error(`Invalid IP address: ${rule}`, error.message);
            continue;
          }
        }
      }

      logger.warn(`[ACCESS DENIED] User: ${user.name}, IP: ${cleanIp} not in allowed list: [${user.allowFromIPs.join(', ')}]`);
      return false;
    } catch (error) {
      logger.error(`[ACCESS DENIED] Failed to parse client IP ${cleanIp} for user ${user.name}:`, error.message);
      return false;
    }
  }

  isAuthorized(user, cameraId) {
    // User with 'all' permissions has access to all cameras
    if (user.allowedCameras === 'all') {
      return true;
    }

    // Check allowed cameras array
    if (Array.isArray(user.allowedCameras)) {
      return user.allowedCameras.includes(cameraId);
    }

    return false;
  }
}
