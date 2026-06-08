# Campus Notification Platform - System Design

## Table of Contents
1. [Stage 1 - REST API Design](#stage-1)
2. [Stage 2 - Database Schema](#stage-2)
3. [Stage 3 - Query Optimization](#stage-3)
4. [Stage 4 - Performance Improvements](#stage-4)
5. [Stage 5 - Event-Driven Architecture](#stage-5)

---

## Stage 1: REST API Design

### Architecture Overview

The notification system follows a client-server architecture with WebSocket support for real-time updates:

```
Frontend Application
        ↕
    HTTP + WebSocket
        ↕
   Notification Server
        ↕
   PostgreSQL Database
```

**Real-time Architecture:**
- Frontend establishes WebSocket connection with Notification Server
- Server pushes notifications without client polling
- Reduces latency and improves user experience

---

### API Endpoints

#### 1. Get All Notifications
- **URL:** `/api/notifications`
- **Method:** `GET`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Query Parameters:**
  ```
  page: number (default: 1)
  limit: number (default: 20)
  type: string (optional: PLACEMENT, RESULT, EVENT)
  isRead: boolean (optional)
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "notifications": [
        {
          "id": "uuid",
          "studentId": "2301430100260",
          "title": "Placement Drive",
          "message": "Amazon is recruiting",
          "type": "PLACEMENT",
          "isRead": false,
          "priority": 3,
          "createdAt": "2026-06-08T10:00:00Z",
          "updatedAt": "2026-06-08T10:00:00Z"
        }
      ],
      "pagination": {
        "total": 100,
        "page": 1,
        "limit": 20,
        "pages": 5
      }
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `401`: Unauthorized
  - `500`: Server Error

---

#### 2. Get Notification By ID
- **URL:** `/api/notifications/:id`
- **Method:** `GET`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "studentId": "2301430100260",
      "title": "Placement Drive",
      "message": "Amazon is recruiting for SDE positions",
      "type": "PLACEMENT",
      "isRead": false,
      "priority": 3,
      "details": {
        "company": "Amazon",
        "date": "2026-07-01",
        "link": "https://example.com/placement"
      },
      "createdAt": "2026-06-08T10:00:00Z",
      "updatedAt": "2026-06-08T10:00:00Z"
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `401`: Unauthorized
  - `404`: Not Found
  - `500`: Server Error

---

#### 3. Create Notification
- **URL:** `/api/notifications`
- **Method:** `POST`
- **Request Headers:**
  ```
  Authorization: Bearer <admin-token>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "studentId": "2301430100260",
    "title": "Placement Drive",
    "message": "Amazon is recruiting",
    "type": "PLACEMENT",
    "priority": 3,
    "details": {
      "company": "Amazon",
      "date": "2026-07-01",
      "link": "https://example.com/placement"
    }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "studentId": "2301430100260",
      "title": "Placement Drive",
      "message": "Amazon is recruiting",
      "type": "PLACEMENT",
      "isRead": false,
      "priority": 3,
      "createdAt": "2026-06-08T10:00:00Z",
      "updatedAt": "2026-06-08T10:00:00Z"
    }
  }
  ```
- **Status Codes:**
  - `201`: Created
  - `400`: Bad Request
  - `401`: Unauthorized
  - `422`: Unprocessable Entity
  - `500`: Server Error

---

#### 4. Mark Notification As Read
- **URL:** `/api/notifications/:id/read`
- **Method:** `PATCH`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "isRead": true
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "isRead": true,
      "updatedAt": "2026-06-08T10:05:00Z"
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `401`: Unauthorized
  - `404`: Not Found
  - `500`: Server Error

---

#### 5. Mark All Notifications As Read
- **URL:** `/api/notifications/read-all`
- **Method:** `PATCH`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {}
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "updatedCount": 15,
      "message": "All notifications marked as read"
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `401`: Unauthorized
  - `500`: Server Error

---

#### 6. Delete Notification
- **URL:** `/api/notifications/:id`
- **Method:** `DELETE`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "message": "Notification deleted successfully"
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `401`: Unauthorized
  - `404`: Not Found
  - `500`: Server Error

---

#### 7. Get Notification Statistics
- **URL:** `/api/notifications/stats`
- **Method:** `GET`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "total": 100,
      "unread": 25,
      "read": 75,
      "byType": {
        "PLACEMENT": 40,
        "RESULT": 30,
        "EVENT": 30
      },
      "byPriority": {
        "HIGH": 20,
        "MEDIUM": 50,
        "LOW": 30
      }
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `401`: Unauthorized
  - `500`: Server Error

---

#### 8. Get Notifications with Filters
- **URL:** `/api/notifications/filter`
- **Method:** `POST`
- **Request Headers:**
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "filters": {
      "type": ["PLACEMENT", "RESULT"],
      "isRead": false,
      "priority": [2, 3],
      "dateFrom": "2026-06-01T00:00:00Z",
      "dateTo": "2026-06-30T23:59:59Z"
    },
    "sortBy": "createdAt",
    "sortOrder": "DESC",
    "page": 1,
    "limit": 20
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "notifications": [],
      "pagination": {
        "total": 0,
        "page": 1,
        "limit": 20,
        "pages": 0
      }
    }
  }
  ```
- **Status Codes:**
  - `200`: Success
  - `400`: Bad Request
  - `401`: Unauthorized
  - `500`: Server Error

---

## Stage 2: Database Schema

### Database Choice: PostgreSQL

#### Justification:
- **ACID Compliance:** Ensures data consistency and reliability
- **Relational Integrity:** Foreign key constraints maintain data relationships
- **Fast Indexing:** B-tree and hash indexes accelerate query performance
- **Reliable Transactions:** MVCC prevents dirty reads and race conditions
- **Strong Query Support:** Complex joins and aggregations are efficient

---

### Database Schema

#### Table 1: students
```sql
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  roll_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  branch VARCHAR(50),
  semester INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 2: notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id BIGINT NOT NULL REFERENCES students(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- PLACEMENT, RESULT, EVENT
  priority INT DEFAULT 1, -- 1: LOW, 2: MEDIUM, 3: HIGH
  is_read BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 3: notification_delivery
```sql
CREATE TABLE notification_delivery (
  id BIGSERIAL PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id),
  student_id BIGINT NOT NULL REFERENCES students(id),
  read_at TIMESTAMP,
  deleted_at TIMESTAMP,
  delivery_method VARCHAR(50), -- IN_APP, EMAIL, PUSH
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Indexes for Performance

```sql
-- Composite index for efficient filtering
CREATE INDEX idx_notifications_student_read_created 
ON notifications(student_id, is_read, created_at DESC);

-- Index on type for filtering by notification type
CREATE INDEX idx_notifications_type 
ON notifications(type);

-- Index on priority for sorting
CREATE INDEX idx_notifications_priority 
ON notifications(priority DESC);

-- Compound index for delivery
CREATE INDEX idx_notification_delivery_student_read 
ON notification_delivery(student_id, read_at);
```

---

### Database Design Considerations

#### Scaling Issues:
- **Write Amplification:** Each notification creates multiple rows in notification_delivery
- **Index Overhead:** Multiple indexes slow write operations
- **Storage Growth:** Historical data accumulates over time

#### Solutions:

1. **Partitioning:**
   ```sql
   -- Partition by date range
   CREATE TABLE notifications_2026_06 PARTITION OF notifications
   FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
   ```

2. **Archiving:**
   - Move old notifications (> 6 months) to archive tables
   - Maintain read-only historical data separately

3. **Replication:**
   - Use read replicas for scaling read operations
   - Implement master-slave replication

4. **Denormalization:**
   - Cache notification counts in students table
   - Update counts via triggers

---

### SQL Queries Matching Stage 1 APIs

#### 1. Get All Notifications (Paginated)
```sql
SELECT 
  n.id, n.student_id, n.title, n.message, n.type, 
  n.is_read, n.priority, n.created_at, n.updated_at
FROM notifications n
WHERE n.student_id = $1 AND n.is_deleted = false
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;
```

#### 2. Get Notification By ID
```sql
SELECT 
  n.id, n.student_id, n.title, n.message, n.type, 
  n.is_read, n.priority, n.details, n.created_at, n.updated_at
FROM notifications n
WHERE n.id = $1 AND n.is_deleted = false;
```

#### 3. Create Notification
```sql
INSERT INTO notifications 
  (student_id, title, message, type, priority, details)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, student_id, title, message, type, is_read, priority, created_at, updated_at;
```

#### 4. Mark Notification As Read
```sql
UPDATE notifications 
SET is_read = true, updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND student_id = $2
RETURNING id, is_read, updated_at;
```

#### 5. Mark All As Read
```sql
UPDATE notifications 
SET is_read = true, updated_at = CURRENT_TIMESTAMP
WHERE student_id = $1 AND is_deleted = false
RETURNING id;
```

#### 6. Delete Notification
```sql
UPDATE notifications 
SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND student_id = $2
RETURNING id;
```

#### 7. Get Notification Statistics
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = false) as unread,
  COUNT(*) FILTER (WHERE is_read = true) as read
FROM notifications
WHERE student_id = $1 AND is_deleted = false;
```

#### 8. Get Notifications with Filters
```sql
SELECT 
  n.id, n.student_id, n.title, n.message, n.type, 
  n.is_read, n.priority, n.created_at
FROM notifications n
WHERE 
  n.student_id = $1 
  AND n.is_deleted = false
  AND ($2::VARCHAR IS NULL OR n.type = $2)
  AND ($3::BOOLEAN IS NULL OR n.is_read = $3)
  AND ($4::INT IS NULL OR n.priority >= $4)
  AND n.created_at >= $5
  AND n.created_at <= $6
ORDER BY n.created_at DESC
LIMIT $7 OFFSET $8;
```

---

## Stage 3: Query Optimization

### Problem Query Analysis

Original Query:
```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = false
ORDER BY created_at ASC;
```

#### Performance Issues:
1. **Full Table Scan:** Without index, database scans all rows
2. **Time Complexity:** O(N) where N is total notifications
3. **Poor Scalability:** Query time increases linearly with data
4. **Memory Usage:** Loads entire result set into memory
5. **CPU Intensive:** Sorting unindexed data expensive

#### Why It's Slow:
- No index on (student_id, is_read, created_at)
- Database has to check every row
- Sorting happens in-memory after filtering
- With 1M+ notifications, this can take seconds

---

### Optimization: Composite Index

#### Solution:
```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at ASC);
```

#### Why This Works:
- **Index Design:** Composite index matches query filter order
- **Time Complexity:** Reduced to O(log N) for index lookup
- **Early Termination:** Index already sorted, no in-memory sort needed
- **Covering Index:** All columns needed are in index

#### Performance Improvement:
- **Before:** 500-2000ms for 1M rows
- **After:** 1-5ms with index
- **Improvement:** 100-500x faster

---

### Index Column Selection

#### Why Indexing Every Column is Harmful:
1. **Write Overhead:** Every INSERT/UPDATE touches all indexes
2. **Storage Cost:** Each index requires disk space
3. **Maintenance:** PostgreSQL maintains index B-trees on every change
4. **Cache Pollution:** More indexes = less cache for data
5. **Query Planning:** Optimizer has more choices, slower decisions

#### Best Practices:
- Index only frequently filtered columns
- Use composite indexes for multi-column filters
- Monitor index usage with `pg_stat_user_indexes`
- Remove unused indexes regularly

---

### Placement Notification Query

Fetch latest placement notifications from last 7 days:

```sql
SELECT 
  n.id,
  n.student_id,
  n.title,
  n.message,
  n.type,
  n.priority,
  n.is_read,
  n.created_at
FROM notifications n
WHERE 
  n.student_id = $1
  AND n.type = 'PLACEMENT'
  AND n.is_deleted = false
  AND n.created_at >= NOW() - INTERVAL '7 days'
ORDER BY n.created_at DESC
LIMIT 50;
```

#### Index Support:
```sql
CREATE INDEX idx_notifications_type_date
ON notifications(type, created_at DESC)
WHERE is_deleted = false;
```

---

## Stage 4: Performance Improvements

### 1. Redis Cache

#### Benefits:
- **Sub-millisecond Response:** In-memory data structure store
- **Reduced DB Load:** Cache popular notifications
- **Session Storage:** Store user preferences and pagination state
- **Rate Limiting:** Implement API rate limiting with Redis counters

#### Tradeoffs:
- **Memory Cost:** Redis stores data in RAM
- **Cache Invalidation:** Managing stale data complexity
- **Operational Overhead:** Requires Redis server management
- **Data Loss:** Non-persistent by default (unless configured)

#### Implementation:
```
Notification Service
        ↓
Check Redis Cache
        ↓
Cache Miss → Query PostgreSQL → Update Cache
Cache Hit → Return cached data
```

---

### 2. Pagination

#### Benefits:
- **Memory Efficient:** Load data in chunks (20-50 per page)
- **Faster Initial Load:** Frontend displays results sooner
- **Better UX:** Users see data incrementally
- **Bandwidth Optimization:** Transfer only needed data

#### Tradeoffs:
- **User Experience:** Multiple clicks to see all data
- **Query Complexity:** Requires OFFSET calculations
- **Cursor Consistency:** Hard to maintain order with concurrent deletes

#### Implementation:
```
Page 1: LIMIT 20 OFFSET 0
Page 2: LIMIT 20 OFFSET 20
Page 3: LIMIT 20 OFFSET 40
```

---

### 3. WebSocket Real-time Updates

#### Benefits:
- **Instant Notifications:** Push updates without polling
- **Reduced Latency:** Real-time delivery (< 100ms)
- **Lower Bandwidth:** Bi-directional communication
- **Connection Persistence:** Maintain live connection

#### Tradeoffs:
- **Server Resources:** Keep connections alive consumes memory
- **Connection Management:** Handle disconnections and reconnections
- **Debugging Difficulty:** Stateful protocol harder to debug
- **Scalability:** Multiple instances need shared state (Redis Pub/Sub)

#### Architecture:
```
Frontend (WebSocket Client)
        ↕ (persistent connection)
   WebSocket Server
        ↕
   Notification Service
        ↕
   PostgreSQL / Redis
```

---

### 4. Read Replicas

#### Benefits:
- **Read Scalability:** Distribute reads across replicas
- **High Availability:** Failover if primary goes down
- **Analytics:** Run heavy queries on replica
- **Georeplication:** Place replicas in different regions

#### Tradeoffs:
- **Replication Lag:** Replicas eventually consistent
- **Increased Complexity:** Managing multiple databases
- **Write Bottleneck:** Writes still go to primary
- **Operational Cost:** Each replica requires infrastructure

#### Setup:
```
Primary Database (writes)
        ↓
Replication Stream
        ↓
Read Replica 1, 2, 3 (reads only)
```

---

### 5. Lazy Loading

#### Benefits:
- **Faster Page Load:** Initial render without all data
- **Reduced Memory:** Load data on demand
- **Improved Perceived Performance:** Perceived speed increases
- **Bandwidth Saving:** Download only visible content

#### Tradeoffs:
- **Implementation Complexity:** Requires client-side logic
- **Harder State Management:** Managing partial data state
- **Poor SEO:** Content not immediately available
- **UX Issues:** Users wait for scrolling data

#### Implementation:
```javascript
// Frontend React component
useEffect(() => {
  // Load first 20 notifications
  fetchNotifications(1, 20);
  
  // On scroll, load more
  const handleScroll = () => {
    if (isNearBottom()) {
      fetchMoreNotifications();
    }
  };
}, []);
```

---

### 6. Notification Count Cache

#### Benefits:
- **Instant Badge Display:** Unread count appears immediately
- **Reduced Queries:** Single count query instead of list query
- **Realtime Updates:** Update count via WebSocket events
- **UI Responsiveness:** Badge updates without full list reload

#### Tradeoffs:
- **Cache Invalidation:** Count must stay in sync
- **Complexity:** Need to invalidate on every notification change
- **Eventual Consistency:** Count might be stale briefly

#### Implementation:
```
On Notification Created:
  1. Insert into notifications table
  2. Increment Redis counter (student_id:unread_count)
  3. Broadcast WebSocket event

On Mark As Read:
  1. Update notifications table
  2. Decrement Redis counter
  3. Broadcast WebSocket event
```

---

### Performance Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│          Frontend Application (React)           │
│         - Pagination (20 items/page)            │
│         - Lazy Loading on scroll                │
│         - WebSocket for real-time updates       │
└──────────────┬──────────────────────────────────┘
               │
               │ WebSocket + HTTP
               ↓
┌─────────────────────────────────────────────────┐
│      Backend API Server (Express + Node.js)     │
│         - Request Logger Middleware             │
│         - Error Handler Middleware              │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ↓             ↓
   ┌─────────┐   ┌──────────┐
   │  Redis  │   │PostgreSQL│
   │ Cache   │   │ Database │
   │         │   │          │
   │- Counts │   │- Durable │
   │- Prefs  │   │- Indexed │
   └─────────┘   └──────────┘
```

---

## Stage 5: Event-Driven Architecture

### Current Problem: Sequential Processing

Original pseudocode had issues:
- HR system sends notification request
- Service processes synchronously
- Database insert happens serially
- Email/Push sent after DB write
- No retry mechanism
- No failure recovery
- Slow end-to-end experience

---

### Redesigned Event-Driven Architecture

```
                    ┌──────────────┐
                    │  HR System   │
                    │   (Admin)    │
                    └──────┬───────┘
                           │
                    Create Notification Event
                           │
                           ↓
                   ┌────────────────┐
                   │ Event Router   │
                   │ (API Endpoint) │
                   └────────┬───────┘
                            │
                    Publish to Message Queue
                            │
                ┌───────────────────────────┐
                │   Message Queue           │
                │   (RabbitMQ/Kafka)        │
                │                           │
                │ - Notification Events    │
                │ - Email Events           │
                │ - Push Events            │
                └───────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
  ┌─────────────┐    ┌────────────┐    ┌─────────────┐
  │   DB Worker │    │Email Worker│    │Push Worker  │
  │             │    │            │    │             │
  │ Insert in   │    │Send Email  │    │Send App Push│
  │PostgreSQL   │    │Notification│    │Notification│
  └─────────────┘    └────────────┘    └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    Dead Letter Queue
                    (for failed events)
                            │
              ┌─────────────────────────┐
              │ Retry Service           │
              │ - Exponential Backoff   │
              │ - Max 3 attempts        │
              └─────────────────────────┘
```

---

### Event-Driven Architecture Benefits

1. **Decoupling:** Notification service doesn't wait for email/push
2. **Scalability:** Add more workers to handle load
3. **Reliability:** Failed events go to Dead Letter Queue
4. **Retry Logic:** Automatic retry with exponential backoff
5. **Monitoring:** Track event flow through message queue
6. **Idempotency:** Process same event multiple times safely

---

### Redesigned Notification Workflow

```
Pseudocode - Event-Driven Notification Service

function processNotificationEvent(event) {
  // Step 1: Validate event
  if (!isValidEvent(event)) {
    sendToDeadLetterQueue(event);
    return;
  }

  // Step 2: Generate unique event ID (idempotency key)
  const eventId = generateUniqueId();
  
  // Step 3: Check if already processed (idempotency)
  if (isEventProcessed(eventId)) {
    log("Event already processed: " + eventId);
    return;
  }

  try {
    // Step 4: Insert notification with transaction
    const notification = beginTransaction();
    insertNotification(notification);
    markEventAsProcessed(eventId);
    commitTransaction();

    // Step 5: Publish events to queue
    publishToQueue("notification.created", notification);
    
    // Step 6: WebSocket push to connected clients
    broadcastToWebSocket(notification.studentId, notification);

    log("Notification created successfully: " + notification.id);

  } catch (error) {
    rollbackTransaction();
    
    // Step 7: Retry logic
    const retryCount = getRetryCount(eventId);
    if (retryCount < MAX_RETRIES) {
      const backoffDelay = calculateExponentialBackoff(retryCount);
      scheduleRetry(eventId, event, backoffDelay);
      log("Retry scheduled for: " + eventId + ", attempt: " + retryCount);
    } else {
      sendToDeadLetterQueue(event);
      log("Event failed after max retries: " + eventId);
      alertAdministrator(error, event);
    }
  }
}

function processEmailEvent(notification) {
  try {
    // Check if email already sent
    if (isEmailSent(notification.id)) {
      log("Email already sent for: " + notification.id);
      return;
    }

    // Send email
    sendEmail({
      to: getStudentEmail(notification.studentId),
      subject: notification.title,
      body: notification.message
    });

    markEmailAsSent(notification.id);
    log("Email sent for notification: " + notification.id);

  } catch (error) {
    handleEmailFailure(notification, error);
  }
}

function processPushEvent(notification) {
  try {
    // Check if push already sent
    if (isPushSent(notification.id)) {
      log("Push already sent for: " + notification.id);
      return;
    }

    // Send push notification
    sendPushNotification({
      studentId: notification.studentId,
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification.id,
        type: notification.type
      }
    });

    markPushAsSent(notification.id);
    log("Push sent for notification: " + notification.id);

  } catch (error) {
    handlePushFailure(notification, error);
  }
}
```

---

### Key Features of Redesigned System

1. **Idempotency:**
   - Process same event multiple times safely
   - Use eventId as unique identifier
   - Check if already processed before acting

2. **Retry Mechanism:**
   - Exponential backoff: 1s, 2s, 4s, 8s...
   - Max 3 retries before Dead Letter Queue
   - Log all retry attempts

3. **Dead Letter Queue:**
   - Capture failed events after max retries
   - Alert administrators
   - Manual intervention possible

4. **Event Ordering:**
   - Use same partition key for related events
   - Kafka ensures order within partition

5. **Monitoring:**
   - Track event flow through system
   - Log all state transitions
   - Alert on Dead Letter Queue events

---

## Summary of All Stages

### Stage 1: REST APIs
- 8 comprehensive notification endpoints
- WebSocket real-time architecture
- Proper HTTP status codes and response formats

### Stage 2: Database Schema
- PostgreSQL with ACID guarantees
- 3 main tables: students, notifications, notification_delivery
- Strategic indexes for performance

### Stage 3: Query Optimization
- Analysis of slow queries
- Composite index solution
- O(log N) vs O(N) complexity improvement

### Stage 4: Performance Improvements
- Redis caching strategy
- Pagination for scalability
- WebSocket for real-time updates
- Read replicas for scaling reads
- Lazy loading for frontend optimization
- Notification count cache for badge display

### Stage 5: Event-Driven Architecture
- Message queue (RabbitMQ/Kafka) integration
- Retry logic with exponential backoff
- Dead Letter Queue for failed events
- Idempotency for safe reprocessing
- Decoupled microservices architecture

---

**End of System Design Documentation**
