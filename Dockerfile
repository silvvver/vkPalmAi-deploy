FROM node:22-alpine
WORKDIR /app

# ставим только production-зависимости
COPY package*.json ./
RUN npm ci --omit=dev

# копируем всё приложение (frontend/, routes/, uploads/, server.js и т.д.)
COPY . .

# запускаем единый сервис «фронт + API»
CMD ["node", "server.js"]
