# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:20-alpine as base
USER root
RUN corepack enable
USER hmcts
WORKDIR /opt/app
COPY --chown=hmcts:hmcts . .

# ---- Build image ----
FROM base as build
RUN yarn install && \
    yarn build:prod && \
    rm -rf webpack/ webpack.config.js

# ---- Runtime image ----
FROM base as runtime
COPY --from=build /opt/app/src/main /opt/app/src/main

EXPOSE 3100
