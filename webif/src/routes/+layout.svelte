<script lang="ts">
    import 'purecss/build/pure.css'
    import './styles.css'

    import {
      configurationStore,
      characteristicsStore,
      mainSensorDataStore,
      circuitSensorDataStore,
      lastUpdateTimestampStore,
      webSocketUrlStore
    } from '$lib/stores'
    import { onMount } from 'svelte'
    import { determineWebSocketUrl } from '$lib/websocket'
    import type { PowerSensorData, SensorData } from '$lib/types'

    const parseTimestamp = (sensorData: SensorData[]) => {
      return new Date(sensorData[0].timestamp)
    }

    onMount(() => {
      // Determine WebSocket URL from URL parameters
      $webSocketUrlStore = determineWebSocketUrl()
      const ws = new WebSocket($webSocketUrlStore)

      ws.addEventListener('open', () => {
        console.log(`Connected to WebSocket at ${$webSocketUrlStore}`)
      })

      ws.addEventListener('message', (event) => {
        const data = event.data
        const message = JSON.parse(data)

        // Parse last update timestamp from sensor data messages
        switch (message.type) {
          case 'characteristicsSensorData':
          case 'powerSensorData':
            if (message.data.length > 0) {
              $lastUpdateTimestampStore = parseTimestamp(message.data)
            }

            break
        }

        // Handle each message type
        switch (message.type) {
          case 'characteristicsSensorData':
            $characteristicsStore = message.data
            break
          case 'powerSensorData':
            $mainSensorDataStore = message.data.filter((d: PowerSensorData) => {
              // Filter out unmetered
              return d.circuit.type === 'main' && d.circuit.sensor.type !== 'unmetered'
            })

            $circuitSensorDataStore = message.data
            break
          case 'configuration':
            $configurationStore = message.data
            break
        }
      })
    })
</script>
<svelte:head>
  <title>EachWatt</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</svelte:head>
<div class="pure-g container">
  <div class="pure-u-1-1 l-box">
    <nav class="pure-menu pure-menu-horizontal">
      <ul class="pure-menu-list">
        <li class="pure-menu-item">
          <a href="/" class="pure-menu-link">Dashboard</a>
        </li>
        <li class="pure-menu-item">
          <a href="/configuration" class="pure-menu-link">Configuration</a>
        </li>
      </ul>
    </nav>
  </div>

  <slot />
</div>

<style>

</style>
