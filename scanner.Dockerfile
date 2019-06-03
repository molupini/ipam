# # base
FROM node:10-alpine as base 

ENV EXPRESS_URL=http://express:3000
ENV TCP_PORT_ARRAY=443,80,3389,5986,53,23,22
ENV JWT_SCANNER=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1Y2U2NWVmYmZjZjY3ODAwMTJiZTNjNGYiLCJpYXQiOjE1NTg2MDE0NzIsImV4cCI6MTU1ODc3NDI3Mn0.AmM8dEVHUdhpx2px-YhEPbC6cVL8i5mmqvSrutwUeIo

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

ENV NODE_ENV=production

RUN apk add --no-cache tini 

WORKDIR /node

COPY ./scanner/package.json ./scanner/package*.json ./

RUN npm config list && npm ci && npm cache clean --force 

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
FROM source as prod

RUN chown -R node:node .

# nested directory will include package.json which is duplication
RUN rm ./package*.json 

USER node

CMD ["node", "./src/run.js"]
