FROM mongo:4.0.9-xenial

COPY ./mongo/seed/*.js ./docker-entrypoint-initdb.d