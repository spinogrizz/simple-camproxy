FROM node:20-alpine

# Install dependencies for Sharp (image processing)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY src ./src

# Create config directory
RUN mkdir -p /config

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV CONFIG_PATH=/config
ENV LOG_LEVEL=info
ENV PORT=3000

# Start application
CMD ["node", "src/index.js"]
