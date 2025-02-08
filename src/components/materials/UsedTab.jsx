// src/components/materials/UsedTab.jsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper,
  Box,
  Grid,
  Stack,
  IconButton,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
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
  ArrowLeft,
  ArrowRight,
  CalendarToday
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDebounce } from 'use-debounce';
import api from 'pages/api';
import AddUsedMaterialModal from './modals/AddUsedMaterialModal';

const statusColors = {
  Used: 'info', // Example, if you have a status field
  Pending: 'warning',
  Approved: 'success',
  // etc...
};

const UsedTab = ({ projectId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Main state
  const [usedMaterials, setUsedMaterials] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState('newest');

  // Modal
  const [showAddUsageModal, setShowAddUsageModal] = useState(false);

  // For expanding a card in mobile view
  const [expandedUsage, setExpandedUsage] = useState(null);

  // Pagination for DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  /**
   * Fetch used materials by the selected date.
   */
  const fetchUsedMaterials = useCallback(async () => {
    if (!projectId || !selectedDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/projects/project/materials/used/${projectId}?date=${selectedDate.toISOString()}`
      );
      setUsedMaterials(response.data);
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

  /**
   * Navigate to previous day
   */
  const handlePrevDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  /**
   * Navigate to next day
   */
  const handleNextDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  /**
   * Open the "Add Usage" modal.
   */
  const handleAddUsage = () => {
    setShowAddUsageModal(true);
  };

  /**
   * When the modal closes, refresh usage data.
   */
  const handleUsageAdded = () => {
    setShowAddUsageModal(false);
    fetchUsedMaterials();
  };

  const handleExpand = (usageId) => {
    setExpandedUsage(expandedUsage === usageId ? null : usageId);
  };

  /**
   * Filter + sort the usedMaterials
   */
  const filteredUsages = usedMaterials
    .filter((usage) => {
      if (!debouncedSearch.trim()) return true;

      // Check usageId
      const matchesUsageId = usage.usageId
        ?.toLowerCase()
        .includes(debouncedSearch.toLowerCase());

      // Check items
      const matchesItems = usage.items?.some((item) =>
        item.material.name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      );

      return matchesUsageId || matchesItems;
    })
    .sort((a, b) => {
      // Sort by usage date or createdAt if you have it
      // For demonstration: sort by 'date' descending for newest or ascending for oldest
      if (sortBy === 'newest') {
        return new Date(b.date) - new Date(a.date);
      }
      return new Date(a.date) - new Date(b.date);
    });

  /**
   * DataGrid columns for desktop
   */
  const columns = [
    {
      field: 'usageId',
      headerName: 'Usage ID',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.date
              ? format(new Date(params.row.date), 'dd MMM yy')
              : 'N/A'}
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
      minWidth: 100,
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
        // Example actions if you allow editing or deleting usage:
        // <GridActionsCellItem
        //   icon={<Edit />}
        //   label="Edit"
        //   onClick={() => console.log('Edit usage', params.row._id)}
        // />,
      ],
    },
  ];

  /**
   * Mobile Card Layout
   */
  const MobileCardView = () => (
    <Box sx={{ p: 2 }}>
      {filteredUsages.map((usage) => (
        <Card key={usage._id} sx={{ mb: 2, boxShadow: 3 }}>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                {/* e.g., first 2 letters of usageId */}
                {usage.usageId?.slice(0, 2) || 'U?'}
              </Avatar>
            }
            title={
              <Typography variant="subtitle1" fontWeight={600}>
                {usage.usageId || 'No Usage ID'}
              </Typography>
            }
            subheader={
              <Stack direction="row" spacing={1} alignItems="center">
                {usage.status && (
                  <Chip
                    label={usage.status}
                    color={statusColors[usage.status] || 'default'}
                    size="small"
                    variant="outlined"
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {usage.date
                    ? format(new Date(usage.date), 'dd MMM yyyy')
                    : 'N/A'}
                </Typography>
              </Stack>
            }
            action={
              <IconButton onClick={() => handleExpand(usage._id)}>
                <ExpandMore
                  sx={{
                    transform: expandedUsage === usage._id ? 'rotate(180deg)' : 'none',
                    transition: theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                  }}
                />
              </IconButton>
            }
          />
          <Collapse in={expandedUsage === usage._id}>
            <CardContent>
              <Typography variant="body2" fontWeight="medium">
                Items:
              </Typography>
              {usage.items && usage.items.length > 0 ? (
                usage.items.map((item, idx) => (
                  <Typography key={idx} variant="body2">
                    • {item.material.name} - {item.quantity} {item.material.unit}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No items in this usage.
                </Typography>
              )}
            </CardContent>
            <Divider sx={{ mt: 2 }} />
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              {/* Additional actions (Edit, Delete, etc.) */}
            </CardActions>
          </Collapse>
        </Card>
      ))}
    </Box>
  );

  // Compute total items used for the day
  const totalUsedItems = usedMaterials.reduce(
    (count, usage) => count + (usage.items?.length || 0),
    0
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
          {/* Search Field */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search usage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>

          {/* Date Picker */}
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newVal) => {
                  if (newVal) setSelectedDate(newVal);
                }}
                maxDate={new Date()} // Example: block future dates if you'd like
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Stack>
          </Grid>

          {/* Sort By */}
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
              startAdornment={<CalendarToday sx={{ color: 'action.active', mr: 1 }} />}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </Select>
          </Grid>

          {/* Navigation & Actions */}
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Tooltip title="Previous Day">
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
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'auto', p: 2 }}>
        {loading ? (
          // Loading skeleton
          <Box>
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
          // Error state
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="outlined" onClick={fetchUsedMaterials}>
              Retry
            </Button>
          </Box>
        ) : (
          <>
            {/* Top info: total items used */}
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              Total Used Items: {totalUsedItems}
            </Typography>

            {/* No usage found? */}
            {filteredUsages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No materials used on this date.
              </Typography>
            ) : isMobile ? (
              // Mobile Card Layout
              <MobileCardView />
            ) : (
              // Desktop DataGrid Layout
              <DataGrid
                getRowId={(row) => row._id}
                rows={filteredUsages}
                columns={columns}
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
                        No materials used on this date.
                      </Typography>
                    </Box>
                  ),
                }}
                sx={{
                  height: 'calc(100% - 60px)', // Adjust for your layout
                  '& .MuiDataGrid-cell:focus': { outline: 'none' },
                  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                }}
              />
            )}
          </>
        )}
      </Box>



      {/* Add Usage Modal */}
      {showAddUsageModal && (
        <AddUsedMaterialModal
          projectId={projectId}
          open={showAddUsageModal}
          date={selectedDate}
          onClose={handleUsageAdded}
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

export default UsedTab;
