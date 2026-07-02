# Multi-stage build for Strapi 5 (Railway Root Context)
FROM node:20-bookworm-slim AS build

# Installing build tools for native modules (sharp, swc, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    autoconf \
    automake \
    zlib1g-dev \
    libpng-dev \
    libvips-dev \
    python3 \
    pkg-config \
    > /dev/null 2>&1

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt
# Copy root package files for monorepo support
COPY package.json package-lock.json ./
# Copy backend package setup
COPY backend/package.json ./backend/
RUN npm install -w backend --include=dev && npm cache clean --force

# Copy backend source and build
COPY backend/ ./backend/
WORKDIR /opt/backend

# Railway inyecta variables del servicio como build-args cuando coinciden con ARG.
# Si no llegan al build (bug/timing de Railway), usamos placeholders solo para compilar.
# En runtime, Railway inyecta las variables reales al contenedor (npm start).
ARG ADMIN_JWT_SECRET=build-placeholder
ARG API_TOKEN_SALT=build-placeholder
ARG TRANSFER_TOKEN_SALT=build-placeholder
ARG ENCRYPTION_KEY=build-placeholder
ARG APP_KEYS=build-key-1,build-key-2,build-key-3,build-key-4
ARG JWT_SECRET=build-placeholder
ARG CLOUDINARY_NAME=build-placeholder
ARG CLOUDINARY_KEY=build-placeholder
ARG CLOUDINARY_SECRET=build-placeholder
ARG RESEND_API_KEY=build-placeholder

ENV ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET \
    API_TOKEN_SALT=$API_TOKEN_SALT \
    TRANSFER_TOKEN_SALT=$TRANSFER_TOKEN_SALT \
    ENCRYPTION_KEY=$ENCRYPTION_KEY \
    APP_KEYS=$APP_KEYS \
    JWT_SECRET=$JWT_SECRET \
    CLOUDINARY_NAME=$CLOUDINARY_NAME \
    CLOUDINARY_KEY=$CLOUDINARY_KEY \
    CLOUDINARY_SECRET=$CLOUDINARY_SECRET \
    RESEND_API_KEY=$RESEND_API_KEY

RUN npm run build

# Final Production Image
FROM node:20-bookworm-slim

# Install runtime dependencies for sharp/vips AND Playwright/Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers (in the final image to ensure they are available)
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
RUN npx playwright install chromium

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/backend
COPY --from=build /opt/node_modules ../node_modules
COPY --from=build /opt/backend/dist ./
COPY --from=build /opt/backend/package.json ./
COPY --from=build /opt/backend/public ./public

ENV PATH /opt/node_modules/.bin:/opt/backend/node_modules/.bin:$PATH

RUN chown -R node:node /opt/backend
USER node
EXPOSE 1337
# Strapi envs are normally provided by Railway, but we ensure the port is 1337
ENV PORT=1337
CMD ["npm", "start"]
