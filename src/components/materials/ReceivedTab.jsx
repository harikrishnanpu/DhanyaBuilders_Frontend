// src/components/materials/ReceivedTab.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Grid,
  IconButton,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  Chip,
  Divider,
  Collapse,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Snackbar,
  Alert,
  Skeleton,
  Fab,
  useTheme,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import {
  Refresh,
  Search,
  Add,
  ExpandMore
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import api from 'pages/api';
import AddReceiptModal from './modals/AddReceiptModal';

/**
 * Colors for potential statuses (if you'd like to show them). 
 * Adjust or remove if receipts/approved materials don't have statuses.
 */
const statusColors = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Received: 'info',
};

/**
 * The ReceivedTab shows two main pieces of data:
 * 1. Approved Materials (those waiting to be received).
 * 2. Receipts (actual records of received materials).
 */
const ReceivedTab = ({ projectId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for data
  const [receipts, setReceipts] = useState([]);
  const [approvedMaterials, setApprovedMaterials] = useState([]);

  // Loading / Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState('newest');

  // For expansions in the mobile layout
  const [expandedCard, setExpandedCard] = useState(null);

  // Pagination for DataGrid
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  /**
   * Fetch both receipts and approved materials in parallel
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjust endpoints to match your actual APIs
      const [receiptRes, approvedRes] = await Promise.all([
        api.get(`/api/projects/project/get-receipt-material/${projectId}`),
        api.get(`/api/projects/project/approved-materials/${projectId}`),
      ]);
      setReceipts(receiptRes.data);
      setApprovedMaterials(approvedRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId, fetchData]);

  /**
   * Called when user clicks "Add to Receipt" or the FAB button.
   */
  const handleAddReceipt = (material) => {
    setSelectedMaterial(material || null);
    setShowAddReceiptModal(true);
  };

  /**
   * Called when the modal is closed (receipt added or canceled).
   */
  const handleReceiptAdded = () => {
    setShowAddReceiptModal(false);
    setSelectedMaterial(null);
    fetchData();
  };

  /**
   * Filter + sort logic for receipts
   */
  const filteredReceipts = receipts
    // Filter by receiptId or included items
    .filter((r) => {
      if (!debouncedSearch.trim()) return true;
      const matchesReceiptId = r.receiptId
        ?.toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesItem = r.items?.some((item) =>
        item.material.name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      );
      return matchesReceiptId || matchesItem;
    })
    // Sort by createdAt or date (adjust as needed)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date) - new Date(a.date);
      }
      return new Date(a.date) - new Date(b.date);
    });

  /**
   * Filter + sort logic for approved materials
   * (If you'd like to search or sort them similarly)
   */
  const filteredApprovedMaterials = approvedMaterials.filter((m) => {
    if (!debouncedSearch.trim()) return true;
    return m.material.name
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
  });

  const handleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  /**
   * DataGrid columns for receipts (desktop view)
   */
  const receiptColumns = [
    {
      field: 'receiptId',
      headerName: 'Receipt ID',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.date ? format(new Date(params.row.date), 'dd MMM yy') : 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'items',
      headerName: 'Items',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        if (!params.value?.length) {
          return (
            <Typography variant="body2" color="text.secondary">
              No items
            </Typography>
          );
        }
        return (
          <Stack spacing={0.5}>
            {params.value.map((item, index) => (
              <Typography key={index} variant="body2" noWrap>
                {item.material.name} - {item.quantity} {item.material.unit}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        if (!params.value) {
          return (
            <Chip
              label="N/A"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          );
        }
        return (
          <Chip
            label={params.value}
            color={statusColors[params.value] || 'default'}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      flex: 1,
      minWidth: 80,
      getActions: (params) => [
        // Example actions if you want to edit or view
        // <GridActionsCellItem
        //   icon={<Edit />}
        //   label="Edit"
        //   onClick={() => console.log('Edit receipt', params.row._id)}
        // />,
      ],
    },
  ];

  /**
   * Mobile Card View for Receipts
   */
  const MobileReceiptsCardView = () => (
    <Box sx={{ p: 2 }}>
      {filteredReceipts.map((receipt) => (
        <Card key={receipt._id} sx={{ mb: 2, boxShadow: 3 }}>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {/* Using first 2 letters of receiptId as avatar text */}
                {receipt.receiptId.slice(0, 2)}
              </Avatar>
            }
            title={
              <Typography variant="subtitle1" fontWeight={600}>
                {receipt.receiptId}
              </Typography>
            }
            subheader={
              <Stack direction="row" spacing={1} alignItems="center">
                {receipt.status && (
                  <Chip
                    label={receipt.status}
                    color={statusColors[receipt.status] || 'default'}
                    size="small"
                    variant="outlined"
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {receipt.date
                    ? format(new Date(receipt.date), 'dd MMM yyyy')
                    : 'N/A'}
                </Typography>
              </Stack>
            }
            action={
              <IconButton onClick={() => handleExpand(receipt._id)}>
                <ExpandMore
                  sx={{
                    transform: expandedCard === receipt._id ? 'rotate(180deg)' : 'none',
                    transition: theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }}
                />
              </IconButton>
            }
          />
          <Collapse in={expandedCard === receipt._id}>
            <CardContent>
              <Typography variant="body2" fontWeight="medium">
                Items:
              </Typography>
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, index) => (
                  <Typography key={index} variant="body2">
                    • {item.material.name} - {item.quantity} {item.material.unit}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No items in this receipt.
                </Typography>
              )}
            </CardContent>
            <Divider sx={{ mt: 2 }} />
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              {/* Example additional actions (edit, etc.) */}
            </CardActions>
          </Collapse>
        </Card>
      ))}
    </Box>
  );

  /**
   * Mobile Card View for Approved Materials
   */
  const MobileApprovedCardView = () => (
    <Box sx={{ p: 2 }}>
      {filteredApprovedMaterials.map((material) => (
        <Card key={material._id} sx={{ mb: 2, boxShadow: 1 }}>
          <CardHeader
            title={
              <Typography variant="subtitle1" fontWeight={600}>
                {material.material?.name || 'Unnamed Material'}
              </Typography>
            }
            subheader={
              <Typography variant="caption" color="text.secondary">
                Approved Qty: {material.approvedQuantity} {material.material.unit}
              </Typography>
            }
          />
          <CardActions sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleAddReceipt(material)}
            >
              Add to Receipt
            </Button>
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header Section */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            {/* Search Field */}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search receipts or materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={8}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              {/* Example sorting dropdown (by date) */}
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>

              {/* Refresh Button */}
              <Tooltip title="Refresh">
                <IconButton onClick={fetchData}>
                  <Refresh />
                </IconButton>
              </Tooltip>

              {/* "New Receipt" button for desktop */}
              {!isMobile && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => handleAddReceipt(null)}
                >
                  New Receipt
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'auto' }}>
        {/* Loading State */}
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={80}
                sx={{ mb: 2, borderRadius: 2 }}
              />
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="outlined" onClick={fetchData}>
              Retry
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Approved Materials Section */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Approved Materials
            </Typography>
            {isMobile ? (
              <MobileApprovedCardView />
            ) : (
              <Grid container spacing={2}>
                {filteredApprovedMaterials.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      No approved materials available.
                    </Typography>
                  </Grid>
                ) : (
                  filteredApprovedMaterials.map((material) => (
                    <Grid item xs={12} md={6} lg={4} key={material._id}>
                      <Paper
                        sx={{
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          backgroundColor: 'grey.50',
                          borderRadius: 2,
                        }}
                        elevation={2}
                      >
                        <Typography variant="subtitle1" fontWeight="600">
                          {material.material?.name || 'Unnamed Material'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Approved Qty: {material.approvedQuantity}{' '}
                          {material.material.unit}
                        </Typography>
                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAddReceipt(material)}
                          >
                            Add to Receipt
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Receipts List Section */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Receipts
            </Typography>
            {filteredReceipts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No receipts found.
              </Typography>
            ) : isMobile ? (
              <MobileReceiptsCardView />
            ) : (
              <DataGrid
                getRowId={(row) => row._id}
                rows={filteredReceipts}
                columns={receiptColumns}
                pageSizeOptions={[5, 10, 25]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                density="comfortable"
                loading={loading}
                slots={{
                  loadingOverlay: LinearProgress,
                  noRowsOverlay: () => (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        No receipts found.
                      </Typography>
                    </Box>
                  ),
                }}
                sx={{
                  minHeight: 400,
                  '& .MuiDataGrid-cell:focus': { outline: 'none' },
                  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                }}
              />
            )}
          </Box>
        )}
      </Box>



      {/* Add Receipt Modal */}
      {showAddReceiptModal && (
        <AddReceiptModal
          projectId={projectId}
          material={selectedMaterial}
          open={showAddReceiptModal}
          onClose={handleReceiptAdded}
        />
      )}

      {/* Snackbar for errors */}
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

export default ReceivedTab;
