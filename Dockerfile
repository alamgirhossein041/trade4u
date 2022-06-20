FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV development
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run prestart:prod

EXPOSE 4000
EXPOSE 3834

CMD [ "npm", "run", "start:prod" ]
