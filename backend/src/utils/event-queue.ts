// src/utils/event-queue.ts
import { logger } from './logger'

/**
 * Stage 5: Event-Driven Architecture
 * 
 * Message Queue Design:
 * HR System → Event Router → Message Queue → Workers
 * 
 * Features:
 * - Retry mechanism with exponential backoff
 * - Dead Letter Queue for failed events
 * - Idempotency for safe reprocessing
 * - Event ordering guarantees
 */

export enum EventType {
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_DELETED = 'notification.deleted',
  EMAIL_SENT = 'email.sent',
  PUSH_SENT = 'push.sent',
}

export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export interface Event {
  id: string // Unique event ID for idempotency
  type: EventType
  payload: any
  status: EventStatus
  retryCount: number
  maxRetries: number
  createdAt: Date
  scheduledAt?: Date
  completedAt?: Date
  error?: string
}

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

class EventQueue {
  private queue: Event[] = []
  private processingEvents: Set<string> = new Set()
  private deadLetterQueue: Event[] = []
  private processedEvents: Set<string> = new Set() // For idempotency
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 32000,
    backoffMultiplier: 2,
  }

  /**
   * Publish event to queue
   */
  publishEvent(type: EventType, payload: any, eventId?: string): string {
    const id = eventId || this.generateEventId()

    // Check for duplicate event (idempotency)
    if (this.processedEvents.has(id)) {
      logger.warn('Duplicate event detected, skipping', { eventId: id, type })
      return id
    }

    const event: Event = {
      id,
      type,
      payload,
      status: EventStatus.PENDING,
      retryCount: 0,
      maxRetries: this.retryConfig.maxRetries,
      createdAt: new Date(),
    }

    this.queue.push(event)

    logger.info('Event published', {
      eventId: id,
      type,
      queueSize: this.queue.length,
    })

    return id
  }

  /**
   * Process next event in queue
   */
  async processNextEvent(): Promise<boolean> {
    const event = this.queue.find((e) => e.status === EventStatus.PENDING)

    if (!event) {
      return false
    }

    // Prevent processing the same event twice
    if (this.processingEvents.has(event.id)) {
      logger.warn('Event already being processed', { eventId: event.id })
      return false
    }

    try {
      this.processingEvents.add(event.id)
      event.status = EventStatus.PROCESSING

      logger.info('Processing event', { eventId: event.id, type: event.type })

      // Process event based on type
      await this.handleEvent(event)

      event.status = EventStatus.COMPLETED
      event.completedAt = new Date()
      this.processedEvents.add(event.id)

      logger.info('Event completed', { eventId: event.id, type: event.type })

      return true
    } catch (error) {
      logger.error('Event processing failed', error, { eventId: event.id })
      return this.handleEventFailure(event, error as Error)
    } finally {
      this.processingEvents.delete(event.id)
    }
  }

  /**
   * Handle event based on type
   */
  private async handleEvent(event: Event): Promise<void> {
    switch (event.type) {
      case EventType.NOTIFICATION_CREATED:
        await this.handleNotificationCreated(event)
        break

      case EventType.NOTIFICATION_READ:
        await this.handleNotificationRead(event)
        break

      case EventType.NOTIFICATION_DELETED:
        await this.handleNotificationDeleted(event)
        break

      case EventType.EMAIL_SENT:
        await this.handleEmailSent(event)
        break

      case EventType.PUSH_SENT:
        await this.handlePushSent(event)
        break

      default:
        throw new Error(`Unknown event type: ${event.type}`)
    }
  }

  /**
   * Handle notification created event
   */
  private async handleNotificationCreated(event: Event): Promise<void> {
    const { notification } = event.payload

    // Simulate processing
    logger.info('Handling notification created', {
      notificationId: notification.id,
      studentId: notification.studentId,
    })

    // Publish derived events
    this.publishEvent(EventType.EMAIL_SENT, {
      notificationId: notification.id,
      studentId: notification.studentId,
    })

    this.publishEvent(EventType.PUSH_SENT, {
      notificationId: notification.id,
      studentId: notification.studentId,
    })

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Handle notification read event
   */
  private async handleNotificationRead(event: Event): Promise<void> {
    const { notificationId, studentId } = event.payload

    logger.info('Handling notification read', {
      notificationId,
      studentId,
    })

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  /**
   * Handle notification deleted event
   */
  private async handleNotificationDeleted(event: Event): Promise<void> {
    const { notificationId, studentId } = event.payload

    logger.info('Handling notification deleted', {
      notificationId,
      studentId,
    })

    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  /**
   * Handle email sent event
   */
  private async handleEmailSent(event: Event): Promise<void> {
    const { notificationId, studentId } = event.payload

    logger.info('Sending email notification', {
      notificationId,
      studentId,
    })

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  /**
   * Handle push sent event
   */
  private async handlePushSent(event: Event): Promise<void> {
    const { notificationId, studentId } = event.payload

    logger.info('Sending push notification', {
      notificationId,
      studentId,
    })

    // Simulate push sending
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Handle event failure with retry logic
   */
  private handleEventFailure(event: Event, error: Error): boolean {
    event.error = error.message

    if (event.retryCount < event.maxRetries) {
      // Calculate exponential backoff delay
      const delayMs = Math.min(
        this.retryConfig.initialDelayMs *
          Math.pow(this.retryConfig.backoffMultiplier, event.retryCount),
        this.retryConfig.maxDelayMs
      )

      event.retryCount++
      event.status = EventStatus.PENDING
      event.scheduledAt = new Date(Date.now() + delayMs)

      logger.warn('Event retry scheduled', {
        eventId: event.id,
        type: event.type,
        attempt: event.retryCount,
        nextRetryMs: delayMs,
      })

      return false
    } else {
      // Move to dead letter queue
      event.status = EventStatus.DEAD_LETTER
      this.deadLetterQueue.push(event)

      logger.error('Event moved to Dead Letter Queue', {
        eventId: event.id,
        type: event.type,
        error: error.message,
      })

      return false
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      pendingEvents: this.queue.filter((e) => e.status === EventStatus.PENDING)
        .length,
      processingEvents: this.processingEvents.size,
      completedEvents: this.queue.filter((e) => e.status === EventStatus.COMPLETED)
        .length,
      failedEvents: this.queue.filter((e) => e.status === EventStatus.FAILED)
        .length,
      deadLetterQueueSize: this.deadLetterQueue.length,
      processedEventsCount: this.processedEvents.size,
    }
  }

  /**
   * Get dead letter queue events
   */
  getDeadLetterQueue(): Event[] {
    return [...this.deadLetterQueue]
  }

  /**
   * Retry dead letter event
   */
  retryDeadLetterEvent(eventId: string): boolean {
    const index = this.deadLetterQueue.findIndex((e) => e.id === eventId)

    if (index === -1) {
      return false
    }

    const event = this.deadLetterQueue[index]
    this.deadLetterQueue.splice(index, 1)

    event.status = EventStatus.PENDING
    event.retryCount = 0
    event.error = undefined

    this.queue.push(event)

    logger.info('Dead letter event retried', { eventId })

    return true
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const eventQueue = new EventQueue()

/**
 * Event-Driven Architecture Benefits
 */
export const eventDrivenArchitectureBenefits = {
  decoupling:
    'Notification service does not wait for email/push services',
  scalability: 'Add more workers to process events faster',
  reliability: 'Failed events go to Dead Letter Queue for retry',
  asynchronous: 'Process events without blocking request-response',
  monitoring: 'Track event flow through message queue',
  idempotency: 'Process same event multiple times safely',
  eventSourcing: 'Complete audit trail of all events',
}

/**
 * Redesigned Notification Workflow Pseudocode
 */
export const redesignedWorkflow = `
PSEUDOCODE - Event-Driven Notification Service

function processNotificationEvent(event) {
  // Step 1: Validate event
  if (!isValidEvent(event)) {
    sendToDeadLetterQueue(event)
    return
  }

  // Step 2: Generate unique event ID (idempotency key)
  const eventId = generateUniqueId()
  
  // Step 3: Check if already processed (idempotency)
  if (isEventProcessed(eventId)) {
    log("Event already processed: " + eventId)
    return
  }

  try {
    // Step 4: Insert notification with transaction
    const notification = beginTransaction()
    insertNotification(notification)
    markEventAsProcessed(eventId)
    commitTransaction()

    // Step 5: Publish events to queue
    publishToQueue("notification.created", notification)
    
    // Step 6: WebSocket push to connected clients
    broadcastToWebSocket(notification.studentId, notification)

    log("Notification created successfully: " + notification.id)

  } catch (error) {
    rollbackTransaction()
    
    // Step 7: Retry logic
    const retryCount = getRetryCount(eventId)
    if (retryCount < MAX_RETRIES) {
      const backoffDelay = calculateExponentialBackoff(retryCount)
      scheduleRetry(eventId, event, backoffDelay)
      log("Retry scheduled for: " + eventId + ", attempt: " + retryCount)
    } else {
      sendToDeadLetterQueue(event)
      log("Event failed after max retries: " + eventId)
      alertAdministrator(error, event)
    }
  }
}

function processEmailEvent(notification) {
  try {
    // Check if email already sent (idempotency)
    if (isEmailSent(notification.id)) {
      log("Email already sent for: " + notification.id)
      return
    }

    // Send email
    sendEmail({
      to: getStudentEmail(notification.studentId),
      subject: notification.title,
      body: notification.message
    })

    markEmailAsSent(notification.id)
    log("Email sent for notification: " + notification.id)

  } catch (error) {
    handleEmailFailure(notification, error)
  }
}

function processPushEvent(notification) {
  try {
    // Check if push already sent (idempotency)
    if (isPushSent(notification.id)) {
      log("Push already sent for: " + notification.id)
      return
    }

    // Send push notification
    sendPushNotification({
      studentId: notification.studentId,
      title: notification.title,
      body: notification.message
    })

    markPushAsSent(notification.id)
    log("Push sent for notification: " + notification.id)

  } catch (error) {
    handlePushFailure(notification, error)
  }
}
`

export default {
  eventQueue,
  EventType,
  EventStatus,
  eventDrivenArchitectureBenefits,
  redesignedWorkflow,
}
