# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:20-alpine as base
COPY --chown=hmcts:hmcts . .
RUN yarn install && yarn workspaces focus \
  && yarn cache clean

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM base as runtime
RUN rm -rf webpack/ webpack.config.js
COPY --from=build $WORKDIR/src/main ./src/main

EXPOSE 3100
