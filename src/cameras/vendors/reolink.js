import axios from 'axios';
import { BaseCamera } from '../base.js';
import { logger } from '../../utils/logger.js';

export default class ReolinkCamera extends BaseCamera {
  static validate(camera, config) {
    BaseCamera.validate(camera, config, 'reolink');
  }

  async fetchSnapshot() {
    try {
      const { username, password } = this.getCredentials('reolink');

      if (!username || !password) {
        throw new Error('Reolink credentials not configured');
      }

      const channel = this.camera.channel || 0;
      const url = `http://${this.camera.host}/cgi-bin/api.cgi?cmd=Snap&channel=${channel}&user=${username}&password=${password}`;

      logger.debug(`Fetching Reolink snapshot from ${this.camera.host}`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      logger.debug(`Reolink snapshot fetched: ${response.data.length} bytes`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Reolink snapshot for camera ${this.camera.id}:`, error.message);
      throw new Error(`Camera unavailable: ${error.message}`);
    }
  }
}
