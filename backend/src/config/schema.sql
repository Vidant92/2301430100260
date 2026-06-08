-- Campus Notification Platform - PostgreSQL Schema
-- Stage 2: Database Design
-- Created: 2026-06-08

-- ============================================================================
-- 1. STUDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
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

CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_email ON students(email);

-- ============================================================================
-- 2. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
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

-- Critical composite index for Stage 1 queries
-- Optimization: Use (student_id, is_read, created_at DESC) for efficient filtering
CREATE INDEX IF NOT EXISTS idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at DESC);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type
ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_priority
ON notifications(priority DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created
ON notifications(created_at DESC);

-- ============================================================================
-- 3. NOTIFICATION DELIVERY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_delivery (
  id BIGSERIAL PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id),
  student_id BIGINT NOT NULL REFERENCES students(id),
  read_at TIMESTAMP,
  deleted_at TIMESTAMP,
  delivery_method VARCHAR(50), -- IN_APP, EMAIL, PUSH
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_student_read
ON notification_delivery(student_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_notification
ON notification_delivery(notification_id);

-- ============================================================================
-- 4. MATERIALIZED STATISTICS TABLE (for caching counts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_stats (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT UNIQUE NOT NULL REFERENCES students(id),
  total_count INT DEFAULT 0,
  unread_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_stats_student
ON notification_stats(student_id);

-- ============================================================================
-- 5. TRIGGER FUNCTIONS FOR MAINTAINING COUNTS
-- ============================================================================

-- Function to update stats on notification insert
CREATE OR REPLACE FUNCTION update_notification_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_stats (student_id, total_count, unread_count, read_count)
  VALUES (NEW.student_id, 1, 1, 0)
  ON CONFLICT (student_id) DO UPDATE SET
    total_count = total_count + 1,
    unread_count = unread_count + 1,
    last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update stats on notification read
CREATE OR REPLACE FUNCTION update_notification_stats_on_read()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_read = false AND NEW.is_read = true THEN
    UPDATE notification_stats
    SET 
      unread_count = GREATEST(0, unread_count - 1),
      read_count = read_count + 1,
      last_updated = CURRENT_TIMESTAMP
    WHERE student_id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update stats on notification delete
CREATE OR REPLACE FUNCTION update_notification_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
    UPDATE notification_stats
    SET 
      total_count = GREATEST(0, total_count - 1),
      unread_count = CASE WHEN OLD.is_read = false THEN GREATEST(0, unread_count - 1) ELSE unread_count END,
      read_count = CASE WHEN OLD.is_read = true THEN GREATEST(0, read_count - 1) ELSE read_count END,
      last_updated = CURRENT_TIMESTAMP
    WHERE student_id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_notification_insert ON notifications;
CREATE TRIGGER trg_notification_insert
AFTER INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION update_notification_stats_on_insert();

DROP TRIGGER IF EXISTS trg_notification_read ON notifications;
CREATE TRIGGER trg_notification_read
AFTER UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_notification_stats_on_read();

DROP TRIGGER IF EXISTS trg_notification_delete ON notifications;
CREATE TRIGGER trg_notification_delete
AFTER UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_notification_stats_on_delete();

-- ============================================================================
-- 6. SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample student
INSERT INTO students (roll_number, name, email, phone, branch, semester)
VALUES 
  ('2301430100260', 'Candidate Student', 'candidate@college.edu', '9876543210', 'CSE', 6)
ON CONFLICT (roll_number) DO NOTHING;

-- ============================================================================
-- 7. PERFORMANCE OPTIMIZATION QUERIES
-- ============================================================================

-- QUERY: Get all notifications for a student (optimized with composite index)
-- Complexity: O(log N) due to index
-- SELECT *
-- FROM notifications
-- WHERE student_id = $1 AND is_read = false AND is_deleted = false
-- ORDER BY created_at DESC
-- LIMIT 20;

-- QUERY: Get unread count for badge display
-- SELECT COUNT(*) 
-- FROM notifications 
-- WHERE student_id = $1 AND is_read = false AND is_deleted = false;

-- QUERY: Mark all notifications as read
-- UPDATE notifications 
-- SET is_read = true, updated_at = CURRENT_TIMESTAMP
-- WHERE student_id = $1 AND is_read = false AND is_deleted = false;

-- QUERY: Get placement notifications from last 7 days
-- SELECT * 
-- FROM notifications
-- WHERE student_id = $1 
-- AND type = 'PLACEMENT'
-- AND is_deleted = false
-- AND created_at >= NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC
-- LIMIT 50;

-- ============================================================================
-- 8. PARTITION STRATEGY (for large tables)
-- ============================================================================

-- For tables with millions of rows, partition by date:
-- ALTER TABLE notifications 
-- PARTITION BY RANGE (DATE_TRUNC('month', created_at));

-- CREATE TABLE notifications_2026_06 PARTITION OF notifications
-- FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- ============================================================================
-- 9. MAINTENANCE QUERIES
-- ============================================================================

-- Analyze table statistics
-- ANALYZE notifications;
-- ANALYZE notification_delivery;

-- Reindex if needed
-- REINDEX TABLE notifications;

-- Vacuum to reclaim space
-- VACUUM notifications;

-- Check index size
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 10. VIEWS FOR COMMONLY USED QUERIES
-- ============================================================================

-- View for user notifications with statistics
CREATE OR REPLACE VIEW vw_student_notifications AS
SELECT 
  s.id as student_id,
  s.roll_number,
  s.email,
  COUNT(n.id) as total_notifications,
  COUNT(n.id) FILTER (WHERE n.is_read = false) as unread_count,
  MAX(n.created_at) as latest_notification_date
FROM students s
LEFT JOIN notifications n ON s.id = n.student_id AND n.is_deleted = false
GROUP BY s.id, s.roll_number, s.email;

-- View for notification statistics
CREATE OR REPLACE VIEW vw_notification_stats_by_type AS
SELECT 
  s.id,
  s.roll_number,
  n.type,
  COUNT(n.id) as count,
  COUNT(n.id) FILTER (WHERE n.is_read = false) as unread_count
FROM students s
LEFT JOIN notifications n ON s.id = n.student_id AND n.is_deleted = false
GROUP BY s.id, s.roll_number, n.type;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
