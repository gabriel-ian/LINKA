# API da Linka (NestJS). Build em duas etapas: compila e depois roda so o dist.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Laudos enviados ficam aqui (montado como volume no docker-compose).
RUN mkdir -p uploads/laudos && chown -R node:node uploads
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
