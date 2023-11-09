import axios, { AxiosResponse } from 'axios'
import http from 'http'
import { createLogger } from '../logger'

const logger = createLogger('http')

const httpClient = axios.create({
  // We keep polling the same hosts over and over so keep-alive is essential
  httpAgent: new http.Agent({ keepAlive: true }),
})

let lastTimestamp = 0
const promiseCache = new Map()

export const setRequestTimeout = (timeoutMs: number) => {
  httpClient.defaults.timeout = timeoutMs
  logger.info(`Using ${timeoutMs} millisecond timeout for HTTP requests`)
}

export const getDedupedResponse = async (timestamp: number, url: string): Promise<AxiosResponse> => {
  // Clear the cache whenever the timestamp changes
  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp
    promiseCache.clear()
  }

  const key = `${timestamp}_${url}`

  if (promiseCache.has(key)) {
    return promiseCache.get(key)
  }

  const promise = httpClient.get(url)
  promiseCache.set(key, promise)

  return promise
}
