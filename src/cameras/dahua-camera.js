import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * Parse WWW-Authenticate header for Digest auth
 */
function parseDigestHeader(header) {
  const params = {};
  const regex = /(\w+)=(?:"([^"]+)"|([^\s,]+))/g;
  let match;
  while ((match = regex.exec(header)) !== null) {
    params[match[1]] = match[2] || match[3];
  }
  return params;
}

/**
 * Generate Digest auth header
 */
function createDigestHeader(params, username, password, method, uri) {
  const ha1 = crypto
    .createHash('md5')
    .update(`${username}:${params.realm}:${password}`)
    .digest('hex');

  const ha2 = crypto
    .createHash('md5')
    .update(`${method}:${uri}`)
    .digest('hex');

  // Handle both with and without qop
  if (params.qop) {
    const nc = '00000001';
    const cnonce = crypto.randomBytes(8).toString('hex');
    const qop = params.qop.split(',')[0].trim(); // Take first qop option (usually "auth")

    const response = crypto
      .createHash('md5')
      .update(`${ha1}:${params.nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
      .digest('hex');

    // Clean opaque value (remove extra quotes if present)
    const opaque = (params.opaque || '').replace(/^"|"$/g, '');

    return `Digest username="${username}", realm="${params.realm}", nonce="${params.nonce}", uri="${uri}", algorithm=MD5, qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}", opaque="${opaque}"`;
  } else {
    // Without qop - simpler format
    const response = crypto
      .createHash('md5')
      .update(`${ha1}:${params.nonce}:${ha2}`)
      .digest('hex');

    return `Digest username="${username}", realm="${params.realm}", nonce="${params.nonce}", uri="${uri}", algorithm=MD5, response="${response}"`;
  }
}

export async function fetchDahuaSnapshot(config, camera) {
  try {
    const username = camera.username || config.dahua?.username;
    const password = camera.password || config.dahua?.password;

    if (!username || !password) {
      throw new Error('Dahua credentials not configured');
    }

    const uri = camera.channel
      ? `/cgi-bin/snapshot.cgi?channel=${camera.channel}`
      : `/cgi-bin/snapshot.cgi`;
    const url = `http://${camera.host}${uri}`;

    logger.debug(`Fetching Dahua snapshot from ${camera.host}`);

    // First request to get Digest challenge
    let authHeader;
    try {
      await axios.get(url, { timeout: 5000 });
      // If no 401, camera doesn't require auth (unlikely)
      logger.debug('Dahua camera did not require authentication');
    } catch (err) {
      if (err.response?.status === 401) {
        const wwwAuth = err.response.headers['www-authenticate'];
        if (wwwAuth && wwwAuth.toLowerCase().startsWith('digest')) {
          const params = parseDigestHeader(wwwAuth);
          authHeader = createDigestHeader(params, username, password, 'GET', uri);
        } else {
          throw new Error('Dahua camera requires Digest auth but received different challenge');
        }
      } else {
        throw err;
      }
    }

    // Second request with Digest auth
    const response = await axios.get(url, {
      headers: authHeader ? { 'Authorization': authHeader } : {},
      responseType: 'arraybuffer',
      timeout: 10000
    });

    logger.debug(`Dahua snapshot fetched: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch Dahua snapshot for camera ${camera.id}:`, error.message);
    throw new Error(`Camera unavailable: ${error.message}`);
  }
}
