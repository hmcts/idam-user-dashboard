# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:20-alpine as base
COPY --chown=hmcts:hmcts . .
  
# Enable Corepack and set up the correct Yarn version
RUN corepack enable \
  && corepack prepare yarn@4.5.0 --activate \
  && yarn install --production \
  && yarn cache clean

# ---- Build image ----
FROM base as build
RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM base as runtime
RUN rm -rf webpack/ webpack.config.js
COPY --from=build $WORKDIR/src/main ./src/main

EXPOSE 3100
  