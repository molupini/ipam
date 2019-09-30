# # base
FROM node:12-alpine as base 
# MEMORY LEAK FAILURE, INVESTIGATING NEW IMAGE
# FROM node:10-alpine as base 

ENV PORT=3000
EXPOSE ${PORT}

# healthcheck
HEALTHCHECK --interval=10s --timeout=2s --start-period=15s \
    CMD node ./src/util/health.js

# labels,
ARG CREATED_DATE=not-set
ARG SOURCE_COMMIT=not-set

LABEL org.opencontainers.image.authors=maurizio.lupini@bcx.co.za
LABEL org.opencontainers.image.created=$CREATED_DATE
LABEL org.opencontainers.image.revision=${SOURCE_COMMIT}
LABEL org.opencontainers.image.title="Ipam Node.js Project, Ipam"
LABEL org.opencontainers.image.url=https://hub.docker.com/r/mauriziolupini
LABEL org.opencontainers.image.source=not-set
LABEL org.opencontainers.image.source=MIT
LABEL org.opencontainers.image.nodeversion=10

# temp for testing 
# ENV NODE_ENV=production
ENV NODE_ENV=development

RUN apk add --no-cache tini 

WORKDIR /node

COPY ./ipam/package.json ./ipam/package*.json ./

RUN npm config list && npm ci && npm cache clean --force 

ENTRYPOINT [ "/sbin/tini", "--" ]


# # development
FROM base as dev

ENV NODE_ENV=development

ENV PATH=/node/node_modules/.bin:$PATH

RUN npm install --only=development

WORKDIR /node/app

CMD ["nodemon", "./src/index.js"]


# # source 
FROM base as source

WORKDIR /node/app

COPY ./ipam/. .


# # audit
FROM base as audit

CMD ["npm", "audit"]


# # production, should always be the default and last stage 
FROM source as prod

RUN chown -R node:node .

# nested directory will include package.json which is duplication
RUN rm ./package*.json 

USER node

CMD ["node", "./src/index.js"]
