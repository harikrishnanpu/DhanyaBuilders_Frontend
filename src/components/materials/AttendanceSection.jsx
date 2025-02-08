// src/components/AttendanceSection.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Box,
} from '@mui/material';
import {
  AddCircleOutline,
  CheckCircle,
  Cancel,
  Edit,
  AccessTime,
  Save,
  PersonAdd,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';

import { DatePicker } from '@mui/x-date-pickers';
import { DataGrid } from '@mui/x-data-grid';

import { format, parseISO, addDays } from 'date-fns';
import { useTheme } from '@mui/material/styles';

import api from 'pages/api';  // <-- adjust if needed
import useAuth from 'hooks/useAuth'; // <-- adjust if needed

const AttendanceSection = ({ projectId }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [date, setDate] = useState(new Date());
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [totalStats, setTotalStats] = useState({
    totalSalary: 0,
    present: 0,
    absent: 0,
    totalOvertime: 0,
  });

  // Dialog states
  const [openAddWorker, setOpenAddWorker] = useState(false);
  const [openOvertime, setOpenOvertime] = useState(false);
  const [openEditWorker, setOpenEditWorker] = useState(false);

  // Form states
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [newWorker, setNewWorker] = useState({
    name: '',
    category: '',
    shiftSalary: '',
  });
  const [newCategory, setNewCategory] = useState('');
  const [overtimeHours, setOvertimeHours] = useState(0);

  const { user: userInfo } = useAuth(); // in case you need user info

  // DataGrid columns for larger screens
  const columns = [
    {
      field: 'name',
      headerName: 'Worker Name',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.row.name}
          color={params.row.isPresent ? 'success' : 'error'}
          variant="outlined"
        />
      ),
    },
    { field: 'category', headerName: 'Category', flex: 1 },
    { field: 'shiftSalary', headerName: 'Shift Salary (₹)', flex: 1 },
    {
      field: 'isPresent',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          color={params.value ? 'success' : 'error'}
          startIcon={params.value ? <CheckCircle /> : <Cancel />}
          onClick={() => toggleAttendance(params.row)}
        >
          {params.value ? 'Present' : 'Absent'}
        </Button>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <div>
          <Tooltip title="Edit Worker">
            <IconButton
              size="small"
              onClick={() => handleEditWorker(params.row)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Set Overtime">
            <IconButton
              size="small"
              onClick={() => handleOpenOvertime(params.row)}
            >
              <AccessTime fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  // Fetch attendance and categories on mount / date change / projectId change
  useEffect(() => {
    fetchAttendance();
    fetchCategories();
  }, [date, projectId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const dateString = format(date, 'yyyy-MM-dd');
      const response = await api.get(
        `/api/projects/project/attendence/${projectId}?date=${dateString}`
      );
      const workerData = response.data.attendanceRecords.map((record) => ({
        id: record.worker._id,
        ...record.worker,
        isPresent: record.isPresent,
        shifts: record.shifts,
        overtimeHours: record.overtimeHours,
      }));

      setWorkers(workerData);
      calculateStats(workerData);
    } catch (err) {
      showError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/projects/project/workers/category');
      setCategories(response.data || []);
    } catch (err) {
      showError('Failed to fetch categories');
    }
  };

  const calculateStats = (workersData) => {
    const stats = workersData.reduce(
      (acc, worker) => {
        if (worker.isPresent) {
          acc.present++;
          const salary =
            worker.shiftSalary * worker.shifts +
            worker.overtimeHours * (worker.shiftSalary / 10);
          acc.totalSalary += salary;
          acc.totalOvertime += worker.overtimeHours;
        } else {
          acc.absent++;
        }
        return acc;
      },
      { totalSalary: 0, present: 0, absent: 0, totalOvertime: 0 }
    );

    setTotalStats(stats);
  };

  const toggleAttendance = (worker) => {
    const updatedWorkers = workers.map((w) =>
      w.id === worker.id ? { ...w, isPresent: !w.isPresent } : w
    );
    setWorkers(updatedWorkers);
    calculateStats(updatedWorkers);
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);
      const attendanceRecords = workers.map((worker) => ({
        worker: worker.id,
        isPresent: worker.isPresent,
        shifts: worker.shifts,
        overtimeHours: worker.overtimeHours,
      }));
      await api.post(`/api/projects/project/attendence/${projectId}`, {
        date: format(date, 'yyyy-MM-dd'),
        attendanceRecords,
      });
      showSuccess('Attendance saved successfully');
    } catch (err) {
      showError('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Add Worker
  const handleAddWorker = async () => {
    try {
      const response = await api.post(
        `/api/projects/project/workers/${projectId}`,
        newWorker
      );

      setWorkers([
        ...workers,
        {
          id: response.data.worker._id,
          ...response.data.worker,
          isPresent: false,
          shifts: 1,
          overtimeHours: 0,
        },
      ]);

      setOpenAddWorker(false);
      setNewWorker({ name: '', category: '', shiftSalary: '' });
      showSuccess('Worker added successfully');
    } catch (err) {
      showError('Failed to add worker');
    }
  };

  // Update Worker
  const handleUpdateWorker = async () => {
    try {
      await api.put(
        `/api/projects/project/workers/${selectedWorker.id}`,
        selectedWorker
      );
      const updatedWorkers = workers.map((w) =>
        w.id === selectedWorker.id ? selectedWorker : w
      );
      setWorkers(updatedWorkers);
      setOpenEditWorker(false);
      showSuccess('Worker updated successfully');
    } catch (err) {
      showError('Failed to update worker');
    }
  };

  // Overtime
  const handleSaveOvertime = () => {
    try {
      const updatedWorkers = workers.map((w) =>
        w.id === selectedWorker.id ? { ...w, overtimeHours } : w
      );
      setWorkers(updatedWorkers);
      calculateStats(updatedWorkers);
      setOpenOvertime(false);
      showSuccess('Overtime hours updated');
    } catch (err) {
      showError('Failed to update overtime');
    }
  };

  // Error & Success Helpers
  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
    setError(message);
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  // Open/Close Overtime Dialog
  const handleOpenOvertime = (worker) => {
    setSelectedWorker(worker);
    setOvertimeHours(worker.overtimeHours);
    setOpenOvertime(true);
  };

  // Open/Close Edit Worker Dialog
  const handleEditWorker = (worker) => {
    setSelectedWorker(worker);
    setOpenEditWorker(true);
  };

  // Date Navigation
  const handleDateNavigation = (days) => {
    setDate((prevDate) => addDays(prevDate, days));
  };

  // UI Rendering
  return (
    <Box maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: 2}}>
        {/* Header Section */}
        <Grid container spacing={2} alignItems="center">
          {/* Arrows for day navigation */}
          <Grid item>
            <IconButton onClick={() => handleDateNavigation(-1)}>
              <ArrowBack />
            </IconButton>
          </Grid>

          <Grid item xs>
            <DatePicker
              label="Select Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item>
            <IconButton onClick={() => handleDateNavigation(1)}>
              <ArrowForward />
            </IconButton>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Grid container spacing={2} sx={{ mt: 2 }} justifyContent="flex-end">
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Save />}
              onClick={handleSaveAttendance}
              disabled={loading}
            >
              Save Attendance
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="success"
              startIcon={<PersonAdd />}
              onClick={() => setOpenAddWorker(true)}
            >
              Add Worker
            </Button>
          </Grid>
        </Grid>

        {/* Loading Indicator */}
        {loading && (
          <Grid container justifyContent="center" sx={{ mt: 2 }}>
            <CircularProgress />
          </Grid>
        )}

        {/* Error Message */}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {/* Statistics Cards */}
        {!loading && (
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}
                elevation={1}
              >
                <Typography variant="body2" fontWeight="bold">
                  Total Workers
                </Typography>
                <Typography variant="h6">{workers.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', bgcolor: '#f0f4c3' }}
                elevation={1}
              >
                <Typography variant="body2" fontWeight="bold">
                  Total Salary
                </Typography>
                <Typography variant="h6">
                  ₹{totalStats.totalSalary.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', bgcolor: '#c8e6c9' }}
                elevation={1}
              >
                <Typography variant="body2" fontWeight="bold">
                  Present
                </Typography>
                <Typography variant="h6">{totalStats.present}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{ p: 2, textAlign: 'center', bgcolor: '#ffcdd2' }}
                elevation={1}
              >
                <Typography variant="body2" fontWeight="bold">
                  Overtime Hours
                </Typography>
                <Typography variant="h6">{totalStats.totalOvertime}</Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Workers Display */}
        {!loading && workers.length > 0 && (
          <>
            {isSmallScreen ? (
              // Mobile: Card View
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {workers.map((worker) => (
                  <Grid item xs={12} key={worker.id}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 'bold' }}
                          gutterBottom
                        >
                          {worker.name}
                        </Typography>
                        <Typography variant="body2">
                          Category: {worker.category}
                        </Typography>
                        <Typography variant="body2">
                          Shift Salary: ₹{worker.shiftSalary}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={
                            worker.isPresent ? 'success.main' : 'error.main'
                          }
                          sx={{ mt: 1, fontWeight: 'bold' }}
                        >
                          {worker.isPresent ? 'Present' : 'Absent'}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          variant="outlined"
                          size="small"
                          color={worker.isPresent ? 'error' : 'success'}
                          startIcon={worker.isPresent ? <Cancel /> : <CheckCircle />}
                          onClick={() => toggleAttendance(worker)}
                        >
                          {worker.isPresent ? 'Absent' : 'Present'}
                        </Button>
                        <Tooltip title="Edit Worker">
                          <IconButton
                            onClick={() => handleEditWorker(worker)}
                            size="small"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Set Overtime">
                          <IconButton
                            onClick={() => handleOpenOvertime(worker)}
                            size="small"
                          >
                            <AccessTime fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Desktop: DataGrid
              <div style={{ height: 600, width: '100%', marginTop: 16 }}>
                <DataGrid
                  rows={workers}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  disableSelectionOnClick
                />
              </div>
            )}
          </>
        )}
      </Paper>

      {/* Add Worker Dialog */}
      <Dialog
        open={openAddWorker}
        onClose={() => setOpenAddWorker(false)}
        fullWidth
      >
        <DialogTitle>Add New Worker</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Worker Name"
                value={newWorker.name}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, name: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={8}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newWorker.category}
                  label="Category"
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, category: e.target.value })
                  }
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <TextField
                fullWidth
                label="New Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => {
                  // If user presses Enter, add category to list
                  if (e.key === 'Enter' && newCategory.trim() !== '') {
                    if (!categories.includes(newCategory.trim())) {
                      setCategories([...categories, newCategory.trim()]);
                      setNewCategory('');
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shift Salary"
                type="number"
                value={newWorker.shiftSalary}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, shiftSalary: e.target.value })
                }
              />
            </Grid>

            {/* Button to manually add the newCategory to categories */}
            {newCategory.trim() !== '' && (
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    if (!categories.includes(newCategory.trim())) {
                      setCategories([...categories, newCategory.trim()]);
                    }
                    setNewCategory('');
                  }}
                >
                  Add Category to List
                </Button>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAddWorker(false)}>Cancel</Button>
          <Button onClick={handleAddWorker} variant="outlined" color="primary">
            Add Worker
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Worker Dialog */}
      <Dialog
        open={openEditWorker}
        onClose={() => setOpenEditWorker(false)}
        fullWidth
      >
        <DialogTitle>Edit Worker Details</DialogTitle>
        <DialogContent>
          {selectedWorker && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Worker Name"
                  value={selectedWorker.name}
                  onChange={(e) =>
                    setSelectedWorker({ ...selectedWorker, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedWorker.category}
                    label="Category"
                    onChange={(e) =>
                      setSelectedWorker({
                        ...selectedWorker,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Shift Salary"
                  type="number"
                  value={selectedWorker.shiftSalary}
                  onChange={(e) =>
                    setSelectedWorker({
                      ...selectedWorker,
                      shiftSalary: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEditWorker(false)}>Cancel</Button>
          <Button onClick={handleUpdateWorker} variant="outlined" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Overtime Dialog */}
      <Dialog
        open={openOvertime}
        onClose={() => setOpenOvertime(false)}
        fullWidth
      >
        <DialogTitle>Set Overtime Hours</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Overtime Hours"
            type="number"
            fullWidth
            value={overtimeHours}
            onChange={(e) => setOvertimeHours(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOvertime(false)}>Cancel</Button>
          <Button onClick={handleSaveOvertime} variant="outlined" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceSection;
