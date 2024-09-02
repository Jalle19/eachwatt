import { Publisher, PublisherImpl, PublisherType } from '../publisher'
import { CharacteristicsSensorData, PowerSensorData, untangleCircularDeps } from '../sensor'
import { WebSocket, WebSocketServer } from 'ws'
import { Server } from 'http'

export interface WebSocketPublisherSettings {
  port: number
}

export interface WebSocketPublisher extends Publisher {
  type: PublisherType.WebSocket
  settings: WebSocketPublisherSettings
}

type Message = {
  type: 'configuration' | 'characteristicsSensorData' | 'powerSensorData'
  data: unknown
}

type LastPublishedSensorData = {
  characteristicsSensorData: CharacteristicsSensorData[] | null
  powerSensorData: PowerSensorData[] | null
}

export class WebSocketPublisherImpl implements PublisherImpl {
  wss: WebSocketServer
  lastPublishedSensorData: LastPublishedSensorData

  constructor(config: string, httpServer: Server) {
    // Reuse the HTTP server given to us
    this.wss = new WebSocketServer({ server: httpServer })

    // Keep track of the last published sensor data, so we can deliver it immediately (if available) to newly connected
    // clients
    this.lastPublishedSensorData = {
      characteristicsSensorData: null,
      powerSensorData: null,
    }

    this.wss.on('connection', (ws) => {
      // Send configuration to newly connected clients
      this.sendMessage(ws, {
        type: 'configuration',
        // Don't store as class property to avoid circular references
        data: config,
      })

      // Send last published sensor data immediately
      if (this.lastPublishedSensorData.characteristicsSensorData !== null) {
        this.sendMessage(ws, {
          type: 'characteristicsSensorData',
          data: this.lastPublishedSensorData.characteristicsSensorData,
        })
      }

      if (this.lastPublishedSensorData.powerSensorData !== null) {
        this.sendMessage(ws, {
          type: 'powerSensorData',
          data: this.lastPublishedSensorData.powerSensorData,
        })
      }
    })
  }

  async publishCharacteristicsSensorData(sensorData: CharacteristicsSensorData[]): Promise<void> {
    this.broadcastMessage({
      type: 'characteristicsSensorData',
      data: sensorData,
    })

    this.lastPublishedSensorData.characteristicsSensorData = sensorData
  }

  async publishSensorData(sensorData: PowerSensorData[]): Promise<void> {
    // Remove circular references so we can encode as JSON
    sensorData = untangleCircularDeps(sensorData)

    this.broadcastMessage({
      type: 'powerSensorData',
      data: sensorData,
    })

    this.lastPublishedSensorData.powerSensorData = sensorData
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
