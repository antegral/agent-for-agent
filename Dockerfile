FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c AS build
WORKDIR /app
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@8.15.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build && npm_config_ignore_scripts=true pnpm prune --prod

FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c AS runtime
ENV NODE_ENV=production HOME=/tmp TMPDIR=/tmp
WORKDIR /app
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends tini libbrotli1 \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' libbrotli1)" ge '1.0.9-2+deb12u1' \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 ams-mcp \
    && useradd --uid 10001 --gid 10001 --no-create-home --home-dir /tmp ams-mcp

# npm's published dev metadata references unpublished packages; omit it before
# resolving the two bundled dependencies still below the security baseline.
RUN npm install --global --ignore-scripts npm@12.2.1 \
    && npm pkg delete --prefix /usr/local/lib/node_modules/npm devDependencies \
    && npm install --prefix /usr/local/lib/node_modules/npm \
        --omit=dev --ignore-scripts --no-save --package-lock=false --workspaces=false \
        ip-address@10.7.4 undici@6.29.1 \
    && rm -rf /root/.npm /tmp/.npm

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER 10001:10001
EXPOSE 8936
ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["node", "dist/http.js"]
