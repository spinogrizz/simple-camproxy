# simple-camproxy

Proxy server for IP cameras. Takes snapshots, resizes them, and caches results. Built for home automation dashboards and remote access.

<a href="sample.jpg"><img src="sample.jpg" align="left" width="150" alt="Example"></a>
<br clear="left">

## Features

- Multi-vendor camera support
- Quality presets (low/medium/high)
- Local IP bypass (no auth needed from 192.168.x.x, etc)
- Per-user access control via unique links
- Web dashboard with live feed

## Supported Cameras

| Type | Auth | Notes |
|------|------|-------|
| **UniFi Protect** | API Key | Requires `cameraId` from UniFi console |
| **Reolink** | Basic | HTTP API with credentials in URL |
| **Dahua** | Digest | Standard Dahua CGI interface |
| **Hikvision** | Basic | ISAPI streaming endpoint |
| **IPtronic** | Basic | Simple `/snap.jpg` endpoint |

## Configuration

Create config files:

```bash
cp config/cameras.example.yaml config/cameras.yaml
cp config/access.example.yaml config/access.yaml
```

Edit cameras.yaml with your setup:

```yaml
# Global credentials (optional, can override per-camera)
unifi:
  baseUrl: https://10.42.0.1
  apiKey: your-api-key

dahua:
  username: admin
  password: password

cameras:
  - id: front-door
    name: Front Door
    type: unifi
    cameraId: 64f3a2b1c5e8f90012345678

  - id: garage
    name: Garage
    type: dahua
    host: 192.168.1.101
    channel: 1  # optional

  - id: backyard
    name: Backyard
    type: hikvision
    host: 192.168.1.102
    username: admin        # per-camera credentials
    password: secret123
```

Edit access.yaml for users:

```yaml
users:
  - unique_link: admin-secret-link
    name: Admin
    allowedCameras: '*'

  - unique_link: user1-unique-link
    name: User 1
    allowedCameras:
      - front-door
      - garage
```

## Docker

```bash
docker run -d -p 3000:3000 -v $(pwd)/config:/config:ro spinogrizz/simple-camproxy:latest
```

Or with docker-compose:

```bash
docker-compose up -d
```

## API

Get snapshot:
```
GET /camera/:id/:quality
GET /camera/:id/:quality?crop=x,y,width,height&rotate=degrees
GET /:unique_link/camera/:id/:quality
```

Get camera list:
```
GET /api/cameras
GET /:unique_link/api/cameras
```

Examples:
```bash
curl http://localhost:3000/camera/front-door/medium > snapshot.jpg
curl http://localhost:3000/camera/garage/low?crop=100,100,800,600 > cropped.jpg
curl http://localhost:3000/camera/garage/high?rotate=2.5&crop=50,50,1000,800 > corrected.jpg
curl http://server:3000/admin-secret-link/camera/front-door/high > snapshot.jpg
curl http://localhost:3000/admin-secret-link/api/cameras
```

#### Parameters

- `id` - camera ID from config
- `quality` - low, medium, high
- `crop` - optional, format: x,y,width,height (applied after rotate)
- `rotate` - optional, rotation angle in degrees (-45 to 45)

## Environment

- `PORT` - HTTP port (default: 3000)
- `CONFIG_PATH` - config directory (default: ./config)
- `LOG_LEVEL` - debug, info, warn, error (default: info)

