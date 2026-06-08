// src/utils/cache-manager.ts
import { logger } from './logger'

/**
 * Stage 4: Performance Improvements
 * 
 * Caching Strategy:
 * 1. Notification Count Cache - Quick badge updates
 * 2. Recent Notifications Cache - Common queries
 * 3. Statistics Cache - Dashboard metrics
 * 4. Student Preferences Cache - User settings
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
  hitCount: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL
    const expiresAt = Date.now() + ttl

    this.cache.set(key, {
      data,
      expiresAt,
      createdAt: Date.now(),
      hitCount: 0,
    })

    logger.debug('Cache SET', { key, ttl })
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      logger.debug('Cache MISS', { key })
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      logger.debug('Cache EXPIRED', { key })
      return null
    }

    entry.hitCount++
    logger.debug('Cache HIT', { key, hits: entry.hitCount })
    return entry.data as T
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
      logger.debug('Cache DELETE', { key })
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info('Cache CLEARED', { entriesCleared: size })
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0
    let totalSize = 0
    let expiredCount = 0
    const now = Date.now()

    this.cache.forEach((entry, key) => {
      totalHits += entry.hitCount
      totalSize += JSON.stringify(entry.data).length

      if (now > entry.expiresAt) {
        expiredCount++
      }
    })

    return {
      totalEntries: this.cache.size,
      validEntries: this.cache.size - expiredCount,
      expiredEntries: expiredCount,
      totalHits,
      estimatedSizeKB: Math.round(totalSize / 1024),
    }
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

export const cacheManager = new CacheManager()

/**
 * Cache Keys Registry
 */
export const CacheKeys = {
  STUDENT_NOTIFICATIONS: (studentId: string, page: number) =>
    `notifications:${studentId}:page:${page}`,
  STUDENT_UNREAD_COUNT: (studentId: string) => `unread:${studentId}`,
  STUDENT_STATS: (studentId: string) => `stats:${studentId}`,
  NOTIFICATION: (notificationId: string) => `notification:${notificationId}`,
  FILTERED_NOTIFICATIONS: (studentId: string, filter: string) =>
    `filtered:${studentId}:${filter}`,
}

/**
 * Caching Benefits & Tradeoffs
 */
export const cachingAnalysis = {
  benefits: [
    'Sub-millisecond response times for cached data',
    'Reduced database load for frequently accessed data',
    'Faster user interface - badges update instantly',
    'Better scalability - less database queries',
    'Reduced network latency for common queries',
  ],

  tradeoffs: [
    'Memory consumption increases with cache size',
    'Cache invalidation complexity - keeping data fresh',
    'Operational overhead - requires cache server management',
    'Data loss risk if cache server crashes',
    'Eventual consistency - brief inconsistencies possible',
    'Requires cache busting logic on data changes',
  ],

  strategy: {
    shortLived: {
      ttl: '1 minute',
      data: ['Unread counts', 'Statistics'],
      reason: 'Changes frequently, needs fresh data',
    },
    mediumLived: {
      ttl: '5 minutes',
      data: ['Recent notifications', 'User preferences'],
      reason: 'Moderate change frequency, acceptable staleness',
    },
    longLived: {
      ttl: '30 minutes',
      data: ['Static content', 'Reference data'],
      reason: 'Rarely changes, can tolerate staleness',
    },
  },
}

/**
 * Pagination Benefits & Implementation
 */
export const paginationAnalysis = {
  benefits: [
    'Memory efficient - load data in chunks not all at once',
    'Faster initial load - first page appears quickly',
    'Better user experience - progressive data loading',
    'Bandwidth optimization - transfer only needed data',
    'Server scalability - reduced memory per request',
  ],

  tradeoffs: [
    'User must click to see more data',
    'Query complexity increases with OFFSET',
    'Cursor consistency issues with concurrent deletes',
    'More network requests',
    'Potential for gaps in data',
  ],

  implementation: {
    defaultLimit: 20,
    maxLimit: 100,
    offsetBased: {
      pros: 'Easy to implement, works with ORDER BY',
      cons: 'Slow for large offsets, inconsistent with deletes',
      example: 'LIMIT 20 OFFSET (page-1)*20',
    },
    cursorBased: {
      pros: 'Fast, consistent ordering, efficient',
      cons: 'Complex to implement, requires cursor field',
      example: 'WHERE id > cursor LIMIT 20',
    },
  },
}

