FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS preview

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
USER 101

# Skip the base image's root-oriented entrypoint scripts; the final process is
# nginx itself and the custom config has no startup writes outside /dev.
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
