import { IncomingMessage, RequestListener, ServerResponse } from 'http'
import { promises as fsPromisified } from 'fs'

export const httpRequestHandler: RequestListener = async (req: IncomingMessage, res: ServerResponse) => {
  // Main routing logic
  switch (req.url) {
    case '/':
    case '/index.html':
      const indexContents = await fsPromisified.readFile(resolveFilePath('index.html'))

      res.setHeader('Content-Type', 'text/html')
      res.writeHead(200)
      res.end(indexContents)
      break
    default:
      res.writeHead(404)
      res.end('Not found')
      break
  }
}

const resolveFilePath = (file: string): string => {
  return __dirname + '/../../webif/' + file
}
