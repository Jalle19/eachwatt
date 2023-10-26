# eachwatt

[![CI](https://github.com/Jalle19/eachwatt/actions/workflows/ci.yml/badge.svg)](https://github.com/Jalle19/eachwatt/actions/workflows/ci.yml)

## Development

Install dependencies:

```bash
npm i
```

Build and start the application:

```bash
npm run build && node dist/eachwatt.js -c config.yml
```

Install web interface dependencies:

```
cd webif/
npm i
```

Run the development server:

```
npm run dev -- --open
```

The web interface tries to open a WebSocket to the same host it's being served from, which is wrong when running the 
development server. Override the WebSocket URL using the `ws` query parameter, like this:

```
http://localhost:5173/?ws=ws://localhost:8080
```

To run the test suite, use:

```
npm run test
```

## Running with Docker

Build the Docker image:

```bash
docker build -t eachwatt/latest .
```

Run the container:

```bash
docker run --rm -v $(pwd):/data:ro -p 8080:8080 eachwatt/latest
```

The application expects the configuration file to be available as `/data/config.yml`, so in the above example, 
`config.yml` should be present in the current directory.
