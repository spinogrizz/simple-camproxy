import axios from 'axios';
import https from 'https';
import { logger } from '../utils/logger.js';

// HTTPS Agent для игнорирования самоподписанных сертификатов
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export async function fetchUnifiSnapshot(config, cameraId) {
  try {
    const url = `${config.unifi.baseUrl}/proxy/protect/integration/v1/cameras/${cameraId}/snapshot`;

    logger.debug(`Fetching UniFi snapshot from ${url}`);

    const response = await axios.get(url, {
      headers: {
        'X-API-KEY': config.unifi.apiKey
      },
      responseType: 'arraybuffer',
      httpsAgent: httpsAgent,
      timeout: 10000
    });

    logger.debug(`UniFi snapshot fetched: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch UniFi snapshot for camera ${cameraId}:`, error.message);
    throw new Error(`Camera unavailable: ${error.message}`);
  }
}
