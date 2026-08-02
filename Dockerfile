FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    chromium \
    ca-certificates \
    libx11 \
    libxcomposite \
    libxdamage \
    libxext \
    libxrandr \
    mesa \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install --include=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]