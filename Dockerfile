# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:20-alpine as base

# Switch to root to enable Corepack
USER root
RUN corepack enable && corepack prepare yarn@4.5.0 --activate

# Switch back to hmcts user
USER hmcts
COPY --chown=hmcts:hmcts . .

RUN yarn install --production && yarn cache clean

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM base as runtime
RUN rm -rf webpack/ webpack.config.js
COPY --from=build $WORKDIR/src/main ./src/main

EXPOSE 3100