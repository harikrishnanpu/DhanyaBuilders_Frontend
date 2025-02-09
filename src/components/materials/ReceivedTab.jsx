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
  ExpandMore,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import api from 'pages/api';
import AddReceiptModal from './modals/AddReceiptModal';

/**
 * If your receipts have statuses, you can define colors here.
 * Or remove if you don't have statuses in your receipts.
 */
const statusColors = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Received: 'info',
};

const ReceivedTab = ({ projectId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for "Approved Materials" (waiting to be received) and "Receipts"
  const [approvedMaterials, setApprovedMaterials] = useState([]);
  const [receipts, setReceipts] = useState([]);

  // Flattened list of all received items
  const [receivedItems, setReceivedItems] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState('newest');

  // For Add Receipt Modal
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // For expansion in mobile cards
  const [expandedCard, setExpandedCard] = useState(null);

  // Fetch data: both "approved" materials and "receipts"
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [receiptRes, approvedRes] = await Promise.all([
        api.get(`/api/projects/project/get-receipt-material/${projectId}`),
        api.get(`/api/projects/project/approved-materials/${projectId}`)
      ]);
      const fetchedReceipts = receiptRes.data;
      const fetchedApproved = approvedRes.data;

      // Flatten each receipt's items into a single array, so we can show them by material basis
      // (with the receipt ID, date, etc.)
      // We assume each item might also store a requestId if your backend includes it.
      const flattened = fetchedReceipts.flatMap((receipt) =>
        receipt.items.map((item) => ({
          ...item,                      // { material, quantity, etc. }
          receiptId: receipt.receiptId, // link to the receipt
          date: receipt.date || null,
          // optional: if you store the original requestId in the item (item.requestId):
          // requestId: item.requestId || null,
        }))
      );

      setReceipts(fetchedReceipts);
      setApprovedMaterials(fetchedApproved);
      setReceivedItems(flattened);
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

  // Called when user wants to add a new receipt (either blank or with a preselected material).
  const handleAddReceipt = (material) => {
    setSelectedMaterial(material || null);
    setShowAddReceiptModal(true);
  };

  // Called after a receipt has been added or the modal is closed
  const handleReceiptAdded = () => {
    setShowAddReceiptModal(false);
    setSelectedMaterial(null);
    fetchData();
  };

  // Filter + sort for "approved" materials
  const filteredApprovedMaterials = approvedMaterials.filter((am) => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return true;
    return am.material.name.toLowerCase().includes(term);
  });

  // Show the "approved" materials in the requested sort order (if needed).
  // For now, we won't do date-based sorting of approved materials, but you can add logic if you want.

  // Filter + sort for "received" items
  const filteredReceivedItems = receivedItems
    .filter((ri) => {
      const term = debouncedSearch.trim().toLowerCase();
      if (!term) return true;
      // match either the material name, the receiptId, or an optional requestId
      const matchesName = ri.material.name.toLowerCase().includes(term);
      const matchesReceiptId = ri.receiptId?.toLowerCase().includes(term);
      // If your backend populates a requestId, you can match it here:
      // const matchesRequestId = ri.requestId && ri.requestId.toLowerCase().includes(term);
      // return matchesName || matchesReceiptId || matchesRequestId;

      return matchesName || matchesReceiptId;
    })
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      if (sortBy === 'newest') {
        return new Date(b.date) - new Date(a.date);
      }
      return new Date(a.date) - new Date(b.date);
    });

  // Toggle expansion for mobile cards
  const handleExpand = (materialId) => {
    setExpandedCard(expandedCard === materialId ? null : materialId);
  };

  // ===============================
  // MOBILE CARD VIEWS
  // ===============================

  /** Approved (mobile) */
  const MobileApprovedCardView = () => (
    <Box sx={{ p: 1 }}>
      {filteredApprovedMaterials.map((mat) => (
        <Card
          key={mat._id}
          sx={{
            mb: 2,
            boxShadow: 0,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <CardHeader
            title={
              <Typography variant="subtitle1" fontWeight={600}>
                {mat.material.name}
              </Typography>
            }
            subheader={
              <Typography variant="caption" color="text.secondary">
                Approved: {mat.approvedQuantity} {mat.material.unit}
              </Typography>
            }
          />
          <CardActions sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleAddReceipt(mat)}
            >
              Add to Receipt
            </Button>
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  /**
   * Received Items (mobile): each "flattened" item is displayed as a card with the
   * material image or a placeholder, quantity, receiptId, optional requestId, etc.
   */
  const MobileReceivedCardView = () => (
    <Box sx={{ p: 1 }}>
      {filteredReceivedItems.map((item, idx) => (
        <Card
          key={idx}
          sx={{
            mb: 2,
            boxShadow: 0,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <CardHeader
            avatar={
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 45,
                  height: 45,
                }}
              >
                {item.material.name.charAt(0).toUpperCase()}
              </Avatar>
            }
            title={
              <Typography variant="subtitle2" fontWeight={600}>
                {item.material.name}
              </Typography>
            }
            subheader={
              <Typography variant="caption" color="text.secondary">
                {item.receiptId
                  ? `Receipt: ${item.receiptId}`
                  : 'No Receipt ID'}
              </Typography>
            }
            action={
              <IconButton onClick={() => handleExpand(idx)}>
                <ExpandMore
                  sx={{
                    transform: expandedCard === idx ? 'rotate(180deg)' : 'none',
                    transition: theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }}
                />
              </IconButton>
            }
          />
          <Collapse in={expandedCard === idx}>
            <CardContent>
              {/* If you store an imageUrl on the material, show it here: */}
              {item.material.imageUrl ? (
                <Box
                  component="img"
                  src={item.material.imageUrl}
                  alt={item.material.name}
                  sx={{
                    width: '100%',
                    maxHeight: 180,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mb: 2,
                  }}
                />
              ) : null}

              <Typography variant="body2">
                Received Qty: {item.quantity} {item.material.unit}
              </Typography>
              {item.date && (
                <Typography variant="caption" color="text.secondary">
                  Received on: {format(new Date(item.date), 'dd MMM yyyy')}
                </Typography>
              )}
              {/* If you have item.requestId from your backend, display it: */}
              {/* <Typography variant="caption" display="block" color="text.secondary">
                Request ID: {item.requestId}
              </Typography> */}
            </CardContent>
          </Collapse>
        </Card>
      ))}
    </Box>
  );

  // ===============================
  // DESKTOP: Grid or Card Layout
  // ===============================

  /**
   * Approved (desktop)
   */
  const DesktopApprovedView = () => (
    <Grid container spacing={2}>
      {filteredApprovedMaterials.map((mat) => (
        <Grid item xs={12} md={6} lg={4} key={mat._id}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 0,
            }}
          >
            <Typography variant="subtitle1" fontWeight="600">
              {mat.material.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Approved: {mat.approvedQuantity} {mat.material.unit}
            </Typography>
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleAddReceipt(mat)}
              >
                Add to Receipt
              </Button>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  /**
   * Received Items (desktop):
   * We create a simple grid of cards, each representing one item from the flattened array.
   */
  const DesktopReceivedView = () => (
    <Grid container spacing={2}>
      {filteredReceivedItems.map((item, idx) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {/* Material name and optional image */}
            <Typography variant="subtitle2" fontWeight={600}>
              {item.material.name}
            </Typography>
            {item.material.imageUrl && (
              <Box
                component="img"
                src={item.material.imageUrl}
                alt={item.material.name}
                sx={{
                  width: '100%',
                  maxHeight: 140,
                  objectFit: 'cover',
                  borderRadius: 1,
                }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              Receipt ID: {item.receiptId || 'N/A'}
            </Typography>
            {/* If you have item.requestId, show it: */}
            {/* <Typography variant="caption" color="text.secondary">
              Request ID: {item.requestId || 'N/A'}
            </Typography> */}
            <Typography variant="body2">
              Received: {item.quantity} {item.material.unit}
            </Typography>
            {item.date && (
              <Typography variant="caption" color="text.secondary">
                {format(new Date(item.date), 'dd MMM yyyy')}
              </Typography>
            )}
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  // ===============================
  // RENDER
  // ===============================

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
        boxShadow: 0,                  // remove shadow
        backgroundColor: 'transparent' // remove default paper color
      }}
      elevation={0}
    >
      {/* Top Bar: Search, Sorting, Refresh, etc. */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
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
          <Grid item xs={12} sm={6} md={8}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              {/* Show 'New Receipt' button if not on mobile */}
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
      <Box sx={{ flex: 1, overflow: 'auto' }}>
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
            {/* Approved Materials (not yet received) */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Approved Materials
            </Typography>
            {filteredApprovedMaterials.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No approved materials available.
              </Typography>
            ) : isMobile ? (
              <MobileApprovedCardView />
            ) : (
              <DesktopApprovedView />
            )}

            <Divider sx={{ my: 3 }} />

            {/* Flattened Received Items */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Received Materials
            </Typography>
            {filteredReceivedItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No received materials found.
              </Typography>
            ) : isMobile ? (
              <MobileReceivedCardView />
            ) : (
              <DesktopReceivedView />
            )}
          </Box>
        )}
      </Box>

      {/* FAB for mobile to create a new receipt */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: theme.spacing(2),
            right: theme.spacing(2),
          }}
          onClick={() => handleAddReceipt(null)}
        >
          <Add />
        </Fab>
      )}

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
