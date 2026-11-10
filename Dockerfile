# 🐳 Multi-stage Docker build pour optimiser la taille de l'image

# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

# Copier les fichiers de package
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

# Copier les fichiers buildés depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Installer curl pour les health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Port d'exposition
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
