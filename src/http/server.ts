import fs from 'fs'
import path from 'path'
import { IncomingMessage, RequestListener, ServerResponse } from 'http'
import { promises as fsPromisified } from 'fs'

const basePath = __dirname + '/../../webif/build'

const mimeTypes = new Map<string, string>([
  ['.html', 'text/html'],
  ['.js', 'text/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
])

export const httpRequestHandler: RequestListener = async (req: IncomingMessage, res: ServerResponse) => {
  const filePath = resolveFilePath(req.url)

  // Serve 404 if file doesn't exist
  if (!fs.existsSync(filePath)) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  // File exists, try to determine MIME type
  const extension = path.extname(filePath).toLowerCase()
  const mimeType = mimeTypes.get(extension)

  await serveStaticFile(filePath, mimeType, res)
}

const resolveFilePath = (reqUrl: string | undefined): string => {
  // Strip query parameters
  if (reqUrl?.indexOf('?') !== -1) {
    reqUrl = reqUrl?.substring(0, reqUrl?.indexOf('?'))
  }

  // "Convert" to file path
  let filePath
  if (!reqUrl || reqUrl === '/') {
    filePath = '/index.html'
  } else {
    filePath = reqUrl
  }

  return basePath + filePath
}

const serveStaticFile = async (
  filePath: string,
  contentType: string | undefined,
  res: ServerResponse,
): Promise<void> => {
  const fileContents = await fsPromisified.readFile(filePath)

  if (contentType !== undefined) {
    res.setHeader('Content-Type', contentType)
  }

  res.writeHead(200)
  res.end(fileContents)
}
