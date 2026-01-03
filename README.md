# camproxy

Proxy server for IP cameras with caching, quality presets, and web dashboard.

## Features

- **Multi-camera support**: UniFi Protect and Reolink cameras
- **Quality presets**: low, medium, high (configurable resolution and JPEG quality)
- **Smart caching**: 2-second TTL to reduce camera load
- **Web dashboard**: Live camera feed with auto-refresh every 5 seconds
- **Flexible authentication**:
  - HTTP Basic Auth for remote access
  - No authentication required for local IPs (192.168.x.x, 10.x.x.x, 127.0.0.1)
- **Per-user access control**: Different cameras for different users
- **Docker support**: Ready-to-use Docker image with volume configuration

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd camproxy
```

### 2. Create Configuration Files

```bash
cp config/cameras.example.yaml config/cameras.yaml
cp config/access.example.yaml config/access.yaml
```

Edit both files with your camera settings and user credentials.

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

### 4. Access

- **Web Dashboard**: `http://localhost:3000`
- **API**: `http://localhost:3000/camera/:id/:quality`
- **Health Check**: `http://localhost:3000/health`

## Configuration

### cameras.yaml

```yaml
# Global UniFi Protect settings
unifi:
  baseUrl: https://10.42.0.1
  apiKey: your-unifi-api-key

# Global Reolink settings (optional, can be per-camera)
reolink:
  username: admin
  password: reolink-password

# Quality presets
qualities:
  low:
    maxWidth: 640
    maxHeight: 480
    quality: 60
  medium:
    maxWidth: 1280
    maxHeight: 720
    quality: 75
  high:
    # as is, no processing

# Camera list
cameras:
  - id: front-door
    name: Front Door
    type: unifi
    cameraId: 64f3a2b1c5e8f90012345678

  - id: garage
    name: Garage
    type: reolink
    host: 192.168.1.101
    # Optional: override global credentials
    # username: custom-user
    # password: custom-password
```

### access.yaml

```yaml
users:
  # Admin with access to all cameras
  - username: admin
    password: secure-password
    allowedCameras: '*'

  # User with limited access
  - username: user1
    password: user1-password
    allowedCameras:
      - front-door
      - garage

  # Guest with single camera access
  - username: guest
    password: guest-password
    allowedCameras:
      - front-door
```

## API Endpoints

### Get Camera Snapshot

```
GET /camera/:id/:quality
```

**Parameters:**
- `id`: Camera ID from cameras.yaml
- `quality`: `low`, `medium`, or `high`

**Headers:**
- `Authorization`: Basic Auth (not required for local IPs)

**Response:**
- `Content-Type`: image/jpeg
- `X-Cache`: HIT or MISS (indicates if served from cache)
- `X-Camera-Id`: Camera ID
- `X-Quality`: Quality preset used

**Example:**
```bash
# From local IP (no auth required)
curl http://localhost:3000/camera/front-door/medium > snapshot.jpg

# From remote IP (auth required)
curl -u admin:password http://server:3000/camera/front-door/high > snapshot.jpg
```

### Get Camera List

```
GET /api/cameras
```

Returns JSON list of cameras accessible to the authenticated user.

**Response:**
```json
{
  "cameras": [
    {
      "id": "front-door",
      "name": "Front Door",
      "type": "unifi"
    },
    {
      "id": "garage",
      "name": "Garage",
      "type": "reolink"
    }
  ]
}
```

### Health Check

```
GET /health
```

Returns server status and statistics.

**Response:**
```json
{
  "status": "ok",
  "cameras": 4,
  "cache": {
    "keys": 12,
    "hits": 156,
    "misses": 23
  }
}
```

## Environment Variables

- `PORT`: HTTP port (default: 3000)
- `CONFIG_PATH`: Path to config directory (default: ./config)
- `LOG_LEVEL`: Logging level: debug, info, warn, error (default: info)
- `NODE_ENV`: Environment: development, production (default: production)

## Development

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This will start the server with auto-reload on file changes and debug logging.

### Run in Production Mode

```bash
npm start
```

## Docker

### Build Image

```bash
docker build -t camproxy .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/config:/config:ro \
  --name camproxy \
  camproxy
```

### Using Docker Compose

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Architecture

```
Client → Express → Middleware (Local IP / Auth) → Routes
  → Camera Manager → Camera Implementation → HTTP Request
  → Image Service (Sharp resize) → Cache → Response
```

### Components

- **Config Loader**: Loads and validates YAML configuration
- **Camera Manager**: Routes requests to appropriate camera implementation
- **UniFi Camera**: Fetches snapshots from UniFi Protect API
- **Reolink Camera**: Fetches snapshots via Reolink CGI API
- **Image Service**: Processes images with Sharp (resize, compress)
- **Cache Service**: In-memory cache with 2-second TTL
- **Auth Service**: Basic Auth with per-camera access control
- **Local IP Middleware**: Bypasses auth for local network requests

## Use Cases

### Home Automation Dashboard

Use the low quality preset for dashboard previews:

```html
<img src="http://camproxy:3000/camera/front-door/low" />
```

### Parental Access

Create users with limited camera access:

```yaml
users:
  - username: mom
    password: mom-password
    allowedCameras:
      - front-door
      - backyard
```

### Remote Monitoring

Access from anywhere with Basic Auth:

```bash
curl -u user:password https://your-domain.com/camera/garage/high
```

## Security

- Passwords are hashed with SHA-256
- Local IP detection bypasses auth for trusted networks
- UniFi Protect: Self-signed certificates are accepted for local connections
- Per-user camera access control
- 10-second timeout on camera requests
- Input validation on all parameters

## Troubleshooting

### Camera Unavailable

Check camera connectivity:
```bash
# UniFi
curl -k -H "X-API-Key: YOUR_KEY" https://10.42.0.1/proxy/protect/api/cameras

# Reolink
curl http://192.168.1.101/cgi-bin/api.cgi?cmd=Snap&user=admin&password=pass
```

### Authentication Issues

- Verify credentials in `access.yaml`
- Check if request is from local IP (check logs)
- Ensure Basic Auth header is properly formatted

### Image Processing Errors

- Ensure Sharp dependencies are installed (Docker handles this)
- Check camera returns valid JPEG images
- Verify quality preset configuration

### High Memory Usage

- Reduce cache TTL in `src/services/cache-service.js`
- Limit concurrent requests
- Use lower quality presets

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- Add tests for new features
- Update documentation
