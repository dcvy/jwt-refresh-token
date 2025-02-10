FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Đảm bảo thư mục i18n tồn tại và copy dữ liệu nếu volume trống
RUN mkdir -p /app/i18n/locales && \
    if [ -z "$(ls -A /app/i18n/locales 2>/dev/null)" ]; then \
        echo "Copying default i18n files..." && \
        cp -r ./src/i18n/locales/* /app/i18n/locales/; \
    else \
        echo "Using existing i18n files from volume"; \
    fi && \
    cp -r /app/i18n/locales/* ./src/i18n/locales/ && \
    ls -l /app/i18n/locales/

# CMD để khởi chạy ứng dụng
CMD sleep 20 && \
    npx prisma generate && \
    npx prisma db push && \
    npx prisma db seed && \
    node dist/src/main.js

EXPOSE 3000
