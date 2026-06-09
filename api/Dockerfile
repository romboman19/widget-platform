FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/
RUN npm install
COPY src ./src/

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx prisma db seed && node src/index.js"]