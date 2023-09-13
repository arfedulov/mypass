FROM node:18.12

ADD . /app/mypass
WORKDIR /app/mypass
RUN npm ci

EXPOSE 3000
CMD [ "npm", "run", "prod" ]