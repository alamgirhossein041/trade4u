FROM node:lts-alpine

WORKDIR /app

ENV NODE_ENV development
COPY package.json yarn.lock ./
RUN yarn

COPY . .

EXPOSE 3836

CMD [ "yarn", "start:dev" ]
