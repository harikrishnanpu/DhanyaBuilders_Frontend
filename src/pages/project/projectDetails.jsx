// src/pages/ProjectManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  Fade,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  Tooltip,
  Breadcrumbs,
  IconButton,
  Fab,
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
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

import TransactionsSection from 'components/materials/TransactionsSection';
import MaterialsSection from 'components/materials/MaterialsSection';
import AttendanceSection from 'components/materials/AttendanceSection';
import TasksSection from 'components/materials/TasksSection';
import api from 'pages/api';
import ProjectChat from 'components/materials/chat/projectChat';
import useAuth from 'hooks/useAuth';

// Register Chart.js modules
ChartJS.register(ArcElement, LineElement, CategoryScale, LinearScale, PointElement, ChartTooltip, ChartLegend);

export default function ProjectManagementPage() {
  const { id } = useParams();
  const theme = useTheme();
  const {user} = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [projectData, setProjectData] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch aggregated project data
  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/projects/full/${id}`);
        setProjectData(response.data);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExport = () => {
    console.log('Implement export functionality here (e.g., CSV/PDF)');
  };

  const handleEditProject = () => {
    // Implement navigation to edit project page
    console.log('Navigate to edit project page');
  };

  if (isLoading || !projectData) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '80vh', px: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading project details...</Typography>
      </Stack>
    );
  }

  // Destructure aggregated data from the backend
  const {
    project,
    tasks = [],
    transactions = [],
    totalMaterialsReceived = 0,
    totalMaterialsUsed = 0,
    inventoryCount = 0,
  } = projectData;

  // Calculate task progress (based on tasks with status "Completed")
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Prepare data for the donut chart (Task Progress)
  const donutData = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [completedTasks, totalTasks - completedTasks],
        backgroundColor: ['#1976d2', '#e0e0e0'],
        hoverBackgroundColor: ['#115293', '#bdbdbd'],
      },
    ],
  };

  // Prepare data for the line chart (Transaction Trends)
  const transactionDates = transactions.map((tx) => new Date(tx.date).toLocaleDateString());
  const transactionAmounts = transactions.map((tx) => tx.amount);
  const lineChartData = {
    labels: transactionDates,
    datasets: [
      {
        label: 'Amount (Rs.)',
        data: transactionAmounts,
        fill: false,
        borderColor: theme.palette.primary.main,
        tension: 0.2,
        pointRadius: 3,
      },
    ],
  };

  // Prepare rows for DataGrid (Recent Transactions: last 5, newest first)
  const recentTransactions = transactions.slice(-5).reverse().map((tx, index) => ({
    id: index,
    date: new Date(tx.date).toLocaleDateString(),
    type: tx.type,
    amount: tx.amount,
    method: tx.paymentMethod,
    remarks: tx.remarks || '-',
  }));

  // Define columns for DataGrid
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
        {/* Sticky Header with Breadcrumbs and Quick Actions */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1200,
            backgroundColor: theme.palette.background.paper,
            py: isMobile ? 1 : 2,
            mb: 2,
            borderBottom: '1px solid',
            borderColor: theme.palette.divider,
          }}
        >

          {/* Tabs Header */}
          <Box sx={{ mt: 1 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                borderBottom: '1px solid',
                borderColor: theme.palette.divider,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  minWidth: 'auto',
                },
              }}
            >
              <Tab label="Details" value="details" />
              <Tab label="Transactions" value="transactions" />
              <Tab label="Materials" value="materials" />
              <Tab label="Attendance" value="attendance" />
              <Tab label="Tasks" value="tasks" />
              <Tab label="Chat" value="chat" />
            </Tabs>
          </Box>
        </Box>

        {/* Main Content */}
        <Fade in timeout={300}>
          <Paper
            sx={{
              p: isMobile ? 2 : 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.divider,
              boxShadow: 'none',
            }}
          >
            {activeTab === 'details' && (
              <Box>
                {/* Project Basic Info */}
                <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: 1 }}>
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
                      <strong>Duration:</strong> {new Date(project.startDate).toLocaleDateString()} - {new Date(project.estimatedEndDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />

                {/* Quick Stats */}
                <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
                  {/* Task Progress (Donut Chart) */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: theme.palette.divider }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Task Progress
                        </Typography>
                        <Box sx={{ height: 120, width: 120, mx: 'auto' }}>
                          <Doughnut data={donutData} options={{ maintainAspectRatio: false }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          {progressPercentage}% ({completedTasks}/{totalTasks})
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Materials Summary */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: theme.palette.divider }}>
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

                  {/* Transactions Summary */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: theme.palette.divider }}>
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

                  {/* Additional Info */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: theme.palette.divider }}>
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
                  </Grid>
                </Grid>

                {/* Transaction Trends (Line Chart) */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Transaction Trends
                  </Typography>
                  {transactions.length > 0 ? (
                    <Line data={lineChartData} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No transaction data available.
                    </Typography>
                  )}
                </Box>

                {/* Recent Transactions Table (DataGrid) */}
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

                {/* Activity Feed */}
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
                    {/* Replace with dynamic activity feed if available */}
                    <Typography variant="body2" color="text.secondary">
                      No recent activities.
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {/* Render other sections based on the active tab */}
            {activeTab === 'transactions' && <TransactionsSection projectId={id} isMobile={isMobile} />}
            {activeTab === 'materials' && <MaterialsSection projectId={id} isMobile={isMobile} />}
            {activeTab === 'attendance' && <AttendanceSection projectId={id} isMobile={isMobile} />}
            {activeTab === 'tasks' && <TasksSection projectId={id} isMobile={isMobile} />}
            {activeTab === 'chat' && <ProjectChat projectId={id} isMobile={isMobile} loggedInUserId={user._id} />}
          </Paper>
        </Fade>

        {/* Floating Action Button for Mobile (quick add) */}
        {isMobile && (
          <Fab
            color="primary"
            size="small"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => console.log('Open quick add menu')}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </LocalizationProvider>
  );
}
