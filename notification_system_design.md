# Notification System Design

## Overview

This document describes the design and architecture of the Notification Management System — a full-stack web application that allows users to create, view, and delete notifications. The system is composed of a React frontend, an Express backend, and a reusable logging middleware package that integrates with an external logging API.

---

## Functional Requirements

- **Create Notification**: Users can submit a notification with a title, message, and type.
- **View Notifications**: Users can view a list of all existing notifications.
- **View Single Notification**: Users can retrieve a notification by its unique ID.
- **Delete Notification**: Users can delete any existing notification.

---

## Non-Functional Requirements

### Reliability
- All API endpoints include error handling and return consistent JSON responses.
- The logging middleware fails gracefully — a logging failure never crashes the application.

### Scalability
- In-memory storage is used currently; the repository pattern makes swapping to a database straightforward.
- The stateless Express backend can be horizontally scaled behind a load balancer.

### Maintainability
- Clean architecture: controllers → services → repositories with clear separation of concerns.
- TypeScript throughout ensures type safety and easier refactoring.
- The logging middleware is a standalone reusable package consumed by both frontend and backend.

### Logging
- Every significant event (route hit, validation failure, success, error) is logged via the logging middleware.
- Logs include stack, level, package, and message for structured observability.

### Monitoring
- Health check endpoint (`GET /health`) enables uptime monitoring.
- Structured logs enable integration with log aggregation tools (e.g., Datadog, Elastic).

---

## Architecture

```
User (Browser)
     │
     ▼
React Frontend (Vite + MUI)
     │  Axios HTTP calls
     ▼
Express Backend (Node.js + TypeScript)
     │
     ├─── Middleware Layer (request logger, validation, error handler)
     │
     ▼
Notification Service
     │
     ▼
Notification Repository (In-Memory Array)

─────────────────────────────
Logging Flow:

Frontend  ──┐
            ├──► Logging Middleware ──► Logging API (POST /logs)
Backend   ──┘
```

### Component Breakdown

| Component | Responsibility |
|-----------|---------------|
| `logging-middleware` | Reusable Log() function; validates params; posts to logging API |
| `notification_app_be` | REST API; business logic; in-memory storage |
| `notification_app_fe` | React UI; form + list pages; axios integration |

---

## API Design

### POST /notifications
Create a new notification.

**Request:**
```json
{
  "title": "Server Alert",
  "message": "CPU usage high",
  "type": "system"
}
```

**Response (201):**
```json
{
  "success": true,
  "notification": {
    "id": "uuid-here",
    "title": "Server Alert",
    "message": "CPU usage high",
    "type": "system",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (400 - Validation Failure):**
```json
{
  "success": false,
  "errors": ["title field missing or empty"]
}
```

---

### GET /notifications
Get all notifications.

**Response (200):**
```json
[
  {
    "id": "uuid-here",
    "title": "Server Alert",
    "message": "CPU usage high",
    "type": "system",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### GET /notifications/:id
Get a specific notification.

**Response (200):** Notification object  
**Response (404):**
```json
{ "success": false, "message": "Notification not found" }
```

---

### DELETE /notifications/:id
Delete a notification.

**Response (200):**
```json
{ "success": true }
```

**Response (404):**
```json
{ "success": false, "message": "Notification not found" }
```

---

### GET /health
Health check endpoint.

**Response (200):**
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Error Handling Strategy

### Validation Errors
- Handled in `validation.middleware.ts` before reaching the controller.
- Returns HTTP 400 with a list of validation errors.
- Logged with level `warn` and package `handler`.

### Runtime Errors
- Caught in controllers with try/catch blocks.
- Passed to the global `errorHandler` middleware via `next(err)`.
- Returns HTTP 500 with an error message.
- Logged with level `fatal` and package `service` or `middleware`.

### Logging Failures
- Axios errors in the Log() function are caught silently.
- The application continues to function normally even if the logging API is unreachable.
- A console warning is printed for observability during development.

---

## Future Enhancements

- **Email Notifications**: Integrate with SendGrid or AWS SES for email delivery.
- **SMS Notifications**: Integrate with Twilio for SMS delivery.
- **Push Notifications**: Implement WebSocket or Firebase Cloud Messaging.
- **Queue-Based Processing**: Use BullMQ or AWS SQS for async notification delivery.
- **Redis Caching**: Cache frequently-read notifications to reduce DB load.
- **Database Integration**: Replace in-memory storage with PostgreSQL or MongoDB using the existing repository interface.
- **Authentication**: Add JWT-based user authentication and per-user notifications.
- **Pagination**: Add cursor/offset-based pagination to GET /notifications.
