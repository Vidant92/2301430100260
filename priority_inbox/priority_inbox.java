import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Priority Inbox Implementation - Stage 6
 * Maintains top 10 most important notifications based on type weight and recency
 * 
 * Time Complexity: O(N log 10) for processing N notifications
 * Space Complexity: O(10) for maintaining top 10 heap
 */
public class PriorityInbox {

    // Constants for priority calculation
    private static final int LARGE_CONSTANT = 1000;
    private static final int PLACEMENT_WEIGHT = 3;
    private static final int RESULT_WEIGHT = 2;
    private static final int EVENT_WEIGHT = 1;
    private static final int MAX_HEAP_SIZE = 10;
    private static final long RECENCY_DECAY_HOURS = 168; // 1 week

    /**
     * Notification data class
     */
    static class Notification implements Comparable<Notification> {
        String id;
        String studentId;
        String title;
        String message;
        String type;
        long timestamp;
        double priorityScore;

        public Notification(String id, String studentId, String title, String message, 
                          String type, long timestamp) {
            this.id = id;
            this.studentId = studentId;
            this.title = title;
            this.message = message;
            this.type = type;
            this.timestamp = timestamp;
            this.priorityScore = 0;
        }

        /**
         * Calculate priority score based on type weight and recency
         */
        public void calculatePriorityScore() {
            int weight = getWeightForType(this.type);
            long hoursOld = ChronoUnit.HOURS.between(
                Instant.ofEpochMilli(this.timestamp), 
                Instant.now()
            );
            
            // Recency score: newer notifications have higher score
            double recencyScore = Math.max(0, RECENCY_DECAY_HOURS - hoursOld);
            
            // Priority formula: (weight * LARGE_CONSTANT) - recencyScore
            this.priorityScore = (weight * LARGE_CONSTANT) - recencyScore;
        }

        /**
         * Get weight based on notification type
         */
        private int getWeightForType(String type) {
            switch (type.toUpperCase()) {
                case "PLACEMENT":
                    return PLACEMENT_WEIGHT;
                case "RESULT":
                    return RESULT_WEIGHT;
                case "EVENT":
                    return EVENT_WEIGHT;
                default:
                    return EVENT_WEIGHT;
            }
        }

        /**
         * Compare notifications by priority score (lower score = higher priority for min heap)
         */
        @Override
        public int compareTo(Notification other) {
            return Double.compare(this.priorityScore, other.priorityScore);
        }

        /**
         * Format notification for display
         */
        @Override
        public String toString() {
            return String.format(
                "ID: %s | Type: %s | Message: %s | Timestamp: %d | Priority Score: %.2f",
                id, type, message, timestamp, priorityScore
            );
        }
    }

