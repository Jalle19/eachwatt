import { createLogger } from '../logger'

type BodyPromise = Promise<string>

const logger = createLogger('http')
let requestTimeout = 0
let lastTimestamp = 0
const promiseCache = new Map<string, BodyPromise>()

const createRequestParams = (): RequestInit => {
  return {
    // We keep polling the same hosts over and over so keep-alive is essential
    keepalive: true,
    // Use the configured timeout
    signal: AbortSignal.timeout(requestTimeout),
  }
}

export const setRequestTimeout = (timeoutMs: number) => {
  requestTimeout = timeoutMs
  logger.info(`Using ${timeoutMs} millisecond timeout for HTTP requests`)
}

const resolveBody = async (request: Request): BodyPromise => {
  return (await fetch(request)).text()
}

export const getDedupedResponseBody = async (timestamp: number, url: string): BodyPromise => {
  // Clear the cache whenever the timestamp changes
  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp
    promiseCache.clear()
  }

  const key = `${timestamp}_${url}`

  if (promiseCache.has(key)) {
    return promiseCache.get(key)!
  }

  const request = new Request(url, createRequestParams())
  logger.debug(`GET ${url}`)
  const promise = resolveBody(request)
  promiseCache.set(key, promise)

  return promise
}
