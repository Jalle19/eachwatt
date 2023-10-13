<script>
  import { onMount } from 'svelte'
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

  const determineWebSocketUrl = () => {
    const urlParams = new URLSearchParams(window.location.search)

    return urlParams.get('ws') || undefined
  }

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

<div class="container-left">
  <Logo />
  <Configuration {configuration} />
</div>
<div class="container-right">
  {#if webSocketUrl === undefined}
    <p>Please add ?ws=ws://x.x.x.x:yyyy to your URL to connect to a server</p>
  {:else}
    <LastUpdate {lastUpdateTimestamp} {webSocketUrl} />
    <Characteristics sensorData={characteristicsSensorData} />
    <MainsPower sensorData={mainsSensorData} />
    <Circuits sensorData={circuitSensorData} />
  {/if}
</div>

<style>
  .container-left {
    width: 30%;
    float: left;
    padding: 0.8em;
    box-sizing: border-box;
  }

  .container-right {
    width: 70%;
    float: right;
    padding: 0.8em;
    box-sizing: border-box;
  }
</style>
