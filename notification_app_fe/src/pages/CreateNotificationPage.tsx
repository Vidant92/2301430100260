import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { notificationApi } from "../api/notification.api";
import { Log } from "../utils/logger";

const NOTIFICATION_TYPES = ["system", "info", "warning", "error", "success"];

const CreateNotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [k: string]: string }>({});

  const validate = (): boolean => {
    const errors: { [k: string]: string } = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!message.trim()) errors.message = "Message is required";
    if (!type) errors.type = "Type is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    await Log("frontend", "info", "component", "notification form submitted");
    try {
      await notificationApi.create({ title, message, type });
      setSuccess(true);
      setTitle("");
      setMessage("");
      setType("");
      setTimeout(() => navigate("/"), 1200);
    } catch {
      setError("Failed to create notification. Please try again.");
      await Log("frontend", "error", "api", "Failed to create notification from form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Create Notification
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Notification created successfully! Redirecting...
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!fieldErrors.title}
            helperText={fieldErrors.title}
            fullWidth
            required
          />
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={!!fieldErrors.message}
            helperText={fieldErrors.message}
            fullWidth
            required
            multiline
            rows={3}
          />
          <FormControl fullWidth error={!!fieldErrors.type} required>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e: SelectChangeEvent) => setType(e.target.value)}
            >
              {NOTIFICATION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors.type && (
              <Typography variant="caption" color="error" ml={2}>
                {fieldErrors.type}
              </Typography>
            )}
          </FormControl>

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? "Submitting..." : "Submit Notification"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateNotificationPage;
