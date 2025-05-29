FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /app

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
