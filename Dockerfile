# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/playwright:v1.41.1-jammy

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

RUN npx playwright install --with-deps

# Run test
ENTRYPOINT ["npm", "run", "test"]
