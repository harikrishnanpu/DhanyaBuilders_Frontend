import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  SpeedDial,
  SpeedDialAction,
  Snackbar,
  Alert,
  Button,
  LinearProgress,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  SwipeableDrawer,
  Drawer,
  Collapse,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';

import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import TransactionsSection from 'components/materials/TransactionsSection';
import MaterialsSection from 'components/materials/MaterialsSection';
import AttendanceSection from 'components/materials/AttendanceSection';
import TasksSection from 'components/materials/TasksSection';
import ProjectChat from 'components/materials/chat/projectChat';
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

// Register Chart.js modules
ChartJS.register(ArcElement, LineElement, CategoryScale, LinearScale, PointElement, ChartTooltip, ChartLegend);

/**
 * A helper component to render tab panels.
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <Box
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      sx={{ display: value === index ? 'block' : 'none'}}
      {...other}
    >
      {children}
    </Box>
  );
}

/**
 * A small multi-line progress path for main progress items in the Details tab.
 */
function WrappedProgressPath({ progressItems = [] }) {
  const theme = useTheme();

  if (!Array.isArray(progressItems) || progressItems.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
        No progress steps yet.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 1,
      }}
    >
      {progressItems.map((item, index) => {
        const progressColor = item.completed
          ? theme.palette.success.main
          : item.percentage > 50
          ? theme.palette.warning.main
          : theme.palette.error.main;

        return (
          <Box key={item._id} sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Progress Step with Background Fill */}
            <Box
              sx={{
                minWidth: 120,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                position: 'relative',
                textAlign: 'center',
                fontWeight: 500,
                color: theme.palette.text.primary,
                background: theme.palette.grey[100],
                transition: 'background 0.2s',
                fontSize: 10,
                background: `linear-gradient(to right, ${progressColor} ${item.percentage}%, ${theme.palette.grey[100]} ${item.percentage}%)`,
              }}
            >
              {item.title} ({item.percentage}%)
            </Box>

            {/* Path (Only between steps) */}
            {index < progressItems.length - 1 && (
              <Box
                sx={{
                  width: 30,
                  height: 2,
                  backgroundColor: theme.palette.grey[400],
                  mx: 1,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * Comments Drawer for a single main progress item.
 */
function CommentsDrawer({ open, onClose, projectId, progressItem, showSnackbar, user }) {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    if (open && progressItem) {
      fetchComments();
    }
    // eslint-disable-next-line
  }, [open, progressItem]);

  async function fetchComments() {
    if (!progressItem) return;
    try {
      const { data } = await api.get(`/api/projects/${projectId}/progress/${progressItem._id}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    try {
      // Replace with actual user ID from your auth
      const { data } = await api.post(
        `/api/projects/${projectId}/progress/${progressItem._id}/comments`,
        { text: newCommentText, userId: user._id }
      );
      setComments(data);
      setNewCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      showSnackbar('Error adding comment.');
    }
  };

  const handleEditClick = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId) return;
    try {
      const { data } = await api.patch(
        `/api/projects/${projectId}/progress/${progressItem._id}/comments/${editingCommentId}`,
        { text: editingCommentText }
      );
      setComments(data);
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Error editing comment:', error);
      showSnackbar('Error editing comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { data } = await api.delete(
        `/api/projects/${projectId}/progress/${progressItem._id}/comments/${commentId}`
      );
      setComments(data);
    } catch (error) {
      console.error('Error deleting comment:', error);
      showSnackbar('Error deleting comment.');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 320, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Comments for: {progressItem?.title}
        </Typography>

        <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
          {comments.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No comments yet.
            </Typography>
          )}
          {comments.map((c) => (
            <Paper
              key={c._id}
              variant="outlined"
              sx={{
                p: 1,
                mb: 1,
                borderRadius: 2,
                borderColor: 'divider',
                position: 'relative',
              }}
            >
              {/* Optionally show c.user.name if you populated the user */}
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {c.user?.name || 'User'}:
              </Typography>
              {editingCommentId === c._id ? (
                <TextField
                  fullWidth
                  multiline
                  size="small"
                  value={editingCommentText}
                  onChange={(e) => setEditingCommentText(e.target.value)}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {c.text}
                </Typography>
              )}

              {/* If the logged-in user is c.user._id, allow edit/delete (example check) */}
              {user._id === c.user?._id && (
                <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                  {editingCommentId === c._id ? (
                    <Button size="small" onClick={handleSaveEdit}>
                      Save
                    </Button>
                  ) : (
                    <Button size="small" onClick={() => handleEditClick(c)}>
                      Edit
                    </Button>
                  )}
                  <Button
                    size="small"
                    color="error"
                    sx={{ ml: 1 }}
                    onClick={() => handleDeleteComment(c._id)}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </Box>

        {/* Add new comment */}
        <Box sx={{ mt: 'auto' }}>
          <TextField
            label="Add a comment"
            fullWidth
            multiline
            rows={2}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 1 }}
            onClick={handleAddComment}
          >
            Post Comment
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}





/**
 * The main "ProgressSection" with subprogress, comments, etc.
 */
function ProgressSection({ projectId, initialProgress = [], isMobile, showSnackbar, user }) {
  const theme = useTheme();

  // Entire array of main progress items
  const [progressItems, setProgressItems] = useState(Array.isArray(initialProgress) ? initialProgress : []);

  // Drawer for main progress add/edit
  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add'); // 'add' | 'edit'
  const [editableItem, setEditableItem] = useState(null);

  // Subprogress states
  const [expandedMainId, setExpandedMainId] = useState(null); // which main item is expanded
  const [subDrawerMode, setSubDrawerMode] = useState('add');
  const [subEditableItem, setSubEditableItem] = useState(null);
  const [openSubDrawer, setOpenSubDrawer] = useState(false);
  const [currentMainItem, setCurrentMainItem] = useState(null);

  // Fields for main progress
  const [title, setTitle] = useState('');
  const [percentage, setPercentage] = useState(0);

  // Fields for subprogress
  const [subTitle, setSubTitle] = useState('');
  const [subPercentage, setSubPercentage] = useState(0);

  // Comments drawer
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [commentsTargetItem, setCommentsTargetItem] = useState(null);

  // Overall progress (sum of main items or some logic)
  // For demonstration, let's just average the main items

  useEffect(() => {
    if (Array.isArray(initialProgress)) {
      setProgressItems(initialProgress);
    } else {
      setProgressItems([]);
    }
  }, [initialProgress]);

// Ensure progressItems is always an array
const validProgressItems = Array.isArray(progressItems) ? progressItems : [];

const totalPlanned = validProgressItems.reduce((acc, item) => {
  // Include both main progress percentage and its sub-progress sum
  const subTotal = Array.isArray(item.subProgress)
    ? item.subProgress.reduce((subAcc, sub) => subAcc + (sub.percentage || 0), 0)
    : 0;
  return acc + (item.percentage || 0) + subTotal;
}, 0);

const totalCompleted = validProgressItems.reduce((acc, item) => {
  const subCompleted = Array.isArray(item.subProgress)
    ? item.subProgress.reduce(
        (subAcc, sub) => (sub.completed ? subAcc + (sub.percentage || 0) : subAcc),
        0
      )
    : 0;
  return acc + (item.completed ? item.percentage || 0 : 0) + subCompleted;
}, 0);

const overallProgress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  
  

  useEffect(() => {
    fetchProgressItems(); // in case you want to always pull from server
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setProgressItems(initialProgress);
  }, [initialProgress]);

  async function fetchProgressItems() {
    try {
      const { data } = await api.get(`/api/projects/${projectId}/progress`);
      setProgressItems(data);
    } catch (error) {
      console.error('Error fetching main progress items:', error);
    }
  }

  // --- MAIN PROGRESS CRUD ---

  const toggleDrawer = (open) => () => setOpenDrawer(open);

  const handleOpenAddDrawer = () => {
    setDrawerMode('add');
    setTitle('');
    setPercentage(0);
    setEditableItem(null);
    setOpenDrawer(true);
  };

  const handleOpenEditDrawer = (item) => {
    setDrawerMode('edit');
    setTitle(item.title);
    setPercentage(item.percentage);
    setEditableItem(item);
    setOpenDrawer(true);
  };

  const handleSaveProgressItem = async () => {
    if (!title.trim()) return;
    try {
      let updated;
      if (drawerMode === 'add') {
        const { data } = await api.post(`/api/projects/${projectId}/progress`, { title, percentage });
        updated = data;
      } else {
        const { data } = await api.patch(
          `/api/projects/${projectId}/progress/${editableItem._id}`,
          { title, percentage }
        );
        updated = data;
      }
      setProgressItems(updated);
      showSnackbar(drawerMode === 'add' ? 'Main progress added.' : 'Main progress updated.');
    } catch (error) {
      console.error(error);
      showSnackbar('Error saving main progress item.');
    } finally {
      setOpenDrawer(false);
    }
  };

const handleDeleteProgressItem = async (progressId) => {
  try {
    await api.delete(`/api/projects/${projectId}/progress/${progressId}`);

    // ✅ Ensure that setProgressItems always sets an array
    setProgressItems((prevItems) => prevItems.filter((item) => item._id !== progressId));

  } catch (error) {
    console.error("Error deleting progress item:", error);
    showSnackbar("Error deleting progress item.");
  }
};

  // --- SUB-PROGRESS CRUD ---
  const handleToggleExpandMain = (itemId) => {
    setExpandedMainId(expandedMainId === itemId ? null : itemId);
  };

  const handleOpenSubDrawer = (mainItem, mode, subItem = null) => {
    setCurrentMainItem(mainItem);
    setSubDrawerMode(mode);
    if (mode === 'edit' && subItem) {
      setSubEditableItem(subItem);
      setSubTitle(subItem.title);
      setSubPercentage(subItem.percentage);
    } else {
      setSubEditableItem(null);
      setSubTitle('');
      setSubPercentage(0);
    }
    setOpenSubDrawer(true);
  };

  const handleSaveSubProgress = async () => {
    if (!subTitle.trim() || !currentMainItem) return;
    try {
      let updated;
      if (subDrawerMode === 'add') {
        const { data } = await api.post(
          `/api/projects/${projectId}/progress/${currentMainItem._id}/subprogress`,
          { title: subTitle, percentage: subPercentage }
        );
        updated = data;
      } else {
        const { data } = await api.patch(
          `/api/projects/${projectId}/progress/${currentMainItem._id}/subprogress/${subEditableItem._id}`,
          { title: subTitle, percentage: subPercentage }
        );
        updated = data;
      }
      setProgressItems(updated);
      showSnackbar(
        subDrawerMode === 'add' ? 'Sub-progress added.' : 'Sub-progress updated.'
      );
    } catch (error) {
      console.error(error);
      showSnackbar('Error saving sub-progress item.');
    } finally {
      setOpenSubDrawer(false);
    }
  };

  const handleDeleteSubProgress = async (progressId, subProgressId) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}/progress/${progressId}/subprogress/${subProgressId}`);
  
      // ✅ Update only the specific progress item, not the full array
      setProgressItems((prevItems) =>
        prevItems.map((item) =>
          item._id === progressId
            ? { ...item, subProgress: item.subProgress.filter((sub) => sub._id !== subProgressId) }
            : item
        )
      );
  
      showSnackbar("Sub-progress item deleted successfully.");
    } catch (error) {
      console.error("Error deleting sub-progress item:", error);
      showSnackbar("Error deleting sub-progress item.");
    }
  };
  

  const handleToggleSubComplete = async (mainItem, subItem) => {
    try {
      const { data } = await api.patch(
        `/api/projects/${projectId}/progress/${mainItem._id}/subprogress/${subItem._id}`,
        { completed: !subItem.completed }
      );
      setProgressItems(data);
    } catch (error) {
      console.error(error);
      showSnackbar('Error toggling sub-progress completion.');
    }
  };

  // --- COMMENTS (Drawer on right) ---
  const handleOpenCommentsDrawer = (mainItem) => {
    setCommentsTargetItem(mainItem);
    setCommentsDrawerOpen(true);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Overall Project Progress: {overallProgress}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={overallProgress}
        sx={{ height: 10, borderRadius: 5, mb: 2 }}
      />

      {/* Add Main Progress */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Main Progress Items
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDrawer}>
          Add Main Progress
        </Button>
      </Box>

      {/* Main Progress List */}
      {progressItems.map((item) => (
        <Card
          key={item._id}
          variant="outlined"
          sx={{ mb: 2, borderColor: theme.palette.divider }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.percentage}% {item.completed ? '(Done)' : ''}
                </Typography>
              </Box>
              <Box>
                <IconButton size="small" onClick={() => handleOpenCommentsDrawer(item)}>
                  <CommentIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small" onClick={() => handleOpenEditDrawer(item)}>
                  <EditIcon fontSize="inherit" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteProgressItem(item._id)}>
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleToggleExpandMain(item._id)}
                  sx={{ ml: 1 }}
                >
                  {expandedMainId === item._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>
            {/* Sub-progress collapse */}
            <Collapse in={expandedMainId === item._id} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Sub-progress
                </Typography>
                {/* Button to add sub-progress */}
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenSubDrawer(item, 'add')}
                  sx={{ mb: 1 }}
                >
                  Add Sub-progress
                </Button>
                {/* Sub-progress list */}
                {item.subProgress?.length === 0 && (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                    No sub-progress yet.
                  </Typography>
                )}
                {item.subProgress?.map((sp) => (
                  <Box
                    key={sp._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: theme.palette.grey[50],
                      mb: 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!sp.completed}
                          onChange={() => handleToggleSubComplete(item, sp)}
                        />
                      }
                      label={`${sp.title} – ${sp.percentage}%`}
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSubDrawer(item, 'edit', sp)}
                      >
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => handleDeleteSubProgress(item._id, sp._id)}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}

      {/* Main Progress Drawer (Add/Edit) */}
      <SwipeableDrawer
        anchor="bottom"
        open={openDrawer}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        PaperProps={{
          sx: {
            borderRadius: '16px 16px 0 0',
            maxHeight: '90vh',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 6, maxHeight: '90vh', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {drawerMode === 'add' ? 'Add Main Progress' : 'Edit Main Progress'}
          </Typography>
          <TextField
            label="Progress Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label="Percentage"
            fullWidth
            margin="normal"
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={toggleDrawer(false)} color="inherit" sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button onClick={handleSaveProgressItem} variant="contained">
              Save
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Sub-progress Drawer (Add/Edit) */}
      <SwipeableDrawer
        anchor="bottom"
        open={openSubDrawer}
        onClose={() => setOpenSubDrawer(false)}
        onOpen={() => setOpenSubDrawer(true)}
        PaperProps={{
          sx: {
            borderRadius: '16px 16px 0 0',
            maxHeight: '90vh',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 6, maxHeight: '90vh', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {subDrawerMode === 'add' ? 'Add Sub-progress' : 'Edit Sub-progress'}
          </Typography>
          <TextField
            label="Sub-progress Title"
            fullWidth
            margin="normal"
            value={subTitle}
            onChange={(e) => setSubTitle(e.target.value)}
          />
          <TextField
            label="Percentage"
            fullWidth
            margin="normal"
            type="number"
            value={subPercentage}
            onChange={(e) => setSubPercentage(e.target.value)}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setOpenSubDrawer(false)} color="inherit" sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubProgress} variant="contained">
              Save
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Comments Drawer (Right side) */}
      <CommentsDrawer
        open={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        projectId={projectId}
        progressItem={commentsTargetItem}
        showSnackbar={showSnackbar}
        user={user}
      />
    </Box>
  );
}

// ---- MAIN PAGE ----
export default function ProjectManagementPage() {
  const { id: projectId } = useParams();
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Tabs
  const tabConfig = [
    { label: 'Details' },
    { label: 'Progress' },
    { label: 'Transactions' },
    { label: 'Materials' },
    { label: 'Attendance' },
    { label: 'Tasks' },
    { label: 'Chat' },
  ];

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const showSnackbar = (message) => setSnackbar({ open: true, message });
  const handleSnackbarClose = () => setSnackbar({ open: false, message: '' });

  // SpeedDial
  const handleExport = () => showSnackbar('Export functionality is not implemented yet.');
  const handleEditProject = () => showSnackbar('Edit project functionality is not implemented yet.');
  const handleAddTransaction = () => showSnackbar('Add transaction functionality is not implemented yet.');
  const speedDialActions = [
    { icon: <AddIcon />, name: 'Add Transaction', onClick: handleAddTransaction },
    { icon: <EditIcon />, name: 'Edit Project', onClick: handleEditProject },
    { icon: <DownloadIcon />, name: 'Export Data', onClick: handleExport },
  ];

  // Fetch Project Data
  useEffect(() => {
    async function fetchProjectData() {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/projects/full/${projectId}`);
        setProjectData(response.data);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjectData();
  }, [projectId]);

  if (isLoading || !projectData) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh', px: 2 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading project details...
        </Typography>
      </Stack>
    );
  }

  // Destructure relevant data
  const {
    project,
    tasks = [],
    transactions = [],
    totalMaterialsReceived = 0,
    totalMaterialsUsed = 0,
    inventoryCount = 0,
  } = projectData;

  const progressItems = project?.progress || [];

  // Task progress for donut
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const donutData = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [completedTasks, totalTasks - completedTasks],
        backgroundColor: [theme.palette.success.main, theme.palette.grey[300]],
        hoverBackgroundColor: [theme.palette.success.dark, theme.palette.grey[400]],
      },
    ],
  };
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  // Transaction line chart
  const inTx = transactions.filter((tx) => tx.type === 'in');
  const outTx = transactions.filter((tx) => tx.type === 'out');

  const aggregateTx = (txs) => {
    const aggregated = {};
    txs.forEach((tx) => {
      const dateKey = new Date(tx.date).toLocaleDateString();
      if (!aggregated[dateKey]) aggregated[dateKey] = 0;
      aggregated[dateKey] += tx.amount;
    });
    return aggregated;
  };
  const inAgg = aggregateTx(inTx);
  const outAgg = aggregateTx(outTx);

  const allDatesSet = new Set([...Object.keys(inAgg), ...Object.keys(outAgg)]);
  const allDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

  const lineChartData = {
    labels: allDates,
    datasets: [
      {
        label: 'Transactions In (Rs.)',
        data: allDates.map((d) => inAgg[d] || 0),
        borderColor: theme.palette.success.main,
        fill: false,
        tension: 0.2,
        pointRadius: 3,
      },
      {
        label: 'Transactions Out (Rs.)',
        data: allDates.map((d) => outAgg[d] || 0),
        borderColor: theme.palette.error.main,
        fill: false,
        tension: 0.2,
        pointRadius: 3,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
  };

  // Recent transactions
  const recentTransactions = transactions
    .slice(-5)
    .reverse()
    .map((tx, index) => ({
      id: index,
      date: new Date(tx.date).toLocaleDateString(),
      type: tx.type,
      amount: tx.amount,
      method: tx.paymentMethod,
      remarks: tx.remarks || '-',
    }));
  const columns = [
    { field: 'date', headerName: 'Date', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'amount', headerName: 'Amount (Rs.)', flex: 1, type: 'number' },
    { field: 'method', headerName: 'Method', flex: 1 },
    { field: 'remarks', headerName: 'Remarks', flex: 1 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 3 }, px: { xs: 1, sm: 3 } }}>
        {/* Sticky Header with Tabs */}
        <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1200,
        backgroundColor: theme.palette.background.paper,
        py: { xs: 1, sm: 2 },
        mb: 2,
        borderBottom: 1,
        borderColor: theme.palette.divider,
        borderRadius: 2,
        overflowX: 'auto', // Enables horizontal scrolling
        whiteSpace: 'nowrap',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="secondary"
        sx={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: { xs: 2, sm: 0 }, // Ensures first tab is visible on mobile
          scrollPaddingLeft: '16px', // Prevents the first tab from getting cut off
          '& .MuiTabs-flexContainer': {
            display: 'flex',
            justifyContent: 'flex-start', // Ensures proper alignment
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: { xs: '0.85rem', sm: '1rem' },
            minWidth: 'auto',
            px: { xs: 2, sm: 3 }, // Adjust padding for better touch targets
            py: { xs: 0.5, sm: 1 },
            transition: 'color 0.3s ease-in-out',
            '&:hover': {
              color: theme.palette.secondary.main,
            },
          },
          '& .Mui-selected': {
            fontWeight: 600,
          },
          '& .MuiTabs-indicator': {
            height: '3px',
            borderRadius: '3px',
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        {tabConfig.map((tab, idx) => (
          <Tab
            key={idx}
            label={tab.label}
            id={`tab-${idx}`}
            aria-controls={`tabpanel-${idx}`}
            sx={{
              minHeight: { xs: 32, sm: 44 },
            }}
          />
        ))}
      </Tabs>
    </Box>

        <Paper
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: theme.palette.divider,
            boxShadow: 'none',
            minHeight: '60vh',
          }}
        >
          {/* DETAILS TAB */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ mb: 1, fontWeight: 700 }}>
              {project?.name ?? 'Untitled Project'}
            </Typography>

            <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Customer:</strong> {project.customerName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Address:</strong> {project.customerAddress}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phone:</strong> {project.customerPhone}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Estimated Amount:</strong> Rs. {project.estimatedAmount}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Duration:</strong>{' '}
                  {new Date(project.startDate).toLocaleDateString()} -{' '}
                  {new Date(project.estimatedEndDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />


                                  {/* Wrapped progress path (multi-line) */}
          <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Project Progress Steps
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <WrappedProgressPath progressItems={progressItems} />
              </Paper>
            </Box>



            {/* Quick Stats */}
            <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, borderColor: theme.palette.divider, height: '100%' }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Task Progress
                    </Typography>
                    <Box sx={{ height: 120, width: 120, mx: 'auto' }}>
                      <Doughnut data={donutData} options={donutOptions} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {progressPercentage}% ({completedTasks}/{totalTasks})
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Materials */}
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, borderColor: theme.palette.divider, height: '100%' }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Materials
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Received: {totalMaterialsReceived}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Used: {totalMaterialsUsed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inventory: {inventoryCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Transactions */}
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, borderColor: theme.palette.divider, height: '100%' }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Transactions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Count: {transactions.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Additional */}
              {/* <Grid item xs={12} sm={6} md={3}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, borderColor: theme.palette.divider, height: '100%' }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Additional
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supervisors: {project.supervisors?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid> */}
            </Grid>

            {/* Transaction Trends (Line Chart) */}
            <Box sx={{ mt: 3, height: 300 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Transaction Trends
              </Typography>
              {transactions.length > 0 ? (
                <Line data={lineChartData} options={lineOptions} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No transaction data available.
                </Typography>
              )}
            </Box>

            {/* Recent Transactions Table */}
            {transactions.length > 0 && (
              <Box sx={{ mt: 3, height: isMobile ? 250 : 300, width: '100%' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Recent Transactions
                </Typography>
                <DataGrid
                  rows={recentTransactions}
                  columns={columns}
                  autoPageSize
                  disableSelectionOnClick
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-cell': { py: isMobile ? 0.5 : 1 },
                    '& .MuiDataGrid-columnHeaders': { backgroundColor: theme.palette.background.default },
                  }}
                />
              </Box>
            )}

            {/* Optional Activity Feed */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Activity Feed
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No recent activities.
                </Typography>
              </Paper>
            </Box>
          </TabPanel>

          {/* PROGRESS TAB */}
          <TabPanel value={activeTab} index={1}>
            <ProgressSection
              projectId={projectId}
              initialProgress={progressItems}
              isMobile={isMobile}
              showSnackbar={showSnackbar}
              user={user}
            />
          </TabPanel>

          {/* TRANSACTIONS TAB */}
          <TabPanel value={activeTab} index={2}>
            <TransactionsSection projectId={projectId} isMobile={isMobile} />
          </TabPanel>

          {/* MATERIALS TAB */}
          <TabPanel value={activeTab} index={3}>
            <MaterialsSection projectId={projectId} isMobile={isMobile} />
          </TabPanel>

          {/* ATTENDANCE TAB */}
          <TabPanel value={activeTab} index={4}>
            <AttendanceSection projectId={projectId} isMobile={isMobile} />
          </TabPanel>

          {/* TASKS TAB */}
          <TabPanel value={activeTab} index={5}>
            <TasksSection projectId={projectId} isMobile={isMobile} />
          </TabPanel>

          {/* CHAT TAB */}
          <TabPanel value={activeTab} index={6}>
            <ProjectChat projectId={projectId} isMobile={isMobile} loggedInUserId={user._id} />
          </TabPanel>
        </Paper>

        {/* Mobile SpeedDial */}
        {/* {isMobile && activeTab !== 'Transactions' && (
          <SpeedDial
            ariaLabel="Quick Actions"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            icon={<AddIcon />}
          >
            {speedDialActions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={action.onClick}
              />
            ))}
          </SpeedDial>
        )} */}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
}
