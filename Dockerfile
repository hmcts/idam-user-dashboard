# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:20-alpine as base
COPY --chown=hmcts:hmcts . .
RUN yarn install && yarn workspaces focus \
  && yarn cache clean

# ---- Build image ----
FROM base as build

ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT

RUN yarn install && yarn build:prod

# ---- Runtime image ----
FROM base as runtime
RUN rm -rf webpack/ webpack.config.js
COPY --from=build --chown=hmcts:hmcts $WORKDIR/src/main ./src/main
COPY --from=build --chown=hmcts:hmcts $WORKDIR/version .
USER hmcts
EXPOSE 3100
