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

  constructor (settings: WebSocketPublisherSettings) {
    this.wss = new WebSocketServer({ port: settings.port })
  }

  publishCharacteristicsSensorData (sensorData: CharacteristicsSensorData[]): void {
    this.broadcastAsJson({
      type: 'characteristicsSensorData',
      data: sensorData,
    })
  }

  publishSensorData (sensorData: PowerSensorData[]): void {
    // Remove circular references so we can encode as JSON
    sensorData = untangleCircularDeps(sensorData)

    this.broadcastAsJson({
      type: 'powerSensorData',
      data: sensorData,
    })
  }

  private broadcastAsJson (message: Message): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }
}
