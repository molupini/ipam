# # base
FROM node:13-alpine as base 

ARG CREATED_DATE=not-set
ARG SOURCE_COMMIT=not-set
LABEL org.opencontainers.image.authors=maurizio.lupini@bcx.co.za
LABEL org.opencontainers.image.created=$CREATED_DATE
LABEL org.opencontainers.image.revision=${SOURCE_COMMIT}
LABEL org.opencontainers.image.title="Ipam Node.js Project, Scanner"
LABEL org.opencontainers.image.url=https://hub.docker.com/r/mauriziolupini
LABEL org.opencontainers.image.source=not-set
LABEL org.opencontainers.image.source=MIT
LABEL org.opencontainers.image.nodeversion=10

# temp for testing 
# ENV NODE_ENV=production
ENV NODE_ENV=development

RUN apk add --no-cache tini 

WORKDIR /node

COPY ./scanner/package.json ./

RUN npm install && npm cache clean --force 

ENTRYPOINT [ "/sbin/tini", "--" ]


# # development
FROM base as dev

ENV NODE_ENV=development

ENV PATH=/node/node_modules/.bin:$PATH

RUN npm install --only=development

WORKDIR /node/app

# COPY ./scanner/. .

CMD ["nodemon", "./src/run.js"]


# # source 
FROM base as source

WORKDIR /node/app

COPY ./scanner/. .


# # audit
FROM base as audit

CMD ["npm", "audit"]


# # production, should always be the default and last stage 
# need to give permission to ping and perform tcp 
FROM source as prod

# RUN chown -R node:node .

# nested directory will include package.json which is duplication
# RUN rm ./package*.json 

# USER node

CMD ["node", "./src/run.js"]
