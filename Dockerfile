FROM node:18-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./
RUN npm install && npm audit fix --force

COPY . .

EXPOSE 4000

USER node
CMD ["npm", "run", "dev"]