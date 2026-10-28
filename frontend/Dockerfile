# Site da Linka (Angular) servido pelo nginx, que tambem repassa /api ao backend.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:1.27-alpine
# Porta do site e endereco da API (o Railway define PORT sozinho).
ENV PORT=80     BACKEND_URL=http://backend:3000     NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
# O nginx troca as variaveis do modelo ao subir (envsubst da imagem oficial).
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
