// src/components/TransactionsSection.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  Divider,
  Slide,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from 'pages/api';
import useAuth from 'hooks/useAuth';
import { useGetMenuMaster } from 'api/menu';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { Bank } from 'iconsax-react';

// Transition component for sliding the modal from the bottom
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function TransactionsSection({ projectId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { menuMaster } = useGetMenuMaster();

  // Date & Transactions
  const [date, setDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);
  const [Isloading, setIsLoading] = useState(false);

  // Tab & Modal State
  const [activeTab, setActiveTab] = useState('in'); // 'in', 'out', or 'transfer'
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('in'); // 'in', 'out', or 'transfer'

  // Payment States (for Payment In/Out)
  const [paymentFrom, setPaymentFrom] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentCategory, setPaymentCategory] = useState('');
  const [paymentCategories, setPaymentCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [accounts, setAccounts] = useState([]);

  // Transfer States
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Common State
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const { user: userInfo } = useAuth();

  // Helper function: Lookup account name by its ID
  const getAccountNameById = (id) => {
    const account = accounts.find((acc) => acc.accountId === id);
    return account ? account.accountName : id;
  };

  // Optional helper: Format currency for display
  const formatCurrency = (num) => `₹${Number(num).toFixed(2)}`;

  // Fetch transactions for the selected date (including payment in, payment out, and transfer)
  const fetchTransactions = async () => {
    try {
      const dateString = date.toISOString().substring(0, 10);
      const response = await api.get(
        `/api/projects/project/transactions/${projectId}?date=${dateString}`
      );
      setTransactions(response.data);
      // Calculate totals for each transaction type
      const totalInCalc = response.data
        .filter((t) => t.type === 'in')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalOutCalc = response.data
        .filter((t) => t.type === 'out')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalTransferCalc = response.data
        .filter((t) => t.type === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0);
      setTotalIn(totalInCalc);
      setTotalOut(totalOutCalc);
      setTotalTransfer(totalTransferCalc);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch payment categories for payments
  const fetchPaymentCategories = async () => {
    try {
      const response = await api.get('/api/projects/project/Paymentcategories');
      setPaymentCategories(response.data);
    } catch (error) {
      console.error('Error fetching payment categories:', error);
    }
  };

  const fetchAccounts = async () => {
    setIsLoading(true); // Set loading state
    try {
      const response = await api.get('/api/accounts/allaccounts');
      const getPaymentMethod = response.data.map((acc) => acc.accountId);

      // Check if there are any accounts and set the first account as the default
      if (getPaymentMethod.length > 0) {
        const firstAccountId = getPaymentMethod[0];
        setPaymentMethod(firstAccountId); // Set the first account as default
      } else {
        setPaymentMethod(null); // Handle case where there are no accounts
      }

      setAccounts(response.data); // Set the accounts in state
    } catch (err) {
      console.error('Failed to fetch payment accounts.', err);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, projectId]);

  useEffect(() => {
    fetchAccounts();
    fetchPaymentCategories();
  }, []);

  // Date Navigation
  const handleDateChange = (offset) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + offset);
    setDate(newDate);
  };

  // Handle adding Payment or Transfer based on modalType
  const handleAddTransaction = async () => {
    if (modalType === 'transfer') {
      // Validate Transfer fields
      if (!transferFrom || !transferTo || !transferAmount) {
        alert('Please fill all required fields for transfer.');
        return;
      }
      setLoading(true);
      try {
        await api.post(`/api/projects/project/transactions/${projectId}`, {
          type: 'transfer',
          amount: Number(transferAmount),
          transferFrom,
          transferTo,
          paymentCategory,
          remarks,
          userId: userInfo._id,
          date: date.toISOString(),
        });
        setShowModal(false);
        setTransferFrom('');
        setTransferTo('');
        setTransferAmount('');
        setRemarks('');
        fetchTransactions();
      } catch (error) {
        console.error('Error adding transfer:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Validate Payment fields
      if (!paymentFrom || !amount || !paymentMethod || !paymentCategory) {
        alert('Please fill all required fields.');
        return;
      }
      setLoading(true);
      try {
        await api.post(`/api/projects/project/transactions/${projectId}`, {
          type: modalType, // either 'in' or 'out'
          amount: Number(amount),
          paymentFrom,
          paymentMethod,
          paymentCategory,
          remarks,
          userId: userInfo._id,
          date: date.toISOString(),
        });
        setShowModal(false);
        setPaymentFrom('');
        setAmount('');
        setPaymentMethod('');
        setPaymentCategory('');
        setRemarks('');
        fetchTransactions();
      } catch (error) {
        console.error('Error adding transaction:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle adding a new payment category
  const handleAddCategory = async () => {
    if (!newCategoryName) {
      alert('Please enter category name.');
      return;
    }
    try {
      const response = await api.post('/api/projects/project/Paymentcategories', {
        name: newCategoryName,
      });
      setPaymentCategories([...paymentCategories, response.data.category]);
      setPaymentCategory(response.data.category.name);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Format Date & Time for display
  const formatDateDisplay = (dateObj) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  };

  const formatTimeDisplay = (dateString) => {
    const dateObj = new Date(dateString);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return dateObj.toLocaleTimeString('en-US', options);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
      {/* Date Navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          gap: 2,
        }}
      >
        <IconButton onClick={() => handleDateChange(-1)}>
          <ChevronLeft fontSize={isMobile ? 'small' : 'medium'} />
        </IconButton>
        <Typography variant={isMobile ? 'subtitle2' : 'h6'} sx={{ fontWeight: 'bold' }}>
          {formatDateDisplay(date)}
        </Typography>
        <IconButton onClick={() => handleDateChange(1)}>
          <ChevronRight fontSize={isMobile ? 'small' : 'medium'} />
        </IconButton>
      </Box>

      {/* Totals Display */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Total Payment In
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {formatCurrency(totalIn)}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Total Payment Out
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {formatCurrency(totalOut)}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
              Total Transfer
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main' }}>
              {formatCurrency(totalTransfer)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          color="primary"
          value={activeTab}
          exclusive
          onChange={(event, newValue) => {
            if (newValue !== null) setActiveTab(newValue);
          }}
          fullWidth
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <ToggleButton value="in">Payments In</ToggleButton>
          <ToggleButton value="out">Payments Out</ToggleButton>
          <ToggleButton value="transfer">Transfers</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Transactions List */}
      <Box sx={{ mb: 8 }}>
        {transactions
          .filter((t) => t.type === activeTab)
          .map((transaction) => (
            <Paper
              key={transaction._id}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                boxShadow: 1,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.01)' },
              }}
            >
              <Grid container spacing={1} justifyContent="space-between">
                <Grid item xs={8}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {transaction.type === 'transfer'
                      ? `${getAccountNameById(transaction.paymentFrom)} → ${getAccountNameById(transaction.paymentMethod)}`
                      : getAccountNameById(transaction.paymentFrom)}
                  </Typography>
                  {transaction.type !== 'transfer' && (
                    <Typography variant="caption" color="text.secondary">
                      {transaction.paymentCategory} • {getAccountNameById(transaction.paymentMethod)}
                    </Typography>
                  )}
                  {transaction.remarks && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {transaction.remarks}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color:
                        transaction.type === 'in'
                          ? 'success.main'
                          : transaction.type === 'out'
                          ? 'error.main'
                          : 'info.main',
                    }}
                  >
                    {formatCurrency(transaction.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeDisplay(transaction.date)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        {transactions.filter((t) => t.type === activeTab).length === 0 && (
          <Typography align="center" color="text.secondary">
            No transactions found for this date.
          </Typography>
        )}
      </Box>

      {/* Fixed Bottom Action Section with Background */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: isMobile
            ? 0
            : menuMaster.isDashboardDrawerOpened
            ? '280px'
            : menuMaster.isComponentDrawerOpened
            ? '80px'
            : 0,
          width: isMobile
            ? '100%'
            : menuMaster.isDashboardDrawerOpened
            ? 'calc(100% - 280px)'
            : menuMaster.isComponentDrawerOpened
            ? 'calc(100% - 80px)'
            : '100%',
          bgcolor: 'background.paper',
          p: 1,
          display: 'flex',
          justifyContent: 'space-around',
          borderTop: 1,
          borderColor: 'divider',
          boxShadow: 3,
          zIndex: 100,
        }}
      >
        <Button
          variant="outlined"
          color="success"
          onClick={() => {
            setModalType('in');
            setShowModal(true);
          }}
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
        >
          <FaPlus />
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            setModalType('out');
            setShowModal(true);
          }}
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
        >
          <FaMinus />
        </Button>
        <Button
          variant="outlined"
          color="info"
          onClick={() => {
            setModalType('transfer');
            setShowModal(true);
          }}
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
        >
          <Bank />
        </Button>
      </Box>

      {/* Transaction Modal as a Bottom Sheet */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        fullWidth
        TransitionComponent={Transition}
        keepMounted
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 0,
            m: 0,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          {modalType === 'in'
            ? 'Add Payment In'
            : modalType === 'out'
            ? 'Add Payment Out'
            : 'Add Transfer'}
          <IconButton
            aria-label="close"
            onClick={() => setShowModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent dividers>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            {modalType === 'transfer' ? (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Transfer From</InputLabel>
                  <Select
                    value={transferFrom}
                    label="Transfer From"
                    onChange={(e) => setTransferFrom(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Account</em>
                    </MenuItem>
                    {accounts.map((acc) => (
                      <MenuItem key={acc.accountId} value={acc.accountId}>
                        {acc.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Transfer To</InputLabel>
                  <Select
                    value={transferTo}
                    label="Transfer To"
                    onChange={(e) => setTransferTo(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Account</em>
                    </MenuItem>
                    {accounts.map((acc) => (
                      <MenuItem key={acc.accountId} value={acc.accountId}>
                        {acc.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Category</InputLabel>
                  <Select
                    value={paymentCategory}
                    label="Payment Category"
                    onChange={(e) => setPaymentCategory(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Category</em>
                    </MenuItem>
                    {paymentCategories.map((category) => (
                      <MenuItem key={category._id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Date"
                  type="date"
                  value={date.toISOString().substring(0, 10)}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Amount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Remarks"
                  multiline
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </>
            ) : (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label={modalType === 'in' ? 'Payment From' : 'Payment To'}
                  value={paymentFrom}
                  onChange={(e) => setPaymentFrom(e.target.value)}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Date"
                  type="date"
                  value={date.toISOString().substring(0, 10)}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Account</em>
                    </MenuItem>
                    {accounts.map((acc) => (
                      <MenuItem key={acc.accountId} value={acc.accountId}>
                        {acc.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Category</InputLabel>
                  <Select
                    value={paymentCategory}
                    label="Payment Category"
                    onChange={(e) => setPaymentCategory(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select Category</em>
                    </MenuItem>
                    {paymentCategories.map((category) => (
                      <MenuItem key={category._id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {isAddingCategory ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TextField
                      fullWidth
                      label="New Category Name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button variant="outlined" onClick={handleAddCategory} sx={{ ml: 1 }}>
                      Add
                    </Button>
                  </Box>
                ) : (
                  <Button onClick={() => setIsAddingCategory(true)} sx={{ mt: 1 }} variant="text">
                    + Add Category
                  </Button>
                )}
                <TextField
                  margin="normal"
                  fullWidth
                  multiline
                  rows={3}
                  label="Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleAddTransaction} variant="outlined" fullWidth disabled={loading}>
            {loading
              ? 'Adding...'
              : modalType === 'transfer'
              ? 'Add Transfer'
              : 'Add Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
