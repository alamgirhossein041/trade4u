FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV development
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3836
EXPOSE 3834

CMD [ "npm", "run", "start:dev" ]
