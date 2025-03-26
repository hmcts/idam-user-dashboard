# ---- Base image ----
FROM node:20-alpine as base
ENV SKIP_YARN_COREPACK_CHECK=0
COPY --chown=hmcts:hmcts . .
RUN yarn install && yarn cache clean

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM base as runtime
RUN rm -rf webpack/ webpack.config.js
COPY --from=build $WORKDIR/src/main ./src/main
# TODO: expose the right port for your application
EXPOSE 3100
