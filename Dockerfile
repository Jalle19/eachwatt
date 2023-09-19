FROM node:20-bookworm AS builder

WORKDIR /app
COPY . /app

RUN npm install

RUN npm run build

FROM node:20-bookworm AS runtime

WORKDIR /app
COPY . /app
COPY --from=builder /app/dist/* /app

RUN npm install --omit=dev

ENTRYPOINT ["node", "dist/eachwatt.js"]
