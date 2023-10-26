FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy all files needed to build the app
COPY package.json /app
COPY package-lock.json /app
COPY tsconfig.json /app
COPY src/ /app/src
COPY webif/ /app/webif

# Install dependencies and build the app and web interface
RUN npm install
RUN npm run build-all

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

# Copy everything needed to install dependencies
COPY package.json /app
COPY package-lock.json /app
RUN npm install --omit=dev --ignore-scripts

# Copy the built apps
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/webif/build /app/webif/build

ENTRYPOINT ["node", "dist/eachwatt.js", "-c", "/data/config.yml"]
