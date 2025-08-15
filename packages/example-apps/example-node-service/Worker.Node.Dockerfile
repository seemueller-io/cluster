FROM node:20-slim

WORKDIR /app

COPY deploy/example-service .

RUN npm install --production

EXPOSE 8787

HEALTHCHECK CMD curl --fail http://localhost:8787 || exit 1

ENTRYPOINT ["npm", "run", "dev"]