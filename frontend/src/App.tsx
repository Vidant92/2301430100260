// src/App.tsx
import React, { useState, useEffect } from 'react'
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material'
import NotificationIcon from '@mui/icons-material/Notifications'
import { logger } from './utils/logger'
import { notificationAPI, Notification } from './api/notification.api'
import NotificationListPage from './pages/NotificationListPage'

export interface NotificationsState {
  notifications: Notification[]
  loading: boolean
  error: string | null
  stats: any
}

export default function App() {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    loading: false,
    error: null,
    stats: null,
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'EVENT' as 'PLACEMENT' | 'RESULT' | 'EVENT',
    priority: 1,
  })

  useEffect(() => {
    loadNotifications()
    loadStats()
    logger.info('App initialized')
  }, [])

  const loadNotifications = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      const response = await notificationAPI.getAll()
      setState(prev => ({
        ...prev,
        notifications: response.data.notifications,
        loading: false,
      }))
    } catch (error) {
      const message = 'Failed to load notifications'
      logger.error(message, error)
      setState(prev => ({
        ...prev,
        error: message,
        loading: false,
      }))
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      })
    }
  }

  const loadStats = async () => {
    try {
      const response = await notificationAPI.getStats()
      setState(prev => ({
        ...prev,
        stats: response.data,
      }))
    } catch (error) {
      logger.error('Failed to load statistics', error)
    }
  }

  const handleCreateNotification = async () => {
    try {
      await notificationAPI.create({
        ...newNotification,
        studentId: '2301430100260',
      } as any)
      setSnackbar({
        open: true,
        message: 'Notification created successfully',
        severity: 'success',
      })
      setCreateDialogOpen(false)
      setNewNotification({
        title: '',
        message: '',
        type: 'EVENT',
        priority: 1,
      })
      loadNotifications()
      loadStats()
    } catch (error) {
      logger.error('Error creating notification', error)
      setSnackbar({
        open: true,
        message: 'Failed to create notification',
        severity: 'error',
      })
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id)
      setSnackbar({
        open: true,
        message: 'Notification marked as read',
        severity: 'success',
      })
      loadNotifications()
      loadStats()
    } catch (error) {
      logger.error('Error marking notification as read', error)
      setSnackbar({
        open: true,
        message: 'Failed to mark notification',
        severity: 'error',
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      setSnackbar({
        open: true,
        message: 'All notifications marked as read',
        severity: 'success',
      })
      loadNotifications()
      loadStats()
    } catch (error) {
      logger.error('Error marking all as read', error)
      setSnackbar({
        open: true,
        message: 'Failed to mark all notifications',
        severity: 'error',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationAPI.delete(id)
      setSnackbar({
        open: true,
        message: 'Notification deleted',
        severity: 'success',
      })
      loadNotifications()
      loadStats()
    } catch (error) {
      logger.error('Error deleting notification', error)
      setSnackbar({
        open: true,
        message: 'Failed to delete notification',
        severity: 'error',
      })
    }
  }

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <NotificationIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Campus Notification Platform
          </Typography>
          {state.stats && (
            <Typography variant="body2" sx={{ mr: 3 }}>
              Unread: {state.stats.unread}
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">{state.stats?.total || 0}</Typography>
                <Typography color="textSecondary">Total</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">{state.stats?.unread || 0}</Typography>
                <Typography color="textSecondary">Unread</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">{state.stats?.read || 0}</Typography>
                <Typography color="textSecondary">Read</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={handleMarkAllAsRead}
                >
                  Mark All Read
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Notification
          </Button>
          <Button
            variant="outlined"
            sx={{ ml: 1 }}
            onClick={loadNotifications}
          >
            Refresh
          </Button>
        </Box>

        <NotificationListPage
          notifications={state.notifications}
          loading={state.loading}
          onRefresh={loadNotifications}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      </Container>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create Notification</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <TextField
            fullWidth
            label="Title"
            value={newNotification.title}
            onChange={(e) =>
              setNewNotification({ ...newNotification, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            value={newNotification.message}
            onChange={(e) =>
              setNewNotification({ ...newNotification, message: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            select
            fullWidth
            label="Type"
            value={newNotification.type}
            onChange={(e) =>
              setNewNotification({
                ...newNotification,
                type: e.target.value as any,
              })
            }
            margin="normal"
          >
            <MenuItem value="PLACEMENT">Placement</MenuItem>
            <MenuItem value="RESULT">Result</MenuItem>
            <MenuItem value="EVENT">Event</MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label="Priority"
            value={newNotification.priority}
            onChange={(e) =>
              setNewNotification({
                ...newNotification,
                priority: parseInt(e.target.value),
              })
            }
            margin="normal"
          >
            <MenuItem value={1}>Low</MenuItem>
            <MenuItem value={2}>Medium</MenuItem>
            <MenuItem value={3}>High</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNotification} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  )
}
