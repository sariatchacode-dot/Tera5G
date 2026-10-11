# ── Stage 1: Compile TypeScript server ───────────────────────────────────────
FROM node:20-alpine AS server-build
WORKDIR /build
COPY server/package*.json server/
RUN cd server && npm install
COPY server/ server/
RUN cd server && npm run build

# ── Stage 2: Export Expo web app ──────────────────────────────────────────────
FROM node:20-alpine AS web-build
WORKDIR /build
RUN apk add --no-cache git
ENV CI=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY mobile/package*.json mobile/
RUN cd mobile && npm install

# react-native-webview has no web implementation — its index.js crashes Node
# before Metro can apply any resolver. Replace it with a no-op stub so the
# web export can proceed. connect.web.tsx uses an iframe instead of WebView.
RUN printf 'const React=require("react");const {View}=require("react-native");\nfunction WebView(p){return React.createElement(View,p)}\nmodule.exports=WebView;\nmodule.exports.WebView=WebView;\nmodule.exports.default=WebView;\n' \
    > mobile/node_modules/react-native-webview/index.js

COPY mobile/ mobile/
RUN cd mobile && npx expo export --platform web

# ── Stage 3: Production runtime ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY server/package*.json server/
RUN cd server && npm install --omit=dev && npm cache clean --force

COPY --from=server-build /build/server/dist server/dist
COPY --from=web-build   /build/mobile/dist  server/public

RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001 8080

CMD ["node", "server/dist/index.js"]
