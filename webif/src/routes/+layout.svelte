<script>
    import 'purecss/build/pure.css'

    import {
      configurationStore,
      characteristicsStore,
      mainSensorDataStore,
      circuitSensorDataStore,
      lastUpdateTimestampStore,
      webSocketUrlStore
    } from '../lib/stores'
    import { onMount } from 'svelte'
    import { determineWebSocketUrl } from '../lib/websocket'

    const parseTimestamp = (sensorData) => {
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
            $lastUpdateTimestampStore = parseTimestamp(message.data)
            break
        }

        // Handle each message type
        switch (message.type) {
          case 'characteristicsSensorData':
            $characteristicsStore = message.data
            break
          case 'powerSensorData':
            $mainSensorDataStore = message.data.filter((d) => {
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
  <slot />
</div>

<style>
    :root {
        --background: #fff;
        --color: #222;
        --table-background: #e0e0e0;
        --highlight-color: #ff3d00;
    }

    @media (prefers-color-scheme: dark){
        :root {
            --background: #272727;
            --color: #aaa;
            --table-background: #3b3b3b;
            --highlight-color: #ff3d00;
        }

        /* pure-table overrides */
        :global(.pure-table) {
            border: 2px solid #424242;
        }
        :global(.pure-table thead) {
            background-color: var(--table-background);
            color: var(--color);
        }

        :global(.pure-table th, .pure-table td) {
            border: 0;
        }

        :global(.pure-table-striped tr:nth-child(2n-1) td) {
            background-color: #2E2E2E;
        }
        /* end pure-table overrides */
    }

    :global(body) {
        background: var(--background);
        color: var(--color);
    }

    :global(h1, h2, h3, h4, h5, h6) {
        margin-top: 0;
        padding-bottom: 0.2em;
        display: inline-block;
        border-bottom: 2px solid var(--highlight-color);
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        clear: both;
    }

    :global(table) {
        width: 100%;
    }

    :global(.cell-right-align) {
        text-align: right;
    }

    :global(.pure-g > div) {
        box-sizing: border-box;
    }

    :global(.l-box) {
        padding: 1em;
    }
</style>
