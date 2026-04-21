FROM node:22-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.server.json rsbuild.config.ts ./
COPY src/ src/
COPY public/ public/
RUN npm run build

FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist/ dist/

EXPOSE 8337
CMD ["node", "dist/server/server/index.js"]
