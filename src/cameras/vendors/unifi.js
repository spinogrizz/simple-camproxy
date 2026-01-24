import axios from 'axios';
import https from 'https';
import { BaseCamera } from '../base.js';
import { logger } from '../../utils/logger.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

export default class UnifiCamera extends BaseCamera {
  static validate(camera, config) {
    if (!camera.cameraId) {
      throw new Error(`UniFi camera "${camera.id}" missing cameraId`);
    }
    if (!config.unifi?.baseUrl || !config.unifi?.apiKey) {
      throw new Error('UniFi requires baseUrl and apiKey in config');
    }
  }

  async fetchSnapshot() {
    try {
      const { baseUrl, apiKey } = this.config.unifi;
      const url = `${baseUrl}/proxy/protect/integration/v1/cameras/${this.camera.cameraId}/snapshot`;

      logger.debug(`Fetching UniFi snapshot from ${url}`);

      const response = await axios.get(url, {
        headers: {
          'X-API-KEY': apiKey
        },
        responseType: 'arraybuffer',
        httpsAgent: httpsAgent,
        timeout: 10000
      });

      logger.debug(`UniFi snapshot fetched: ${response.data.length} bytes`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch UniFi snapshot for camera ${this.camera.id}:`, error.message);
      throw new Error(`Camera unavailable: ${error.message}`);
    }
  }
}
