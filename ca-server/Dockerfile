FROM node:20-alpine

WORKDIR /app

COPY ca-server.js .
COPY ec_private_key.pem .
COPY ec_public_key.pem .
COPY ec_cert.pem .

COPY package*.json ./
RUN npm install

EXPOSE 4000

CMD ["node", "ca-server.js"]
