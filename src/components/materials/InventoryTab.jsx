import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  Typography,
  TableSortLabel,
  TablePagination,
  useMediaQuery,
  useTheme,
  Chip,
  Skeleton,
  Box
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Edit,
  Delete,
  AddCircle,
  Search
} from '@mui/icons-material';
import api from 'pages/api';
import { format } from 'date-fns';

const InventoryTab = ({ projectId }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchInventory();
  }, [projectId]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/project/inventory/${projectId}`);
      setInventory(response.data);
      setError(null);
    } catch (error) {
      setError('Failed to load inventory. Please try again.');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredInventory = inventory.filter(item =>
    item.material.name.toLowerCase().includes(searchTerm) ||
    item.material.unit.toLowerCase().includes(searchTerm)
  );

  const sortedInventory = filteredInventory.sort((a, b) => {
    const aValue = orderBy === 'name' ? a.material[orderBy] : a[orderBy];
    const bValue = orderBy === 'name' ? b.material[orderBy] : b[orderBy];
    return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, sortedInventory.length - page * rowsPerPage);

  const StyledTableCell = ({ children, align = 'left', sortKey, ...props }) => (
    <TableCell align={align} sx={{ fontWeight: 600, minWidth: isMobile ? 120 : 160 }} {...props}>
      {sortKey ? (
        <TableSortLabel
          active={orderBy === sortKey}
          direction={orderBy === sortKey ? order : 'asc'}
          onClick={() => handleSort(sortKey)}
        >
          {children}
        </TableSortLabel>
      ) : (
        children
      )}
    </TableCell>
  );

  return (
    <Paper sx={{padding: 1}} >
      <Grid spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search inventory..."
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'action.active', mr: 1 }} />
              ),
            }}
            onChange={handleSearch}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Tooltip title="Refresh inventory">
            <IconButton onClick={fetchInventory}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter inventory">
            <IconButton>
              <FilterList />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add new material">
            <IconButton color="primary">
              <AddCircle />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      {error && (
        <Chip
          label={error}
          color="error"
          onDelete={() => setError(null)}
          sx={{ mb: 2 }}
        />
      )}

      <TableContainer >
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} height={56} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <>
            <Table stickyHeader aria-label="inventory table">
              <TableHead>
                <TableRow>
                  <StyledTableCell sortKey="name">Material</StyledTableCell>
                  <StyledTableCell sortKey="quantity" align="center">Quantity</StyledTableCell>
                  <StyledTableCell sortKey="unit">Unit</StyledTableCell>
                  <StyledTableCell>Last Updated</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedInventory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow
                      key={item.material._id}
                      hover
                      sx={{ '&:last-child td': { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight={500}>
                          {item.material.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.material.category}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.quantity}
                          color={
                            item.quantity < item.material.minStock
                              ? 'error'
                              : item.quantity > item.material.maxStock
                              ? 'warning'
                              : 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{item.material.unit}</TableCell>
                      <TableCell>
                        {format(new Date(item.updatedAt || new Date()), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={5} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {sortedInventory.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No inventory items found. Start by adding new materials.
                </Typography>
              </Box>
            )}
          </>
        )}
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={sortedInventory.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
      />

      {loading && <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />}
    </Paper>
  );
};

export default InventoryTab;