# Sử dụng Node.js chính thức
FROM node:16

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json từ thư mục gốc
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn backend vào container
COPY backend /app
COPY public /app/public

# Mở port cho backend (port của server.js)
EXPOSE 50000

# Lệnh chạy server.js
CMD ["node", "server.js"]
