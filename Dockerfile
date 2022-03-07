FROM node:14.15.1-alpine3.12

WORKDIR /app

ENV NODE_ENV development
COPY package*.json ./
RUN npm install

COPY . .

COPY .env ./

EXPOSE 3836

CMD [ "npm", "run", "start:dev" ]
