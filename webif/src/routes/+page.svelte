<script>
  import { onMount } from 'svelte'
  import { determineWebSocketUrl } from '$lib/websocket'

  import Logo from './Logo.svelte'
  import Configuration from './Configuration.svelte'
  import LastUpdate from './LastUpdate.svelte'
  import Characteristics from './Characteristics.svelte'
  import MainsPower from './MainsPower.svelte'
  import Circuits from './Circuits.svelte'

  let configuration
  let webSocketUrl
  let lastUpdateTimestamp
  let characteristicsSensorData
  let mainsSensorData
  let circuitSensorData

  const parseTimestamp = (sensorData) => {
    return new Date(sensorData[0].timestamp)
  }

  onMount(() => {
    // Determine WebSocket URL from URL parameters
    webSocketUrl = determineWebSocketUrl()
    const ws = new WebSocket(webSocketUrl)

    ws.addEventListener('open', () => {
      console.log(`Connected to WebSocket at ${webSocketUrl}`)
    })

    ws.addEventListener('message', (event) => {
      const data = event.data
      const message = JSON.parse(data)

      // Parse last update timestamp from sensor data messages
      switch (message.type) {
        case 'characteristicsSensorData':
        case 'powerSensorData':
          lastUpdateTimestamp = parseTimestamp(message.data)
          break
      }

      // Handle each message type
      switch (message.type) {
        case 'characteristicsSensorData':
          characteristicsSensorData = message.data
          break
        case 'powerSensorData':
          mainsSensorData = message.data.filter((d) => {
            // Filter out unmetered
            return d.circuit.type === 'main' && d.circuit.sensor.type !== 'unmetered'
          })

          circuitSensorData = message.data
          break
        case 'configuration':
          configuration = message.data
          break
      }
    })
  })
</script>

{#if webSocketUrl === undefined}
  <p>Please add ?ws=ws://x.x.x.x:yyyy to your URL to connect to a server</p>
{:else}
  <div class="pure-u-1-1 l-box">
    <LastUpdate {lastUpdateTimestamp} {webSocketUrl} />
  </div>
  <div class="pure-u-1-4 l-box">
    <Logo />
    <Configuration {configuration} />
  </div>
  <div class="pure-u-3-4">
    <div class="pure-u-1-1 l-box">
      <Characteristics sensorData={characteristicsSensorData} />
    </div>
    <div class="pure-u-1-1 l-box">
      <MainsPower sensorData={mainsSensorData} />
    </div>
    <div class="pure-u-1-1 l-box">
      <Circuits sensorData={circuitSensorData} />
    </div>
  </div>
{/if}
