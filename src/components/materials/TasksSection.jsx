// src/components/Tasks/TasksSection.jsx
import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Container,
  Fab,
  Fade,
  Paper,
  Slide,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import ListIcon from '@mui/icons-material/List';
import GridOnIcon from '@mui/icons-material/GridOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

import useTasksApi from 'api/projectTask';
import useNotifications from './task/Notification';
import TaskFilters from './task/taskFilter';
import TaskGridView from './task/TaskGridView';
import TaskListView from './task/TaskListView';
import TaskDialog from './task/TaskDialog';
import ActivityTimeline from './task/ActivityTimeline';

/** 
 * Slide transition from the top for notifications.
 */
function SlideDownTransition(props) {
  return <Slide {...props} direction="down" />;
}

export default function TasksSection({ projectId }) {
  // Custom hooks for tasks and notifications.
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask } = useTasksApi(projectId);
  const { notifications, notify } = useNotifications();

  // Theme and responsive hook
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // UI State
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'timeline'
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterParams, setFilterParams] = useState({
    searchText: '',
    status: 'All',
    priority: 'All',
    assignedToMe: false,
  });
  // Additional sort option state.
  const [sortOption, setSortOption] = useState('Recent');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Fetch tasks when projectId is available.
  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  // Filter and sort tasks whenever tasks, filterParams, or sortOption changes.
  useEffect(() => {
    let ft = [...tasks];

    // Text search filtering.
    if (filterParams.searchText) {
      ft = ft.filter((t) =>
        t.title.toLowerCase().includes(filterParams.searchText.toLowerCase())
      );
    }

    // Status filter.
    if (filterParams.status !== 'All') {
      ft = ft.filter((t) => t.status === filterParams.status);
    }

    // Priority filter.
    if (filterParams.priority !== 'All') {
      ft = ft.filter((t) => t.priority === filterParams.priority);
    }

    // "Assigned To Me" filter.
    if (filterParams.assignedToMe) {
      ft = ft.filter((t) => (t.assignedTo || '').toLowerCase() === 'me');
    }

    // Sorting tasks.
    ft.sort((a, b) => {
      if (sortOption === 'Recent') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOption === 'Oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortOption === 'Priority High to Low') {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      } else if (sortOption === 'Priority Low to High') {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
      }
      return 0;
    });

    setFilteredTasks(ft);
  }, [tasks, filterParams, sortOption]);

  // Handle filter changes.
  const handleFilterChange = (params) => {
    setFilterParams(params);
  };

  // Toggle between different view modes.
  const handleChangeViewMode = (event, newMode) => {
    if (newMode) {
      setViewMode(newMode);
    }
  };

  // Placeholder for drag-and-drop reordering.
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    notify('info', `Moved task from ${result.source.index} to ${result.destination.index}`);
  };

  // Open dialog for creating a new task.
  const handleOpenDialog = () => {
    setEditingTask(null);
    setOpenDialog(true);
  };

  // Open dialog for editing an existing task.
  const handleEditTask = (task) => {
    setEditingTask(task);
    setOpenDialog(true);
  };

  // Handle submission of a new or updated task.
  const handleSubmitTask = async (data) => {
    const payload = {
      ...data,
      startDateTime: new Date(data.startDateTime).toISOString(),
      endDateTime: new Date(data.endDateTime).toISOString(),
    };

    if (editingTask) {
      await updateTask(editingTask._id, payload);
      notify('success', 'Task updated!');
    } else {
      await createTask(payload);
      notify('success', 'Task created!');
    }
    setOpenDialog(false);
  };

  // Handle deletion of a task.
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    await deleteTask(taskId);
    notify('success', 'Task deleted');
  };

  // Export tasks as a downloadable JSON file.
  const handleExportTasks = () => {
    if (tasks && tasks.length > 0) {
      const dataStr = JSON.stringify(tasks, null, 2);
      const blob = new Blob([dataStr], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tasks.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      notify('info', 'No tasks to export');
    }
  };

  // For the timeline view, build a list of activity events.
  const timelineActivities = tasks.map((t) => ({
    id: t._id,
    description: `Task "${t.title}" last updated`,
    timestamp: t.updatedAt || t.createdAt,
  }));

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Notifications */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxWidth: '300px',
        }}
      >
        {notifications.map((n) => (
          <SlideDownTransition key={n.id} in mountOnEnter unmountOnExit>
            <Alert
              severity={
                n.type === 'success'
                  ? 'success'
                  : n.type === 'error'
                  ? 'error'
                  : 'info'
              }
              variant="filled"
              sx={{ borderRadius: 1 }}
            >
              <AlertTitle sx={{ textTransform: 'capitalize' }}>{n.type}</AlertTitle>
              {n.message}
            </Alert>
          </SlideDownTransition>
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8, pt: 4 }}>
        {/* Header & Action Buttons */}
        <Paper
          elevation={3}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
              Tasks
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TaskFilters onFilterChange={handleFilterChange} />
              <Button
                variant="text"
                size="small"
                onClick={() =>
                  setFilterParams({
                    searchText: '',
                    status: 'All',
                    priority: 'All',
                    assignedToMe: false,
                  })
                }
              >
                Clear Filters
              </Button>
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                size="small"
                variant="outlined"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="Recent">Most Recent</MenuItem>
                <MenuItem value="Oldest">Oldest</MenuItem>
                <MenuItem value="Priority High to Low">Priority High to Low</MenuItem>
                <MenuItem value="Priority Low to High">Priority Low to High</MenuItem>
              </Select>
              <Tooltip title="Refresh Tasks">
                <IconButton onClick={fetchTasks} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Tasks">
                <IconButton onClick={handleExportTasks} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* View Mode Toggle */}
        <Paper
          elevation={1}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
            Choose View
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleChangeViewMode}
            size="small"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <ToggleButton value="grid">
              <Tooltip title="Grid View">
                <GridOnIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list">
              <Tooltip title="List View">
                <ListIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="timeline">
              <Tooltip title="Timeline View">
                <TimelineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* Main Content Area */}
        <Fade in={!loading} timeout={500}>
          <Box>
            {loading ? (
              <Box textAlign="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : viewMode === 'timeline' ? (
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  minHeight: 300,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <ActivityTimeline activities={timelineActivities} />
              </Paper>
            ) : viewMode === 'grid' ? (
              <TaskGridView
                tasks={filteredTasks}
                onDragEnd={handleDragEnd}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ) : (
              <TaskListView
                tasks={filteredTasks}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            )}
          </Box>
        </Fade>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={handleOpenDialog}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Task Dialog (automatically fullScreen on mobile) */}
      <TaskDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmitTask}
        editingTaskData={editingTask}
        onDelete={handleDeleteTask}
        fullScreen={isMobile}
      />
    </Box>
  );
}
