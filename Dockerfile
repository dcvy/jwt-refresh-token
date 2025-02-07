FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD sleep 20 && \
    mkdir -p /app/i18n && \
    if [ -z "$(ls -A /app/i18n 2>/dev/null)" ]; then \
        echo "Copying default i18n files..." && \
        cp -r ./src/i18n/locales/* /app/i18n/; \
    else \
        echo "Using existing i18n files from volume"; \
    fi && \
    cp -r /app/i18n/* ./src/i18n/locales/ && \
    npx prisma generate && \
    npx prisma db push && \
    npx prisma db seed && \
    node dist/src/main.js

EXPOSE 3000
