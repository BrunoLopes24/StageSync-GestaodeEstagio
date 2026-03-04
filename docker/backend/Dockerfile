FROM node:22-alpine3.21 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine3.21
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
RUN npm install --no-save tsx
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && node dist/server.js"]
