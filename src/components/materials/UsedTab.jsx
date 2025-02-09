import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  IconButton,
  Button,
  Typography,
  TextField,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
  Skeleton,
  Fab,
  useTheme,
  useMediaQuery,
  Select
} from '@mui/material';
import {
  Refresh,
  Search,
  Add,
  ArrowLeft,
  ArrowRight,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import api from 'pages/api';
import AddUsedMaterialModal from './modals/AddUsedMaterialModal';
import CommentDrawer from './modals/CommentDrawer';
import useAuth from 'hooks/useAuth';

// Example status colors if needed
const statusColors = {
  Used: 'info',
  Pending: 'warning',
  Approved: 'success',
  // etc...
};

export default function UsedTab({ projectId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Auth if needed (to send user info for comments, etc.)
  const { user: userInfo } = useAuth();

  // Date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Flattened array of used items
  const [usedItems, setUsedItems] = useState([]);

  // Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 400);

  // Sort
  const [sortBy, setSortBy] = useState('newest');

  // Add usage modal
  const [showAddUsageModal, setShowAddUsageModal] = useState(false);

  // Comment drawer
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [selectedItemForComments, setSelectedItemForComments] = useState(null);

  // Fetch usage from the server
  const fetchUsedMaterials = useCallback(async () => {
    if (!projectId || !selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      // Grab all usage records for the selected date
      const response = await api.get(
        `/api/projects/project/materials/used/${projectId}?date=${selectedDate.toISOString()}`
      );
      const usageRecords = response.data;  // an array of usage docs

      // Flatten the usage data
      // Each usage doc has: { _id, usageId, date, items: [ { material, quantity, comments: [] } ], ... }
      const flattened = usageRecords.flatMap((usageDoc) =>
        usageDoc.items.map((item, index) => ({
          ...item,
          usageDocId: usageDoc._id,   // The parent usage's DB ID
          usageId: usageDoc.usageId,  // The usage's short ID
          usageDate: usageDoc.date,
          itemIndex: index,           // index in the usageDoc
        }))
      );

      setUsedItems(flattened);
    } catch (err) {
      console.error('Error fetching used materials:', err);
      setError('Failed to load used materials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedDate]);

  useEffect(() => {
    fetchUsedMaterials();
  }, [fetchUsedMaterials]);

  // Add usage
  const handleAddUsage = () => {
    setShowAddUsageModal(true);
  };
  const handleUsageAdded = () => {
    setShowAddUsageModal(false);
    fetchUsedMaterials();
  };

  // Navigate previous day
  const handlePrevDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate next day
  const handleNextDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Delete a used item from the usage doc
  const handleDeleteItem = async (item) => {
    if (!window.confirm('Are you sure you want to remove this used item?')) {
      return;
    }
    try {
      await api.delete(
        `/api/projects/project/add-used/${item.usageDocId}/item/${item.itemIndex}`
      );
      // Refresh the items
      fetchUsedMaterials();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item.');
    }
  };

  // Open the comment drawer for a specific item
  const handleOpenComments = (item) => {
    setSelectedItemForComments(item);
    setCommentDrawerOpen(true);
  };
  const handleCloseComments = () => {
    setCommentDrawerOpen(false);
    setSelectedItemForComments(null);
    // optionally refetch to update comment list
    fetchUsedMaterials();
  };

  // Filter + sort
  const filteredItems = usedItems.filter((item) => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return true;
    const matchesName = item.material.name.toLowerCase().includes(term);
    const matchesUsageId =
      item.usageId && item.usageId.toLowerCase().includes(term);
    return matchesName || matchesUsageId;
  });

  const sortedItems = filteredItems.sort((a, b) => {
    // Sort by usageDate
    if (sortBy === 'newest') {
      return new Date(b.usageDate) - new Date(a.usageDate);
    } else {
      return new Date(a.usageDate) - new Date(b.usageDate);
    }
  });

  // Return a horizontally aligned card for each used item
  const UsedItemCard = ({ item }) => {
    // We can also show item.status if you track status
    // item.comments is an array of { _id, text, authorId, etc. }
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          mb: 1,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 0,
        }}
      >
        {/* Left side: Image or placeholder */}
        {item.material.imageUrl ? (
          <Box
            component="img"
            src={item.material.imageUrl}
            alt={item.material.name}
            sx={{
              width: 70,
              height: 70,
              objectFit: 'cover',
              borderRadius: 1,
              mr: 2,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 70,
              height: 70,
              backgroundColor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
              mr: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {item.material.name}
            </Typography>
          </Box>
        )}

        {/* Middle: Info */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {item.material.name} ({item.material.unit})
          </Typography>
          <Stack direction="row" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Qty: {item.quantity}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Usage: {item.usageId || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.usageDate
                ? format(new Date(item.usageDate), 'dd MMM yyyy')
                : 'N/A'}
            </Typography>
          </Stack>
        </Box>

        {/* Right side: Action buttons */}
        <Stack direction="row" spacing={1}>
          <Tooltip title="Comments">
            <IconButton
              size="small"
              onClick={() => handleOpenComments(item)}
            >
              {/* Some comment icon, or use a custom one */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 22c-1.042 0-2-.422-2.678-1.11l-5.212-5.212c-.592-.592-.92-1.374-.92-2.209v-7.469c0-2.209 1.791-4 4-4h12c2.209 0 4 1.791 4 4v7.469c0 2.209-1.791 4-4 4h-2.424l-3.949 3.944c-.478.478-1.093.588-1.817.588h-.001zm-5-19c-1.103 0-2 .897-2 2v7.469c0 .265.105.52.293.707l5.213 5.213c.051.051.086.066.137.066s.086-.015.137-.066l4.244-4.244h3.976c1.103 0 2-.897 2-2v-7.469c0-1.103-.897-2-2-2h-12z"></path>
              </svg>
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete this item">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteItem(item)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 3v-1c0-.552.448-1 1-1h4c.552 0 1 .448 1 1v1h5c.552 0 1 .448 1 1s-.448 1-1 1h-1v15.5c0 1.38-1.12 2.5-2.5 2.5h-10c-1.38 0-2.5-1.12-2.5-2.5v-15.5h-1c-.552 0-1-.448-1-1s.448-1 1-1h5zm2 0h2v-1h-2v1zm-6 3v15.5c0 .276.224.5.5.5h10c.276 0 .5-.224.5-.5v-15.5h-11z"></path>
              </svg>
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    );
  };

  // Render
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Search */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search used materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
            }}
            sx={{ width: isMobile ? '100%' : 200 }}
          />

          {/* Date Picker */}
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newVal) => newVal && setSelectedDate(newVal)}
            maxDate={new Date()}
            slotProps={{
              textField: { size: 'small' },
            }}
          />

          {/* Sort */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="small"
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>

          <Tooltip title="Prev Day">
            <IconButton onClick={handlePrevDate}>
              <ArrowLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Day">
            <IconButton onClick={handleNextDate}>
              <ArrowRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsedMaterials}>
              <Refresh />
            </IconButton>
          </Tooltip>

          {/* Desktop "Add Usage" Button */}
          {!isMobile && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<Add />}
              onClick={handleAddUsage}
            >
              New Usage
            </Button>
          )}
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={60}
              sx={{ mb: 2, borderRadius: 2 }}
            />
          ))
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="outlined" onClick={fetchUsedMaterials}>
              Retry
            </Button>
          </Box>
        ) : sortedItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No materials used on this date.
          </Typography>
        ) : (
          sortedItems.map((item, index) => (
            <UsedItemCard key={index} item={item} />
          ))
        )}
      </Box>

      {/* Floating Button for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: theme.spacing(2), right: theme.spacing(2) }}
          onClick={handleAddUsage}
        >
          <Add />
        </Fab>
      )}

      {/* Add Usage Modal */}
      {showAddUsageModal && (
        <AddUsedMaterialModal
          projectId={projectId}
          date={selectedDate}
          open={showAddUsageModal}
          onClose={handleUsageAdded}
        />
      )}

      {/* Comments Drawer */}
      {commentDrawerOpen && selectedItemForComments && (
        <CommentDrawer
          open={commentDrawerOpen}
          onClose={handleCloseComments}
          item={selectedItemForComments}
          usageDocId={selectedItemForComments.usageDocId}
          itemIndex={selectedItemForComments.itemIndex}
        />
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        onClose={() => setError(null)}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
