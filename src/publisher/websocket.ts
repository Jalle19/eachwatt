import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData, untangleCircularDeps } from '../sensor'
import { WebSocket, WebSocketServer } from 'ws'

export interface WebSocketPublisherSettings {
  port: number
}

export interface WebSocketPublisher extends Publisher {
  type: PublisherType.WebSocket
  settings: WebSocketPublisherSettings
}

type Message = {
  type: string
  data: any
}

export class WebSocketPublisherImpl implements PublisherImpl {
  wss: WebSocketServer

  constructor(config: string, settings: WebSocketPublisherSettings) {
    this.wss = new WebSocketServer({ port: settings.port })

    this.wss.on('connection', (ws) => {
      // Send configuration to newly connected clients
      this.sendMessage(ws, {
        type: 'configuration',
        // Don't store as class property to avoid circular references
        data: config,
      })
    })
  }

  publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): void {
    this.broadcastMessage({
      type: 'characteristicsSensorData',
      data: sensorData,
    })
  }

  publishSensorData(sensorData: PowerSensorData[]): void {
    // Remove circular references so we can encode as JSON
    sensorData = untangleCircularDeps(sensorData)

    this.broadcastMessage({
      type: 'powerSensorData',
      data: sensorData,
    })
  }

  private sendMessage = (ws: WebSocket, message: Message): void => {
    ws.send(JSON.stringify(message))
  }

  private broadcastMessage(message: Message): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }
}
