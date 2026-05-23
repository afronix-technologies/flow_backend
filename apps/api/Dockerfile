FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN apk add --no-cache curl

COPY . .

RUN npx nest build api

CMD ["node", "dist/apps/api/main"]
