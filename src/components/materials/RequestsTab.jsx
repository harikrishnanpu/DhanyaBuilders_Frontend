import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  TextField,
  Skeleton,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  CardMedia,
  Card,
} from '@mui/material';
import {
  Refresh,
  Edit,
  Delete,
  Approval,
  Cancel,
  Search,
  SystemUpdateAlt,
} from '@mui/icons-material';
import { useDebounce } from 'use-debounce';
import api from 'pages/api';
import ApproveRequestModal from 'src/components/materials/modals/ApproveRequestModal';

const MaterialItemsTab = ({ projectId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for material requests, loading/error, search & sort
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState('newest');

  // State for showing the approval modal for a single item
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch material requests for the project
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/project/materials/${projectId}`);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load materials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchRequests();
    }
  }, [projectId, fetchRequests]);

  // Flatten all material items from the requests
  const materialItems = requests.flatMap((request) =>
    request.items.map((item, index) => ({
      ...item,
      requestId: request.requestId,   // e.g. "REQ0001"
      request_id: request._id,        // Mongo DB ObjectId
      requestCreatedAt: request.createdAt,
      itemIndex: index,
    }))
  );

  // Filter items by search term (material name or request ID)
  const filteredItems = materialItems.filter((item) => {
    const lower = debouncedSearch.toLowerCase();
    return (
      item.material.name.toLowerCase().includes(lower) ||
      (item.requestId && item.requestId.toLowerCase().includes(lower))
    );
  });

  // Sort items by the request's created date
  const sortedItems = filteredItems.sort((a, b) =>
    sortBy === 'newest'
      ? new Date(b.requestCreatedAt) - new Date(a.requestCreatedAt)
      : new Date(a.requestCreatedAt) - new Date(b.requestCreatedAt)
  );

  // -----------------------------
  // Button Action Handlers
  // -----------------------------

  // Edit the requested quantity
  const handleEditItem = async (item) => {
    const newQuantityStr = window.prompt("Enter new requested quantity", item.quantity);
    if (newQuantityStr === null) return; // user canceled
    const newQuantity = parseFloat(newQuantityStr);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert("Invalid quantity.");
      return;
    }
    try {
      await api.put(`/api/projects/project/materials/requests/${item.request_id}/item/${item.itemIndex}`, {
        quantity: newQuantity,
        approvedQuantity: 0,
        rejectedQuantity: 0,
        status: 'Pending',
      });
      fetchRequests();
    } catch (error) {
      console.error("Error editing item:", error);
      setError("Error editing item.");
    }
  };

  // Delete the item entirely from the request
  const handleDeleteItem = async (item) => {
    try {
      await api.delete(`/api/projects/project/materials/requests/${item.request_id}/item/${item.itemIndex}`);
      fetchRequests();
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Error deleting item.");
    }
  };

  // Disapprove the item (sets approved=0, rejected=quantity, status=Rejected)
  const handleDisapproveItem = async (item) => {
    try {
      await api.put(`/api/projects/project/materials/requests/${item.request_id}/approve`, {
        items: [{
          materialId: item.material._id,
          requestedQuantity: item.quantity,
          approvedQuantity: 0,
          rejectedQuantity: item.quantity,
          status: 'Rejected',
        }]
      });
      fetchRequests();
    } catch (error) {
      console.error('Error disapproving item:', error);
      setError("Error disapproving item.");
    }
  };

  // Open the approval modal for adjusting an item
  const handleUpdateItem = (item) => {
    setSelectedItem(item);
    setApproveModalOpen(true);
  };

  // A compact card for each material item
  const CardListView = () => (
    <Grid container spacing={1} sx={{ p: 1 }}>
      {sortedItems.map((item) => (
        <Grid item xs={12} key={`${item.request_id}-${item.itemIndex}`}>
          <Card
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderRadius: 2,
              boxShadow: 0,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {/* Left side: material image or placeholder */}
            {item.material.imageUrl ? (
              <CardMedia
                component="img"
                image={item.material.imageUrl}
                alt={item.material.name}
                sx={{
                  width: 70,
                  height: 70,
                  objectFit: 'cover',
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  backgroundColor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {item.material.name}
                </Typography>
              </Box>
            )}

            {/* Right side: info + action buttons */}
            <Box sx={{ flex: 1, ml: 2 }}>
              <Typography variant="subtitle2" noWrap>
                {item.material.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Unit: {item.material.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Requested: {item.quantity}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Approved: {item.approvedQuantity || 0}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" mt={0.5}>
                Request ID: {item.requestId}
              </Typography>
              <Stack direction="row" spacing={1} mt={1}>
                {/* Approve (or partially approve) */}
                <Tooltip title="Approve / Update Approval">
                  <IconButton size="small" onClick={() => handleUpdateItem(item)}>
                    <Approval fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Disapprove */}
                <Tooltip title="Disapprove">
                  <IconButton size="small" onClick={() => handleDisapproveItem(item)}>
                    <Cancel fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Edit requested quantity */}
                <Tooltip title="Edit Request">
                  <IconButton size="small" onClick={() => handleEditItem(item)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Delete */}
                <Tooltip title="Delete Item">
                  <IconButton size="small" onClick={() => handleDeleteItem(item)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Another button to open approval modal, same as above (optional) */}
                <Tooltip title="Update Approval">
                  <IconButton size="small" onClick={() => handleUpdateItem(item)}>
                    <SystemUpdateAlt fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'none'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>

          {/* Sort & Refresh */}
          <Grid item xs={12} sm={6} md={8}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                sx={{ minWidth: 120 }}
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

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={80}
                sx={{ mb: 1, borderRadius: 2 }}
              />
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="outlined" onClick={fetchRequests}>
              Retry
            </Button>
          </Box>
        ) : sortedItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No materials found. Create a new request to get started.
            </Typography>
          </Box>
        ) : (
          <CardListView />
        )}
      </Box>

      {/* Error Snackbar */}
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

      {/* Approval Modal for single-item updates */}
      {approveModalOpen && selectedItem && (
        <ApproveRequestModal
          projectId={projectId}
          item={selectedItem}
          onClose={() => {
            setApproveModalOpen(false);
            setSelectedItem(null);
            fetchRequests();
          }}
          open={approveModalOpen}
        />
      )}
    </Paper>
  );
};

export default MaterialItemsTab;
