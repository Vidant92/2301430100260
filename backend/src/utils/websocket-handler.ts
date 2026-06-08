// src/utils/websocket-handler.ts
import WebSocket from 'ws'
import { logger } from './logger'

/**
 * Stage 4: WebSocket Real-time Updates
 * 
 * Architecture:
 * Frontend connects to WebSocket server
 * When notification is created:
 * 1. Backend inserts into database
 * 2. Backend broadcasts via WebSocket
 * 3. Frontend receives and updates UI immediately
 */

interface ClientConnection {
  id: string
  studentId: string
  ws: WebSocket
  connectedAt: Date
}

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

class WebSocketHandler {
  private clients: Map<string, ClientConnection> = new Map()
  private messageQueue: WebSocketMessage[] = []

  /**
   * Register new client connection
   */
  registerClient(clientId: string, studentId: string, ws: WebSocket): void {
    const connection: ClientConnection = {
      id: clientId,
      studentId,
      ws,
      connectedAt: new Date(),
    }

    this.clients.set(clientId, connection)

    logger.info('WebSocket client connected', {
      clientId,
      studentId,
      totalConnections: this.clients.size,
    })

    // Send connection confirmation
    this.sendToClient(clientId, {
      type: 'CONNECTED',
      data: {
        clientId,
        message: 'Connected to notification server',
      },
    })

    // Handle incoming messages
    ws.on('message', (message: string) => {
      this.handleClientMessage(clientId, message)
    })

    // Handle disconnection
    ws.on('close', () => {
      this.removeClient(clientId)
    })

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', error, { clientId })
      this.removeClient(clientId)
    })
  }

  /**
   * Handle incoming message from client
   */
  private handleClientMessage(clientId: string, message: string): void {
    try {
      const msg = JSON.parse(message)
      logger.debug('WebSocket message received', {
        clientId,
        type: msg.type,
      })

      switch (msg.type) {
        case 'PING':
          this.sendToClient(clientId, {
            type: 'PONG',
            data: { message: 'Pong' },
          })
          break

        case 'SUBSCRIBE':
          logger.info('Client subscribed to notifications', { clientId })
          break

        case 'UNSUBSCRIBE':
          logger.info('Client unsubscribed from notifications', { clientId })
          break

        default:
          logger.warn('Unknown message type', { clientId, type: msg.type })
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message', error, { clientId })
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WebSocketMessage): void {
    const connection = this.clients.get(clientId)

    if (!connection) {
      logger.warn('Client not found', { clientId })
      return
    }

    try {
      connection.ws.send(JSON.stringify(message))
      logger.debug('Message sent to client', {
        clientId,
        type: message.type,
      })
    } catch (error) {
      logger.error('Error sending message to client', error, { clientId })
      this.removeClient(clientId)
    }
  }

  /**
   * Broadcast to all clients of a student
   */
  broadcastToStudent(studentId: string, message: WebSocketMessage): void {
    let broadcastCount = 0

    this.clients.forEach((connection, clientId) => {
      if (connection.studentId === studentId) {
        try {
          connection.ws.send(JSON.stringify(message))
          broadcastCount++
        } catch (error) {
          logger.error('Error broadcasting message', error, { clientId })
          this.removeClient(clientId)
        }
      }
    })

    logger.info('Broadcast sent', {
      studentId,
      type: message.type,
      recipientCount: broadcastCount,
    })
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(message: WebSocketMessage): void {
    let broadcastCount = 0

    this.clients.forEach((connection, clientId) => {
      try {
        connection.ws.send(JSON.stringify(message))
        broadcastCount++
      } catch (error) {
        logger.error('Error broadcasting to all', error, { clientId })
        this.removeClient(clientId)
      }
    })

    logger.info('Broadcast to all clients', {
      type: message.type,
      recipientCount: broadcastCount,
    })
  }

  /**
   * Remove client connection
   */
  private removeClient(clientId: string): void {
    const connection = this.clients.get(clientId)

    if (connection) {
      try {
        connection.ws.close()
      } catch (error) {
        logger.warn('Error closing WebSocket', error)
      }

      this.clients.delete(clientId)

      logger.info('WebSocket client disconnected', {
        clientId,
        studentId: connection.studentId,
        totalConnections: this.clients.size,
      })
    }
  }

  /**
   * Notify notification created
   */
  notifyNotificationCreated(studentId: string, notification: any): void {
    this.broadcastToStudent(studentId, {
      type: 'NOTIFICATION_CREATED',
      data: notification,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Notify notification read
   */
  notifyNotificationRead(studentId: string, notificationId: string): void {
    this.broadcastToStudent(studentId, {
      type: 'NOTIFICATION_READ',
      data: { notificationId },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Notify unread count changed
   */
  notifyUnreadCountChanged(studentId: string, unreadCount: number): void {
    this.broadcastToStudent(studentId, {
      type: 'UNREAD_COUNT_CHANGED',
      data: { unreadCount },
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const studentStats: { [studentId: string]: number } = {}

    this.clients.forEach((connection) => {
      studentStats[connection.studentId] =
        (studentStats[connection.studentId] || 0) + 1
    })

    return {
      totalConnections: this.clients.size,
      studentStats,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get all connected students
   */
  getConnectedStudents(): string[] {
    const students = new Set<string>()
    this.clients.forEach((connection) => {
      students.add(connection.studentId)
    })
    return Array.from(students)
  }

  /**
   * Check if student is connected
   */
  isStudentConnected(studentId: string): boolean {
    for (const connection of this.clients.values()) {
      if (connection.studentId === studentId) {
        return true
      }
    }
    return false
  }
}

export const websocketHandler = new WebSocketHandler()

/**
 * WebSocket Message Types
 */
export enum WebSocketEventType {
  // Connection
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',

  // Ping/Pong
  PING = 'PING',
  PONG = 'PONG',

  // Subscriptions
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',

  // Notifications
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
  NOTIFICATION_READ = 'NOTIFICATION_READ',
  NOTIFICATION_DELETED = 'NOTIFICATION_DELETED',
  UNREAD_COUNT_CHANGED = 'UNREAD_COUNT_CHANGED',

  // Updates
  NOTIFICATIONS_UPDATED = 'NOTIFICATIONS_UPDATED',
  STATS_UPDATED = 'STATS_UPDATED',
}

export default {
  websocketHandler,
  WebSocketEventType,
}
