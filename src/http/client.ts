import { createLogger } from '../logger'

const logger = createLogger('http')

let requestTimeout = 0
let lastTimestamp = 0
const promiseCache = new Map<string, Promise<Response>>()

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

export const getDedupedResponse = async (timestamp: number, url: string): Promise<Response> => {
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
  const promise = fetch(request)
  promiseCache.set(key, promise)

  return promise
}
