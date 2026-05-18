FROM node:18-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3006

RUN apt-get update \
  && apt-get install -y --no-install-recommends libvips42 \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

ENV NODE_ENV=development

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ pkg-config libvips-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM deps AS build

COPY .babelrc ./
COPY src ./src
RUN npm run build

FROM deps AS prod-deps

ENV NODE_ENV=production
RUN npm prune --omit=dev

FROM base AS runtime

COPY package*.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p uploads \
  && chown -R node:node /app

USER node

EXPOSE 3006

CMD ["node", "dist/app.js"]
