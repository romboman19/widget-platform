FROM node:20-alpine

WORKDIR /app

# Copy package.json and prisma schema BEFORE npm install
COPY package.json ./
COPY prisma ./prisma/

# Now npm install can run postinstall (prisma generate)
RUN npm install

COPY src ./src/

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
