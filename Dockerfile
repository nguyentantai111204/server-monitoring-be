# Bước 1: Chọn môi trường chạy (Node.js)
FROM node:20-alpine

# Bước 2: Tạo thư mục làm việc trong container
WORKDIR /app

# Bước 3: Copy file quản lý thư viện vào trước
COPY package*.json ./

# Bước 4: Cài đặt thư viện
RUN npm install

# Bước 5: Copy toàn bộ code còn lại vào
COPY . .

# Bước 6: Build dự án NestJS sang file JS
RUN npm run build

# Bước 7: Mở cổng 3000 (cổng mặc định của NestJS)
EXPOSE 3000

# Bước 8: Lệnh để chạy ứng dụng
CMD ["npm", "run", "start:prod"]
