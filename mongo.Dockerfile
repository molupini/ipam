FROM mongo:4.0.16-xenial

COPY ./mongo/seed/*.js ./docker-entrypoint-initdb.d