
Lưu ý về đường dẫn: Trong file docker-compose.yml, phần context: ./backend và đường dẫn volumes đang được để theo cấu trúc thư mục trên VPS của bạn (nơi mà mã nguồn nằm trong thư mục con backend).
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: my-app_db
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=Admin@123
      - POSTGRES_DB=server_monitoring
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: my-app_backend
    restart: always
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=Admin@123
      - DB_NAME=server_monitoring
      - BACKEND_URL=http://ubuntu-server-management.duckdns.org
    depends_on:
      - db

  nginx:
    image: nginx:alpine
    container_name: my-app_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./backend/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12d & wait $${!}; done;'"

volumes:
  postgres_data:
