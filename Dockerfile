# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# Runtime stage
FROM node:20-alpine

# Only runtime libraries (no -dev headers)
RUN apk add --no-cache cairo jpeg pango giflib vips

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN mkdir -p /config

EXPOSE 3000

ENV NODE_ENV=production
ENV CONFIG_PATH=/config
ENV LOG_LEVEL=info
ENV PORT=3000

CMD ["node", "src/index.js"]
