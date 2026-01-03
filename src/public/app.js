class CameraBoard {
  constructor() {
    this.cameras = [];
    this.quality = 'medium';
    this.refreshInterval = null;
    this.init();
  }

  async init() {
    await this.loadCameras();
    this.setupEventListeners();
    this.renderCameras();
    this.startAutoRefresh();
  }

  async loadCameras() {
    try {
      const response = await fetch('/api/cameras');

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - authentication required');
          return;
        }
        throw new Error(`Failed to load cameras: ${response.status}`);
      }

      const data = await response.json();
      this.cameras = data.cameras;
    } catch (error) {
      console.error('Failed to load cameras:', error);
    }
  }

  setupEventListeners() {
    // Page Visibility API - останавливаем обновление когда вкладка неактивна
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoRefresh();
      } else {
        this.refreshAllCameras();
        this.startAutoRefresh();
      }
    });
  }

  renderCameras() {
    const grid = document.getElementById('cameraGrid');
    grid.innerHTML = '';

    if (this.cameras.length === 0) {
      return;
    }

    this.cameras.forEach(camera => {
      const container = this.createCameraContainer(camera);
      grid.appendChild(container);

      // Загружаем preview после добавления в DOM
      this.loadPreview(camera.id);
    });
  }

  createCameraContainer(camera) {
    const container = document.createElement('div');
    container.className = 'camera-container';
    container.id = `container-${camera.id}`;
    return container;
  }

  async loadPreview(cameraId) {
    const container = document.getElementById(`container-${cameraId}`);
    if (!container) {
      return;
    }

    const url = `/camera/${cameraId}/${this.quality}/preview`;

    try {
      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          container.innerHTML = '';
          img.className = 'camera-image initial-blur fade-in';
          container.appendChild(img);

          // Сразу запускаем обновление для получения свежего
          setTimeout(() => {
            this.loadCameraImage(cameraId, false);
          }, 200);

          setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
        };

        img.onerror = () => {
          this.loadCameraImage(cameraId, true);
        };

        img.src = imageUrl;
      } else {
        this.loadCameraImage(cameraId, true);
      }
    } catch (error) {
      this.loadCameraImage(cameraId, true);
    }
  }

  async loadCameraImage(cameraId, isInitialLoad = false) {
    const container = document.getElementById(`container-${cameraId}`);
    if (!container) {
      return;
    }

    try {
      const url = `/camera/${cameraId}/${this.quality}?t=${Date.now()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      const newImg = new Image();

      newImg.onload = () => {
        const currentImg = container.querySelector('.camera-image');

        if (isInitialLoad && !currentImg) {
          // Первая загрузка - показываем с blur
          container.innerHTML = '';
          newImg.className = 'camera-image initial-blur fade-in';
          container.appendChild(newImg);

          // Сразу запускаем обновление для получения свежего
          setTimeout(() => {
            this.loadCameraImage(cameraId, false);
          }, 100);
        } else if (currentImg && currentImg.classList.contains('initial-blur')) {
          // Второй запрос после initial - убираем blur с crossfade
          newImg.className = 'camera-image';
          container.appendChild(newImg);

          // Запускаем crossfade
          requestAnimationFrame(() => {
            currentImg.classList.remove('initial-blur');
            currentImg.classList.add('fade-out');
            newImg.classList.add('fade-in');
          });

          // Удаляем старое после анимации
          setTimeout(() => {
            currentImg.remove();
            if (currentImg.src && currentImg.src.startsWith('blob:')) {
              URL.revokeObjectURL(currentImg.src);
            }
          }, 900);
        } else if (currentImg) {
          // Обычное обновление - crossfade без blur
          newImg.className = 'camera-image';
          container.appendChild(newImg);

          // Запускаем crossfade
          requestAnimationFrame(() => {
            currentImg.classList.add('fade-out');
            newImg.classList.add('fade-in');
          });

          // Удаляем старое после анимации
          setTimeout(() => {
            currentImg.remove();
            if (currentImg.src && currentImg.src.startsWith('blob:')) {
              URL.revokeObjectURL(currentImg.src);
            }
          }, 900);
        } else {
          // Первое изображение без предыдущего
          container.innerHTML = '';
          newImg.className = 'camera-image fade-in';
          container.appendChild(newImg);
        }

        // Clean up blob URL after animation completes
        setTimeout(() => {
          if (imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
          }
        }, 1000);
      };

      newImg.onerror = () => {
        if (imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrl);
        }
      };

      newImg.src = imageUrl;

    } catch (error) {
      console.error(`Failed to load camera ${cameraId}:`, error);
    }
  }

  refreshAllCameras() {
    this.cameras.forEach(camera => {
      this.loadCameraImage(camera.id);
    });
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      this.refreshAllCameras();
    }, 5000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new CameraBoard();
});
