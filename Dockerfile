# Multi-stage build for Strapi 5 (Railway Root Context)
FROM node:22-alpine AS build
# Installing build tools for native modules (sharp, swc, etc)
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/backend
# Copy the entire backend folder into the build context
COPY backend/package.json backend/package-lock.json ./
RUN npm install --include=dev && npm cache clean --force

COPY backend/ ./
RUN npm run build

# Final Production Image
FROM node:22-alpine
RUN apk add --no-cache vips-dev
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/backend
COPY --from=build /opt/backend/node_modules ./node_modules
COPY --from=build /opt/backend/dist ./dist
COPY --from=build /opt/backend/package.json ./
COPY --from=build /opt/backend/public ./public

ENV PATH /opt/backend/node_modules/.bin:$PATH

RUN chown -R node:node /opt/backend
USER node
EXPOSE 1337
# Strapi envs are normally provided by Railway, but we ensure the port is 1337
ENV PORT=1337
CMD ["npm", "start"]
