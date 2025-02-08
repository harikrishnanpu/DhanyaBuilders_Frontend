import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  TextField,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  Fab,
  Collapse,
  CardContent,
  Avatar,
  Card,
  CardHeader,
  CardActions,
  Divider,
} from '@mui/material';
import {
  Add,
  Refresh,
  Edit,
  Delete,
  Search,
  Comment,
  Approval,
  ExpandMore,
  FilterList,
  Sort
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import api from 'pages/api';
import ApproveRequestDrawer from './modals/ApproveRequestDrawer';
import ConfirmationDialog from './common/ConfirmationDialog';
import RequestDetails from './modals/RequestDetails';

const statusColors = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  'Partially Approved': 'info',
  Revoked: 'default'
};

const RequestsTab = ({ projectId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openApproveDrawer, setOpenApproveDrawer] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/project/materials/${projectId}`);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchRequests();
  }, [projectId, fetchRequests]);

  const handleApprove = async (request, approvedItems) => {
    setLoading(true);
    try {
      const approvalData = {
        items: approvedItems.map((item) => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
          approvedQuantity: item.approvedQuantity,
          rejectedQuantity: item.requestedQuantity - item.approvedQuantity,
          status: item.approvedQuantity === item.requestedQuantity ? 'Approved' :
                  item.approvedQuantity === 0 ? 'Rejected' : 'Partially Approved'
        }))
      };

      await api.put(`/api/projects/project/materials/requests/${request._id}/approve`, approvalData);
      setOpenApproveDrawer(false);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await api.delete(`/api/requests/${requestId}`);
      fetchRequests();
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError('Failed to delete request. Please try again.');
    }
  };

  const filteredRequests = requests
    .filter(req => 
      (filterStatus === 'all' || req.status === filterStatus) &&
      (req.requestId?.toLowerCase().includes(debouncedSearch.trim().toLowerCase()) ||
       req.items?.some(item => item.material.name.toLowerCase().includes(debouncedSearch.toLowerCase())))
    )
    .sort((a, b) => sortBy === 'newest' ? 
      new Date(b.createdAt) - new Date(a.createdAt) : 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

  const handleExpand = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const MobileCardView = () => (
    <Box sx={{ p: 2 }}>
      {filteredRequests.map((request) => (
        <Card key={request._id} sx={{ mb: 2, boxShadow: 3 }}>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: theme.palette[statusColors[request.status]]?.main }}>
                {request.requestId.slice(0, 2)}
              </Avatar>
            }
            title={
              <Typography variant="subtitle1" fontWeight={600}>
                {request.requestId}
              </Typography>
            }
            subheader={
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={request.status}
                  color={statusColors[request.status]}
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(request.createdAt), 'dd MMM yyyy')}
                </Typography>
              </Stack>
            }
            action={
              <IconButton onClick={() => handleExpand(request._id)}>
                <ExpandMore sx={{
                  transform: expandedRequest === request._id ? 'rotate(180deg)' : 'none',
                  transition: theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shortest,
                  }),
                }}/>
              </IconButton>
            }
          />
          
          <Collapse in={expandedRequest === request._id}>
            <CardContent>
              <RequestDetails request={request} />
              
              <Divider sx={{ my: 2 }} />
              
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <Tooltip title="Approve Request">
                  <IconButton 
                    color="primary"
                    onClick={() => {
                      setSelectedRequest(request);
                      setOpenApproveDrawer(true);
                    }}
                    disabled={request.status !== 'Pending'}
                  >
                    <Approval />
                  </IconButton>
                </Tooltip>
                
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Edit">
                    <IconButton
                      disabled={request.status !== 'Pending'}
                      onClick={() => console.log('Edit', request._id)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      disabled={request.status !== 'Pending'}
                      onClick={() => {
                        setSelectedRequest(request);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Comments">
                    <IconButton onClick={() => console.log('Comments', request._id)}>
                      <Comment fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardActions>
            </CardContent>
          </Collapse>
        </Card>
      ))}
    </Box>
  );

  const columns = [
    {
      field: 'requestId',
      headerName: 'Request ID',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(params.row.createdAt), 'dd MMM yy')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'items',
      headerName: 'Materials',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Stack spacing={0.5}>
          {params.value.map((item, index) => (
            <Typography key={index} variant="body2" noWrap>
              {item.material.name} ({item.quantity} {item.material.unit})
            </Typography>
          ))}
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value] || 'default'}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      flex: 1,
      minWidth: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Approval />}
          label="Approve"
          onClick={() => {
            setSelectedRequest(params.row);
            setOpenApproveDrawer(true);
          }}
          disabled={params.row.status !== 'Pending'}
        />,
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => console.log('Edit', params.id)}
          disabled={params.row.status !== 'Pending'}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => {
            setSelectedRequest(params.row);
            setOpenDeleteDialog(true);
          }}
          disabled={params.row.status !== 'Pending'}
        />,
        <GridActionsCellItem
          icon={<Comment />}
          label="Comments"
          onClick={() => console.log('Comments', params.id)}
        />,
      ],
    },
  ];

  return (
    <Paper sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header Section */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={8}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                IconComponent={FilterList}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.keys(statusColors).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
              
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
                IconComponent={Sort}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>

              <Tooltip title="Refresh">
                <IconButton onClick={fetchRequests}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={fetchRequests}>
              Retry
            </Button>
          </Box>
        ) : isMobile ? (
          <MobileCardView />
        ) : (
          <DataGrid
            getRowId={(row) => row._id}
            rows={filteredRequests}
            columns={columns}
            pageSizeOptions={[5, 10, 25]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            density="comfortable"
            slots={{
              loadingOverlay: LinearProgress,
              noRowsOverlay: () => (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No requests found. Create a new request to get started.
                  </Typography>
                </Box>
              ),
            }}
            loading={loading}
            sx={{
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
            }}
          />
        )}
      </Box>



      {/* Modals and Dialogs */}
      <ApproveRequestDrawer
        open={openApproveDrawer}
        request={selectedRequest}
        onClose={() => setOpenApproveDrawer(false)}
        onApprove={handleApprove}
      />

      <ConfirmationDialog
        open={openDeleteDialog}
        title="Delete Request"
        content="Are you sure you want to delete this request? This action cannot be undone."
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={() => handleDeleteRequest(selectedRequest?._id)}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RequestsTab;