import { spawn } from 'child_process';
import { BaseCamera } from '../base.js';
import { logger } from '../../utils/logger.js';

export default class RtspCamera extends BaseCamera {
  static validate(camera, config) {
    if (!camera.url) {
      throw new Error(`Camera "${camera.id}" missing url for RTSP stream`);
    }
  }

  buildUrl() {
    let url = this.camera.url;

    // If credentials provided, inject them into URL
    const username = this.camera.username || this.config.rtsp?.username;
    const password = this.camera.password || this.config.rtsp?.password;

    if (username && password && !url.includes('@')) {
      // Insert credentials: rtsp://host -> rtsp://user:pass@host
      const match = url.match(/^(rtsps?:\/\/)(.+)$/);
      if (match) {
        url = `${match[1]}${encodeURIComponent(username)}:${encodeURIComponent(password)}@${match[2]}`;
      }
    }

    return url;
  }

  async fetchSnapshot() {
    const url = this.buildUrl();
    const timeout = this.camera.timeout || 10000;

    logger.debug(`Fetching RTSP snapshot from ${this.camera.url}`);

    return new Promise((resolve, reject) => {
      const chunks = [];
      let stderr = '';

      const args = [
        '-rtsp_transport', this.camera.transport || 'tcp',
        '-i', url,
        '-frames:v', '1',
        '-f', 'image2',
        '-c:v', 'mjpeg',
        '-q:v', '2',
        '-'
      ];

      const ffmpeg = spawn('ffmpeg', args, {
        timeout,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const timer = setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(new Error('RTSP snapshot timeout'));
      }, timeout);

      ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
      ffmpeg.stderr.on('data', chunk => { stderr += chunk.toString(); });

      ffmpeg.on('close', code => {
        clearTimeout(timer);

        if (code === 0 && chunks.length > 0) {
          const data = Buffer.concat(chunks);
          logger.debug(`RTSP snapshot fetched: ${data.length} bytes`);
          resolve(data);
        } else {
          const errorLine = stderr.split('\n').find(l => l.includes('error') || l.includes('Error')) || 'Unknown error';
          logger.error(`FFmpeg failed for camera ${this.camera.id}: ${errorLine}`);
          reject(new Error(`Camera unavailable: ${errorLine}`));
        }
      });

      ffmpeg.on('error', err => {
        clearTimeout(timer);
        logger.error(`Failed to spawn ffmpeg for camera ${this.camera.id}:`, err.message);
        reject(new Error(`FFmpeg not available: ${err.message}`));
      });
    });
  }
}
