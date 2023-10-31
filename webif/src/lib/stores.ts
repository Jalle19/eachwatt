import { writable } from 'svelte/store'

type LastUpdateTimestamp = Date | undefined
type WebSocketUrl = string | URL | undefined

export const configurationStore = writable({})
export const characteristicsStore = writable([])
export const mainSensorDataStore = writable([])
export const circuitSensorDataStore = writable([])
export const lastUpdateTimestampStore = writable(undefined as LastUpdateTimestamp)
export const webSocketUrlStore = writable(undefined as WebSocketUrl)
