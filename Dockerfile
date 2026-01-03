FROM node:20-alpine

# Устанавливаем зависимости для Sharp (обработка изображений)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Копируем package.json
COPY package.json ./

# Устанавливаем зависимости
RUN npm install --omit=dev

# Копируем исходный код
COPY src ./src

# Создаем директорию для конфигов
RUN mkdir -p /config

# Открываем порт
EXPOSE 3000

# Переменные окружения
ENV NODE_ENV=production
ENV CONFIG_PATH=/config
ENV LOG_LEVEL=info
ENV PORT=3000

# Запускаем приложение
CMD ["node", "src/index.js"]
