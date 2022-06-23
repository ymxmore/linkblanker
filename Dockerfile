FROM node:17.5.0-alpine3.14

RUN apk --update --no-cache add bash zip \
    && npm install -g \
        npm-check-updates \
        fixpack
