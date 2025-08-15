FROM rust:1-slim-bookworm as build

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Add wasm32 target for Cloudflare Workers
RUN rustup target add wasm32-unknown-unknown

# Copy project files
COPY Cargo.toml Cargo.lock ./
COPY wrangler.jsonc ./
COPY src/ ./src/

# Install worker-build and build the project
RUN cargo install -q worker-build && worker-build --release

FROM node:20-slim

WORKDIR /app

# Install wrangler
RUN npm install -g wrangler

# Copy built files from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/wrangler.jsonc ./

EXPOSE 8787

HEALTHCHECK CMD curl --fail http://localhost:8787 || exit 1

ENTRYPOINT ["wrangler", "dev"]