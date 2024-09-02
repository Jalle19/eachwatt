import fs from 'fs'
import path from 'path'
import { IncomingMessage, RequestListener, ServerResponse } from 'http'
import { promises as fsPromisified } from 'fs'

const basePath = __dirname + '/../../webif/build'
const webRoutes = ['/configuration', '/group']

const mimeTypes = new Map<string, string>([
  ['.html', 'text/html'],
  ['.js', 'text/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
])

export const httpRequestHandler: RequestListener = (req: IncomingMessage, res: ServerResponse) => {
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

  // RequestListener returns void so we must wrap awaits
  void (async () => {
    await serveStaticFile(filePath, mimeType, res)
  })()
}

const resolveFilePath = (reqUrl: string | undefined): string => {
  // Strip query parameters
  if (reqUrl?.indexOf('?') !== -1) {
    reqUrl = reqUrl?.substring(0, reqUrl?.indexOf('?'))
  }

  // "Convert" routes to file path
  let filePath
  if (!reqUrl || reqUrl === '/' || isWebRoute(reqUrl)) {
    filePath = '/index.html'
  } else {
    filePath = reqUrl
  }

  return basePath + filePath
}

const isWebRoute = (reqUrl: string): boolean => {
  for (const route of webRoutes) {
    if (reqUrl.startsWith(route)) {
      return true
    }
  }

  return false
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
