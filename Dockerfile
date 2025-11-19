# ================ Stage 1: Build the server ================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# ================ Stage 2: Production runtime ================

FROM node:20-alpine AS server

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]