/**
 * WebSocket Real-time Benefits
 */
export const websocketAnalysis = {
  benefits: [
    'Instant notifications - real-time push without polling',
    'Reduced latency - < 100ms for updates',
    'Lower bandwidth - bidirectional communication',
    'Connection persistence - maintained live connection',
    'Better UX - no need for manual refresh',
    'Server-initiated updates - push instead of pull',
  ],

  tradeoffs: [
    'Server memory consumption - keep connections alive',
    'Connection management complexity - handle disconnects',
    'Debugging difficulty - stateful protocol',
    'Scalability - multiple instances need shared state',
    'Browser compatibility - older browsers may not support',
    'Firewall issues - some proxies block WebSocket',
  ],

  architecture: {
    clientAction: 'User opens notifications page',
    step1: 'Client establishes WebSocket connection',
    step2: 'Server stores connection reference',
    step3: 'New notification created in database',
    step4: 'Backend broadcasts via WebSocket',
    step5: 'Client receives and updates UI instantly',
    result: '< 100ms total latency',
  },
}

/**
 * Read Replicas Strategy
 */
export const readReplicasAnalysis = {
  benefits: [
    'Horizontal read scalability - distribute reads across replicas',
    'High availability - automatic failover if primary fails',
    'Analytics support - run heavy queries on replica',
    'Georeplication - serve users from nearby replica',
    'Increased throughput - more parallel queries',
  ],

  tradeoffs: [
    'Replication lag - replicas eventually consistent',
    'Increased complexity - managing multiple databases',
    'Write bottleneck - all writes still go to primary',
    'Operational cost - each replica requires infrastructure',
    'Maintenance overhead - keeping replicas in sync',
  ],

  setup: {
    primary: 'Handle all writes and replicate to replicas',
    replica1: 'Read-only, behind primary',
    replica2: 'Read-only, behind primary',
    replicationLag: '< 1 second typical',
    writePath: 'All writes go to primary only',
    readPath: 'Reads distributed to replicas',
  },
}

/**
 * Lazy Loading Strategy
 */
export const lazyLoadingAnalysis = {
  benefits: [
    'Faster page load - render without all data',
    'Reduced memory - load data on demand',
    'Better perceived performance - content appears quickly',
    'Bandwidth saving - download only visible content',
    'Improved mobile experience - less data usage',
  ],

  tradeoffs: [
    'Implementation complexity - client-side state management',
    'Poor SEO - content not immediately available',
    'User experience - wait for scroll data',
    'Complex state management - partial data loading',
    'Potential network issues - more HTTP requests',
  ],

  implementation: {
    intersection: 'Use Intersection Observer API',
    virtualization: 'React Window for virtual lists',
    pagination: 'Traditional page-based pagination',
  },
}

/**
 * Notification Count Cache
 */
export const notificationCountCacheAnalysis = {
  benefits: [
    'Instant badge display - no query needed',
    'Reduced queries - single count lookup',
    'Realtime updates - via WebSocket events',
    'UI responsiveness - badge updates instantly',
    'Better UX - shows unread count immediately',
  ],

  tradeoffs: [
    'Cache invalidation - must update on changes',
    'Consistency issues - count might be stale',
    'Extra storage - maintaining count table',
    'Trigger overhead - update count on every change',
  ],

  implementation: {
    storage: 'PostgreSQL materialized view or cache table',
    updateTrigger: 'On notification insert/read/delete',
    updateMethod: 'Increment/Decrement counter',
    ttl: '1 minute - refresh via background job',
  },
}

export default {
  cacheManager,
  CacheKeys,
  cachingAnalysis,
  paginationAnalysis,
  websocketAnalysis,
  readReplicasAnalysis,
  lazyLoadingAnalysis,
  notificationCountCacheAnalysis,
}
