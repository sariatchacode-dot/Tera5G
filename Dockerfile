# ── Stage 1: Compile TypeScript server ───────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /build
COPY server/package*.json server/
RUN cd server && npm ci
COPY server/ server/
RUN cd server && npm run build

# ── Stage 2: Export Expo web app ──────────────────────────────────────────────
FROM node:20-alpine AS web-build
WORKDIR /build
# git is required by some expo/metro dependencies during install
RUN apk add --no-cache git
ENV CI=1
ENV NODE_OPTIONS="--max-old-space-size=2048"
COPY mobile/package*.json mobile/
RUN cd mobile && npm ci
COPY mobile/ mobile/
RUN cd mobile && npx expo export --platform web

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY server/package*.json server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Copy compiled server and web build
COPY --from=server-build /build/server/dist server/dist
COPY --from=web-build   /build/mobile/dist  server/public

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# 3001 = Express + Socket.io   |   8080 = HTTP proxy for device bypass
EXPOSE 3001 8080

CMD ["node", "server/dist/index.js"]
