FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps
RUN apk add --no-cache curl

COPY . .

# Build the specific app
RUN npx nest build job-service

CMD ["node", "dist/apps/job-service/main"]
