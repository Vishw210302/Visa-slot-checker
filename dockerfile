FROM node:20-slim

RUN apt-get update && apt-get install -y chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "./bin/www"]
