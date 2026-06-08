// src/pages/NotificationListPage.tsx
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Pagination,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  CardActions,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import { logger } from '../utils/logger'
import { Notification } from '../api/notification.api'

interface NotificationListPageProps {
  notifications: Notification[]
  loading: boolean
  onRefresh: () => void
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export default function NotificationListPage({
  notifications,
  loading,
  onRefresh,
  onMarkAsRead,
  onDelete,
}: NotificationListPageProps) {
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(notifications.length / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNotifications = notifications.slice(startIndex, endIndex)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PLACEMENT':
        return 'success'
      case 'RESULT':
        return 'info'
      case 'EVENT':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'default'
      case 2:
        return 'warning'
      case 3:
        return 'error'
      default:
        return 'default'
    }
  }

  logger.info('NotificationListPage rendered', {
    totalNotifications: notifications.length,
    currentPage: page,
    paginatedCount: paginatedNotifications.length,
  })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (notifications.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No notifications found</Typography>
      </Paper>
    )
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedNotifications.map((notification) => (
              <TableRow
                key={notification.id}
                sx={{
                  backgroundColor: notification.isRead ? '#ffffff' : '#e3f2fd',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
              >
                <TableCell sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}>
                  {notification.title}
                </TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {notification.message}
                </TableCell>
                <TableCell>
                  <Chip label={notification.type} color={getTypeColor(notification.type)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      notification.priority === 1
                        ? 'Low'
                        : notification.priority === 2
                        ? 'Medium'
                        : 'High'
                    }
                    color={getPriorityColor(notification.priority)}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={notification.isRead ? 'Read' : 'Unread'}
                    variant={notification.isRead ? 'outlined' : 'filled'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="center">
                  {!notification.isRead && (
                    <IconButton
                      size="small"
                      onClick={() => onMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(notification.id)}
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}
    </>
  )
}
