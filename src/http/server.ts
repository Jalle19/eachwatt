import { IncomingMessage, RequestListener, ServerResponse } from 'http'
import fs from 'fs'
import { promises as fsPromisified } from 'fs'

export const httpRequestHandler: RequestListener = async (req: IncomingMessage, res: ServerResponse) => {
  // Main routing logic
  let reqUrl = req.url
  if (reqUrl?.indexOf('?') !== -1) {
    reqUrl = reqUrl?.substring(0, reqUrl?.indexOf('?'))
  }

  switch (reqUrl) {
    case '/':
    case '/index.html':
      await serveStaticFile('index.html', 'text/html', res)
      break
    case '/eachwatt.css':
      await serveStaticFile('eachwatt.css', 'text/css', res)
      break
    case '/eachwatt.js':
      await serveStaticFile('eachwatt.js', 'text/javascript', res)
      break
    case '/eachwatt_logo.png':
      await serveStaticFile('eachwatt_logo.png', 'image/png', res)
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

const serveStaticFile = async (file: string, contentType: string, res: ServerResponse): Promise<void> => {
  const fileContents = await fsPromisified.readFile(resolveFilePath(file))

  res.setHeader('Content-Type', contentType)
  res.writeHead(200)
  res.end(fileContents)
}
