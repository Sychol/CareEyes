# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# nginx
FROM nginx:stable-alpine
# 빌드된 프론트엔드 정적 파일 복사 (예: dist 폴더)
COPY --from=builder /app/dist /usr/share/nginx/html
# Nginx 설정 덮어쓰기
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# 포트 노출
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]