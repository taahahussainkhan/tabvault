FROM node:20-alpine AS builder

WORKDIR /app

# Copy all package manifests for monorepo resolution
COPY package*.json ./
COPY packages/core/package*.json ./packages/core/
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/
COPY packages/mobile/package*.json ./packages/mobile/

RUN npm install

# Copy source code and build
COPY tsconfig.base.json ./
COPY packages/core ./packages/core
COPY packages/server ./packages/server

RUN npm run build --workspace=@tabvault/core
RUN npm run build --workspace=@tabvault/server

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/package.json

EXPOSE 8080

CMD ["node", "packages/server/dist/server.js"]
