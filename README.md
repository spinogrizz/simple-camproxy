# camproxy

Proxy server for IP cameras. Takes snapshots from UniFi Protect and Reolink cameras, resizes them, and caches results. Built for home automation dashboards and remote access.

<a href="sample.jpg"><img src="sample.jpg" align="left" width="400" alt="Example"></a>
<br clear="left">

## Features

- Multi-camera support (UniFi Protect, Reolink)
- Quality presets (low/medium/high)
- Local IP bypass (no auth needed from 192.168.x.x, 10.x.x.x, 127.0.0.1)
- Per-user access control
- Web dashboard with live feed

## Configuration

Create config files:

```bash
cp config/cameras.example.yaml config/cameras.yaml
cp config/access.example.yaml config/access.yaml
```

Edit cameras.yaml with your setup:

```yaml
unifi:
  baseUrl: https://10.42.0.1
  apiKey: your-api-key

reolink:
  username: admin
  password: password

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
    # original quality

cameras:
  - id: front-door
    name: Front Door
    type: unifi
    cameraId: 64f3a2b1c5e8f90012345678

  - id: garage
    name: Garage
    type: reolink
    host: 192.168.1.101
```

Edit access.yaml for users:

```yaml
users:
  - username: admin
    password: password
    allowedCameras: '*'

  - username: user1
    password: password
    allowedCameras:
      - front-door
      - garage
```

## Docker

```bash
docker-compose up -d
```

Or manually:

```bash
docker run -d -p 3000:3000 -v $(pwd)/config:/config:ro camproxy
```

## API

Get snapshot:
```
GET /camera/:id/:quality
GET /camera/:id/:quality?crop=x,y,width,height
```

Get camera list:
```
GET /api/cameras
```

Examples:
```bash
curl http://localhost:3000/camera/front-door/medium > snapshot.jpg
curl http://localhost:3000/camera/garage/low?crop=100,100,800,600 > cropped.jpg
curl -u admin:password http://server:3000/camera/front-door/high > snapshot.jpg
curl http://localhost:3000/api/cameras
```

## Parameters

- `id` - camera ID from config
- `quality` - low, medium, high
- `crop` - optional, format: x,y,width,height (crop before resize)

## Environment

- `PORT` - HTTP port (default: 3000)
- `CONFIG_PATH` - config directory (default: ./config)
- `LOG_LEVEL` - debug, info, warn, error (default: info)

## License

MIT
