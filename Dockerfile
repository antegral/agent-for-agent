FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@8.15.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build && pnpm prune --prod --ignore-scripts

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOME=/tmp TMPDIR=/tmp
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 ams-mcp \
    && useradd --uid 10001 --gid 10001 --no-create-home --home-dir /tmp ams-mcp
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER 10001:10001
EXPOSE 8936
ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["node", "dist/http.js"]
