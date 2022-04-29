FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV development
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3837

CMD [ "npm", "run", "start:dev" ]
