import { writable } from 'svelte/store'

export const configurationStore = writable({})
export const characteristicsStore = writable([])
export const mainSensorDataStore = writable([])
export const circuitSensorDataStore = writable([])
export const lastUpdateTimestampStore = writable(undefined)
export const webSocketUrlStore = writable(undefined)
