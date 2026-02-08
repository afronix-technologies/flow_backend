FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN apk add --no-cache curl

COPY . .

# Build the specific app
RUN npx nest build file-service

EXPOSE 3004

CMD ["node", "dist/apps/file-service/main"]
