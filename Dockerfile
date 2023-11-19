# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.16.0
FROM node:${NODE_VERSION}-slim as base

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

COPY package*.json ./

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential ffmpeg

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci

# Copy application code
COPY --link . .

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 50021
CMD [ "npm", "run", "start" ]
