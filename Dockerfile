FROM node:22-slim as build
WORKDIR /opt/api

COPY package.json nest-cli.json ./
RUN npm install

COPY ./src  ./src
COPY tsconfig.json ./

RUN npm run build

RUN npm prune --production

FROM node:22-slim
WORKDIR /opt/api

COPY package.json ./

COPY --from=build /opt/api/node_modules ./node_modules
COPY --from=build /opt/api/dist ./dist
