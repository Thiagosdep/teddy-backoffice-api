FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./

RUN npm install --no-optional --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npm run start:dist"]