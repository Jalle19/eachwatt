import { writable } from 'svelte/store'
import type { CharacteristicsSensorData, PowerSensorData } from '$lib/types'

type LastUpdateTimestamp = Date | undefined
type WebSocketUrl = string | URL | undefined

export const configurationStore = writable({})
export const characteristicsStore = writable<CharacteristicsSensorData[]>([])
export const mainSensorDataStore = writable<PowerSensorData[]>([])
export const circuitSensorDataStore = writable([])
export const lastUpdateTimestampStore = writable(undefined as LastUpdateTimestamp)
export const webSocketUrlStore = writable(undefined as WebSocketUrl)
