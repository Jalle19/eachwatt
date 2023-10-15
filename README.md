# eachwatt

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
