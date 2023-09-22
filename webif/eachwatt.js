const updateCharacteristicsSensorDataTable = (sensorData) => {
  const table = document.querySelector('#characteristics-sensor-data')

  let tableData = `
        <th>Name</th>
        <th>Phase</th>
        <th class="cell-right-align">Voltage</th>
        <th class="cell-right-align">Frequency</th>
    `

  tableData += sensorData.map((data) => {
    const characteristics = data.characteristics
    const voltage = data.voltage
    const frequency = data.frequency

    return `
        <tr>
            <td>${characteristics.name}</td>
            <td>${characteristics.phase}</td>
            <td class="cell-right-align">${voltage}V</td>
            <td class="cell-right-align">${frequency}Hz</td>
        </tr>
      `
  }).join('')

  table.innerHTML = tableData
}

const updateMainsPowerSensorCards = (sensorData) => {
  document.querySelector('#mains-power').innerHTML = sensorData.map((data) => {
    return `
      <div class="mains-power-card">
        <label>${data.circuit.name}</label>
        <span>${data.watts}W</span>
      </div>
    `
  }).join('') + `
    <div style="clear: both;"></div>
  `
}

const updatePowerSensorDataTable = (sensorData) => {
  const table = document.querySelector('#power-sensor-data')

  let tableData = `
        <tr>
            <th>Circuit</th>
            <th>Group</th>
            <th>Circuit type</th>
            <th>Sensor type</th>
            <th class="cell-right-align">Power</th>
        </tr>
    `

  tableData += sensorData.map((data) => {
    return `
        <tr>
            <td>${data.circuit.name}</td>
            <td>${data.circuit.group ?? ''}</td>
            <td>${data.circuit.type}</td>
            <td>${data.circuit.sensor.type}</td>
            <td class="cell-right-align">${data.watts}W</td>
        </tr>
      `
  }).join('')

  table.innerHTML = tableData
}

const updateConfiguration = (config) => {
  document.querySelector('#configuration').innerHTML = config
}

const updateLastUpdate = (webSocketUrl, timestamp) => {
  const lastUpdate = new Date(timestamp)

  document.querySelector('#last-update').innerHTML = `Last update: ${lastUpdate.toISOString()}, connected to ${webSocketUrl}`
}

const parseTimestamp = (sensorData) => {
  return sensorData[0].timestamp
}

const determineWebSocketUrl = () => {
  const urlParams = new URLSearchParams(window.location.search)

  return urlParams.get('ws')
}

// Determine WebSocket URL from URL parameters
const webSocketUrl = determineWebSocketUrl()
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
      const timestamp = parseTimestamp(message.data)
      updateLastUpdate(webSocketUrl, timestamp)
      break
  }

  // Handle each message type
  switch (message.type) {
    case 'characteristicsSensorData':
      updateCharacteristicsSensorDataTable(message.data)
      break
    case 'powerSensorData':
      const mainsSensorData = message.data.filter((d) => {
        // Filter out unmetered
        return d.circuit.type === 'main' &&
          d.circuit.sensor.type !== 'unmetered'
      })

      const circuitSensorData = message.data.filter((d) => {
        return d.circuit.type === 'circuit'
      })

      updateMainsPowerSensorCards(mainsSensorData)
      updatePowerSensorDataTable(message.data)
      break
    case 'configuration':
      updateConfiguration(message.data)
      break
  }
})
