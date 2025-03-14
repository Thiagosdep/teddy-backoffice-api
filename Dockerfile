FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./

COPY . . 

RUN npm ci --legacy-peer-deps

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:dist"]
