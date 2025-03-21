# ---- Base image ----
FROM node:20 AS base

# Set environment variables to fix permissions and skip Puppeteer download
ENV SKIP_YARN_COREPACK_CHECK=0 

# Create and set working directory with proper permissions
WORKDIR /app
# USER hmcts

# ---- Dependencies ----
FROM base AS dependencies
# Copy package files first for better layer caching
COPY package.json yarn.lock ./
# Install production dependencies and rebuild node-sass for current architecture
RUN yarn install --production \
    && npm rebuild node-sass \
    && yarn cache clean

# ---- Build image ----
FROM dependencies AS build
# Copy the rest of the application
COPY . .
RUN yarn install \
    && npm rebuild node-sass \
    && yarn build:prod

# ---- Runtime image ----
FROM base as runtime
WORKDIR /app
# Copy only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production \
    && npm rebuild node-sass \
    && yarn cache clean

# Copy built assets from build stage
COPY --from=build /app/src/main ./src/main

# Clean up build files if they exist
RUN rm -rf webpack/ webpack.config.js 2>/dev/null || true

EXPOSE 3100