    /**
     * Fetch notifications from API endpoint
     * 
     * @param apiUrl API endpoint URL
     * @return JSON response as string
     */
    static String fetchNotificationsFromAPI(String apiUrl) {
        StringBuilder response = new StringBuilder();
        try {
            URL url = new URL(apiUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream())
                );
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();
            } else {
                System.err.println("API request failed with status code: " + responseCode);
            }
            connection.disconnect();
        } catch (Exception e) {
            System.err.println("Error fetching notifications: " + e.getMessage());
            e.printStackTrace();
        }
        return response.toString();
    }

    /**
     * Parse JSON response and extract notifications
     * 
     * @param jsonResponse JSON response string
     * @return List of parsed notifications
     */
    static List<Notification> parseNotificationsFromJSON(String jsonResponse) {
        List<Notification> notifications = new ArrayList<>();
        
        try {
            // Simple JSON parsing (in production, use Jackson or Gson library)
            if (!jsonResponse.isEmpty()) {
                // Extract notification objects
                String[] notificationStrings = jsonResponse.split("\\{\"id\":");
                
                for (int i = 1; i < notificationStrings.length; i++) {
                    try {
                        String notifStr = "{\"id\":" + notificationStrings[i];
                        
                        // Extract fields using regex patterns
                        String id = extractJsonField(notifStr, "id");
                        String studentId = extractJsonField(notifStr, "studentId");
                        String title = extractJsonField(notifStr, "title");
                        String message = extractJsonField(notifStr, "message");
                        String type = extractJsonField(notifStr, "type");
                        String timestamp = extractJsonField(notifStr, "createdAt");
                        
                        if (!id.isEmpty() && !type.isEmpty()) {
                            long timestampMs = Instant.parse(timestamp).toEpochMilli();
                            Notification notification = new Notification(
                                id, studentId, title, message, type, timestampMs
                            );
                            notification.calculatePriorityScore();
                            notifications.add(notification);
                        }
                    } catch (Exception e) {
                        System.err.println("Error parsing notification: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing JSON response: " + e.getMessage());
            e.printStackTrace();
        }
        
        return notifications;
    }

    /**
     * Extract field value from JSON string
     * 
     * @param json JSON string
     * @param fieldName Field name to extract
     * @return Field value
     */
    static String extractJsonField(String json, String fieldName) {
        try {
            String pattern = "\"" + fieldName + "\":\"([^\"]+)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(json);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
            System.err.println("Error extracting field: " + fieldName);
        }
        return "";
    }

    /**
     * Get top 10 notifications using min heap
     * 
     * Time Complexity: O(N log 10) where N is total notifications
     * Space Complexity: O(10) for heap
     * 
     * @param notifications List of all notifications
     * @return Top 10 notifications sorted by priority
     */
    static List<Notification> getTop10Notifications(List<Notification> notifications) {
        // Min heap - allows us to keep track of top 10 by removing minimum priority
        PriorityQueue<Notification> minHeap = new PriorityQueue<>(
            MAX_HEAP_SIZE + 1, Comparator.comparingDouble(n -> n.priorityScore)
        );

        for (Notification notification : notifications) {
            minHeap.offer(notification);
            
            // Keep only top 10 by removing min when heap exceeds size
            if (minHeap.size() > MAX_HEAP_SIZE) {
                minHeap.poll(); // Remove notification with lowest priority
            }
        }

        // Extract all notifications from heap into list
        List<Notification> topNotifications = new ArrayList<>();
        while (!minHeap.isEmpty()) {
            topNotifications.add(minHeap.poll());
        }

        // Sort by priority (descending - highest first)
        Collections.reverse(topNotifications);
        return topNotifications;
    }

    /**
     * Display notifications in formatted table
     * 
     * @param notifications Notifications to display
     */
    static void displayNotifications(List<Notification> notifications) {
        System.out.println("\n" + "=".repeat(120));
        System.out.println("TOP 10 PRIORITY INBOX NOTIFICATIONS");
        System.out.println("=".repeat(120));

        System.out.printf(
            "%-5s | %-10s | %-15s | %-50s | %-20s | %-12s%n",
            "RANK", "ID", "TYPE", "MESSAGE", "TIMESTAMP", "PRIORITY"
        );
        System.out.println("-".repeat(120));

        int rank = 1;
        for (Notification notif : notifications) {
            String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm")
                .format(new Date(notif.timestamp));
            String message = notif.message.length() > 50 
                ? notif.message.substring(0, 47) + "..." 
                : notif.message;

            System.out.printf(
                "%-5d | %-10s | %-15s | %-50s | %-20s | %-12.2f%n",
                rank++,
                notif.id.length() > 10 ? notif.id.substring(0, 10) : notif.id,
                notif.type,
                message,
                timestamp,
                notif.priorityScore
            );
        }

        System.out.println("=".repeat(120));
        System.out.printf("Total notifications displayed: %d%n", notifications.size());
        System.out.println("=".repeat(120) + "\n");
    }

    /**
     * Display statistics about notifications
     * 
     * @param notifications All notifications
     * @param topNotifications Top 10 notifications
     */
    static void displayStatistics(List<Notification> notifications, 
                                   List<Notification> topNotifications) {
        System.out.println("\n" + "=".repeat(60));
        System.out.println("NOTIFICATION STATISTICS");
        System.out.println("=".repeat(60));

        int placementCount = (int) notifications.stream()
            .filter(n -> "PLACEMENT".equals(n.type))
            .count();
        int resultCount = (int) notifications.stream()
            .filter(n -> "RESULT".equals(n.type))
            .count();
        int eventCount = (int) notifications.stream()
            .filter(n -> "EVENT".equals(n.type))
            .count();

        System.out.printf("Total Notifications: %d%n", notifications.size());
        System.out.printf("  - Placement: %d (weight: %d)%n", placementCount, PLACEMENT_WEIGHT);
        System.out.printf("  - Result: %d (weight: %d)%n", resultCount, RESULT_WEIGHT);
        System.out.printf("  - Event: %d (weight: %d)%n", eventCount, EVENT_WEIGHT);
        System.out.printf("%nTop 10 Distribution:%n");

        int topPlacement = (int) topNotifications.stream()
            .filter(n -> "PLACEMENT".equals(n.type))
            .count();
        int topResult = (int) topNotifications.stream()
            .filter(n -> "RESULT".equals(n.type))
            .count();
        int topEvent = (int) topNotifications.stream()
            .filter(n -> "EVENT".equals(n.type))
            .count();

        System.out.printf("  - Placement: %d%n", topPlacement);
        System.out.printf("  - Result: %d%n", topResult);
        System.out.printf("  - Event: %d%n", topEvent);

        if (!topNotifications.isEmpty()) {
            System.out.printf("%nHighest Priority Score: %.2f%n", 
                topNotifications.get(0).priorityScore);
            System.out.printf("Lowest Priority Score: %.2f%n", 
                topNotifications.get(topNotifications.size() - 1).priorityScore);
        }

        System.out.println("=".repeat(60) + "\n");
    }

    /**
     * Main method - orchestrates the priority inbox workflow
     */
    public static void main(String[] args) {
        System.out.println("\n╔═══════════════════════════════════════════════════════════════╗");
        System.out.println("║  CAMPUS NOTIFICATION PLATFORM - PRIORITY INBOX (Stage 6)      ║");
        System.out.println("║  Complexity: O(N log 10) - Linear with heap operations        ║");
        System.out.println("╚═══════════════════════════════════════════════════════════════╝\n");

        // API endpoint (update with your actual backend URL)
        String apiUrl = "http://localhost:5000/api/notifications";

        System.out.println("Step 1: Fetching notifications from API...");
        String jsonResponse = fetchNotificationsFromAPI(apiUrl);

        if (jsonResponse.isEmpty()) {
            System.out.println("No notifications fetched. Using sample data for demonstration.");
            jsonResponse = createSampleNotificationJSON();
        } else {
            System.out.println("Successfully fetched notifications from API.");
        }

        System.out.println("\nStep 2: Parsing JSON response...");
        List<Notification> allNotifications = parseNotificationsFromJSON(jsonResponse);
        System.out.printf("Parsed %d notifications%n", allNotifications.size());

        System.out.println("\nStep 3: Calculating priority scores...");
        System.out.println("Priority Formula: (weight × " + LARGE_CONSTANT + ") - recencyScore");

        System.out.println("\nStep 4: Maintaining top 10 with min heap...");
        List<Notification> topNotifications = getTop10Notifications(allNotifications);

        System.out.println("\nStep 5: Displaying results...");
        displayNotifications(topNotifications);

        System.out.println("\nStep 6: Displaying statistics...");
        displayStatistics(allNotifications, topNotifications);

        System.out.println("Priority Inbox processing completed successfully!");
    }

    /**
     * Create sample notification JSON for testing
     * 
     * @return Sample JSON response
     */
    static String createSampleNotificationJSON() {
        return "[" +
            "{\"id\":\"n1\",\"studentId\":\"2301430100260\",\"title\":\"Placement Drive\",\"message\":\"Amazon is recruiting for SDE positions\",\"type\":\"PLACEMENT\",\"createdAt\":\"" + Instant.now().minus(1, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n2\",\"studentId\":\"2301430100260\",\"title\":\"Semester Result\",\"message\":\"Your semester results are available\",\"type\":\"RESULT\",\"createdAt\":\"" + Instant.now().minus(5, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n3\",\"studentId\":\"2301430100260\",\"title\":\"Campus Event\",\"message\":\"Tech fest registration open\",\"type\":\"EVENT\",\"createdAt\":\"" + Instant.now().minus(10, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n4\",\"studentId\":\"2301430100260\",\"title\":\"Internship Drive\",\"message\":\"Google is recruiting interns\",\"type\":\"PLACEMENT\",\"createdAt\":\"" + Instant.now().minus(2, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n5\",\"studentId\":\"2301430100260\",\"title\":\"Quiz Result\",\"message\":\"Quiz results have been published\",\"type\":\"RESULT\",\"createdAt\":\"" + Instant.now().minus(24, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n6\",\"studentId\":\"2301430100260\",\"title\":\"Workshop\",\"message\":\"Data Science workshop this Saturday\",\"type\":\"EVENT\",\"createdAt\":\"" + Instant.now().minus(3, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n7\",\"studentId\":\"2301430100260\",\"title\":\"Microsoft Hiring\",\"message\":\"Microsoft visiting campus for full-time recruitment\",\"type\":\"PLACEMENT\",\"createdAt\":\"" + Instant.now().minus(30, ChronoUnit.MINUTES).toString() + "\"}," +
            "{\"id\":\"n8\",\"studentId\":\"2301430100260\",\"title\":\"Assignment Due\",\"message\":\"CSE201 assignment due on Friday\",\"type\":\"EVENT\",\"createdAt\":\"" + Instant.now().minus(48, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n9\",\"studentId\":\"2301430100260\",\"title\":\"Mid Semester Exam\",\"message\":\"Mid semester exam results published\",\"type\":\"RESULT\",\"createdAt\":\"" + Instant.now().minus(12, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n10\",\"studentId\":\"2301430100260\",\"title\":\"Meta Internship\",\"message\":\"Meta is hiring interns for summer\",\"type\":\"PLACEMENT\",\"createdAt\":\"" + Instant.now().minus(15, ChronoUnit.MINUTES).toString() + "\"}," +
            "{\"id\":\"n11\",\"studentId\":\"2301430100260\",\"title\":\"Club Meeting\",\"message\":\"CS Club meeting postponed to next week\",\"type\":\"EVENT\",\"createdAt\":\"" + Instant.now().minus(6, ChronoUnit.HOURS).toString() + "\"}," +
            "{\"id\":\"n12\",\"studentId\":\"2301430100260\",\"title\":\"Lab Performance\",\"message\":\"Lab performance evaluations are out\",\"type\":\"RESULT\",\"createdAt\":\"" + Instant.now().minus(18, ChronoUnit.HOURS).toString() + "\"}" +
        "]";
    }
}
