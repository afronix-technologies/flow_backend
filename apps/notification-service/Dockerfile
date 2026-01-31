FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN apk add --no-cache curl

COPY . .

# Build the specific app
RUN npx nest build notification-service

EXPOSE 3002

CMD ["node", "dist/apps/notification-service/main"]
