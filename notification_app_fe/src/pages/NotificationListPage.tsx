import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { notificationApi, Notification } from "../api/notification.api";
import { Log } from "../utils/logger";
import { useNavigate } from "react-router-dom";

const TYPE_COLOR: Record<string, "default" | "info" | "warning" | "error" | "success"> = {
  system: "default",
  info: "info",
  warning: "warning",
  error: "error",
  success: "success",
};

const NotificationListPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getAll();
      setNotifications(data);
      await Log("frontend", "info", "page", "notification list loaded");
    } catch {
      setError("Failed to load notifications.");
      await Log("frontend", "error", "api", "failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await notificationApi.deleteById(deleteTarget);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget));
    } catch {
      setError("Failed to delete notification.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
        <Button variant="contained" onClick={() => navigate("/create")}>
          + New
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          mt={8}
          gap={2}
          color="text.secondary"
        >
          <NotificationsNoneIcon sx={{ fontSize: 64 }} />
          <Typography variant="h6">No notifications yet</Typography>
          <Typography variant="body2">
            Create your first notification to get started.
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/create")}>
            Create Notification
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {notifications.map((n) => (
            <Grid item xs={12} sm={6} key={n.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1} mr={1}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {n.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {n.message}
                      </Typography>
                      <Box display="flex" gap={1} mt={1} flexWrap="wrap" alignItems="center">
                        <Chip
                          label={n.type}
                          size="small"
                          color={TYPE_COLOR[n.type] || "default"}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => setDeleteTarget(n.id)}
                      aria-label="delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Notification</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this notification? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationListPage;
