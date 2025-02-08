// DailyTransactions.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  Typography,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { Bank } from 'iconsax-react';
import api from '../api';
import useAuth from 'hooks/useAuth';
import { useGetMenuMaster } from 'api/menu';

const DailyTransactions = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { menuMaster } = useGetMenuMaster();

  // ------------------------------
  // STATE VARIABLES
  // ------------------------------
  // API data arrays
  const [transactions, setTransactions] = useState([]);
  const [billings, setBillings] = useState([]);
  const [billingPayments, setBillingPayments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [transportPayments, setTransportPayments] = useState([]);
  const [projectTransactions, setProjectTransactions] = useState([]); // New project transactions

  // Categories & Accounts
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Loading, error & success messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Date filters
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // Tab: all, in, out, transfer
  const [activeTab, setActiveTab] = useState('all');

  // Totals
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);

  // Modal (Add Transaction)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('in'); // "in", "out", or "transfer"
  const [transactionData, setTransactionData] = useState({
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
    amount: '',
    paymentFrom: '',
    paymentTo: '',
    category: '',
    method: '',
    remark: '',
    billId: '',
    purchaseId: '',
    transportId: '',
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Additional filters & sorting (for merging transactions)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');

  // Collapsible filters panel (inside component)
  const [showFilters, setShowFilters] = useState(false);
  const toggleFilters = () => setShowFilters((prev) => !prev);

  // (Optional) local sidebar open/close (if needed)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // ------------------------------
  // API FETCH FUNCTIONS
  // ------------------------------
  const fetchCategories = async () => {
    try {
      const catRes = await api.get('/api/daily/transactions/categories');
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        catRes,
        dailyTransRes,
        billingRes,
        customerPayRes,
        purchaseRes,
        transportRes,
        projectTransRes,
      ] = await Promise.all([
        api.get('/api/daily/transactions/categories'),
        api.get('/api/daily/transactions', { params: { fromDate, toDate } }),
        api.get('/api/daily/allbill/payments', { params: { fromDate, toDate } }),
        api.get('/api/customer/daily/payments', { params: { fromDate, toDate } }),
        api.get('/api/seller/daily/payments', { params: { fromDate, toDate } }),
        api.get('/api/transportpayments/daily/payments', { params: { fromDate, toDate } }),
        api.get('/api/projects/project/all-transactions', { params: { fromDate, toDate } }),
      ]);

      // Process responses
      const { billingsRes: billingData, payments: billingPaymentsData, otherExpenses: expenseData } = billingRes.data;
      const customerPaymentsData = customerPayRes.data;
      const dailyTransWithSource = dailyTransRes.data.map((t) => ({ ...t, source: 'daily' }));

      setTransactions(dailyTransWithSource);
      setBillings(billingData);
      setBillingPayments(billingPaymentsData);
      setCustomerPayments(
        customerPaymentsData.flatMap((customer) =>
          (customer.payments || []).map((p, index) => ({
            ...p,
            source: 'customerPayment',
            paymentFrom: customer.customerName,
            _id: p._id || `customer-payment-${customer.customerId}-${index}`,
          }))
        )
      );
      setOtherExpenses(
        expenseData.map((exp, index) => ({
          ...exp,
          source: 'expense',
          _id: exp._id || `expense-${index}`,
        }))
      );
      setPurchasePayments(
        purchaseRes.data.flatMap((seller) =>
          (seller.payments || []).map((p, index) => ({
            ...p,
            source: 'purchasePayment',
            sellerName: seller.sellerName,
            _id: p._id || `purchase-${seller.sellerId}-${index}`,
          }))
        )
      );
      setTransportPayments(
        transportRes.data.flatMap((transport) =>
          (transport.payments || []).map((p, index) => ({
            ...p,
            source: 'transportPayment',
            transportName: transport.transportName,
            _id: p._id || `transport-${transport.transportId}-${index}`,
          }))
        )
      );
      setProjectTransactions(projectTransRes.data);

      setCategories(catRes.data);

      // Calculate totals including project transactions
      calculateTotals(
        dailyTransWithSource,
        billingPaymentsData,
        expenseData,
        customerPaymentsData.flatMap((customer) => customer.payments || []),
        purchaseRes.data.flatMap((seller) => seller.payments || []),
        transportRes.data.flatMap((transport) => transport.payments || []),
        projectTransRes.data
      );
    } catch (err) {
      setError('Failed to fetch transactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const accountsRes = await api.get('/api/accounts/allaccounts');
      setAccounts(accountsRes.data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  // ------------------------------
  // SUCCESS MODAL TIMEOUT
  // ------------------------------
  useEffect(() => {
    let timer;
    if (openSuccess) {
      timer = setTimeout(() => {
        setOpenSuccess(false);
        setSuccessMessage('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [openSuccess]);

  // ------------------------------
  // ACTION HANDLERS
  // ------------------------------
  const handleGenerateReport = async () => {
    try {
      const reportParams = {
        fromDate,
        toDate,
        activeTab,
        filterCategory,
        filterMethod,
        searchQuery,
        sortOption,
      };
      const reportData = allTransactions;
      const response = await api.post(
        '/api/print/daily/generate-report',
        { reportData, reportParams },
        { headers: { 'Content-Type': 'application/json' }, responseType: 'text' }
      );
      const reportWindow = window.open('', '_blank', 'width=1200,height=800');
      if (reportWindow) {
        reportWindow.document.write(response.data);
        reportWindow.document.close();
      } else {
        setError('Unable to open popup window. Please allow popups for this website.');
      }
    } catch (err) {
      setError('Failed to generate report.');
      console.error(err);
    }
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const openModal = (type) => {
    setModalType(type);
    setTransactionData({
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
      amount: '',
      paymentFrom: '',
      paymentTo: '',
      category: '',
      method: '',
      remark: '',
      billId: '',
      purchaseId: '',
      transportId: '',
    });
    setNewCategoryName('');
    setShowAddCategory(false);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isNaN(transactionData.amount) || parseFloat(transactionData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (modalType === 'in' && !transactionData.paymentFrom.trim()) {
      setError('Please enter a payment source.');
      return;
    }
    if (modalType === 'out' && !transactionData.paymentTo.trim()) {
      setError('Please enter a payment destination.');
      return;
    }
    if (modalType === 'transfer') {
      if (!transactionData.paymentFrom.trim() || !transactionData.paymentTo.trim()) {
        setError('Please select both payment source and destination.');
        return;
      }
      if (transactionData.paymentFrom.trim() === transactionData.paymentTo.trim()) {
        setError('Payment source and destination cannot be the same.');
        return;
      }
    }
    if (!transactionData.category.trim() && !newCategoryName.trim()) {
      setError('Please select or enter a category.');
      return;
    }
    if (!transactionData.method.trim()) {
      setError('Please select a payment method.');
      return;
    }
    try {
      if (showAddCategory) {
        if (!newCategoryName.trim()) {
          setError('Please enter a new category name.');
          return;
        }
        const categoryRes = await api.post('/api/daily/transactions/categories', {
          name: newCategoryName.trim(),
        });
        setCategories([...categories, categoryRes.data]);
        setTransactionData({ ...transactionData, category: categoryRes.data.name });
      }
      const payload = { ...transactionData, type: modalType, userId: userInfo._id };
      if (modalType === 'transfer') {
        await api.post('/api/daily/trans/transfer', payload);
      } else if (transactionData.category === 'Purchase Payment') {
        await api.post('/api/purchases/purchases/payments', payload);
      } else if (transactionData.category === 'Transport Payment') {
        await api.post('/api/transport/payments', payload);
      } else {
        await api.post('/api/daily/transactions', payload);
      }
      setSuccessMessage('Transaction added successfully!');
      setOpenSuccess(true);
      closeModal();
      fetchTransactions();
    } catch (err) {
      setError('Failed to add transaction.');
      console.error(err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    try {
      const response = await api.post('/api/daily/transactions/categories', {
        name: newCategoryName.trim(),
      });
      setCategories([...categories, response.data]);
      setTransactionData({ ...transactionData, category: response.data.name });
      setShowAddCategory(false);
      setNewCategoryName('');
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message || 'Error adding category.');
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  const handleAddNewCategoryToggle = () => {
    setShowAddCategory(!showAddCategory);
    setNewCategoryName('');
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.delete(`/api/daily/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      setError('Failed to delete transaction.');
      console.error(err);
    }
  };

  // ------------------------------
  // MERGE, FILTER & SORT TRANSACTIONS
  // ------------------------------
  const allTransactions = useMemo(() => {
    let mainFiltered = [];
  
    if (activeTab === 'all') {
      mainFiltered = [...transactions];
    } else if (activeTab === 'in') {
      mainFiltered = transactions.filter((t) => t.type === 'in'); // Exclude transfers
    } else if (activeTab === 'out') {
      mainFiltered = transactions.filter((t) => t.type === 'out'); // Exclude transfers
    } else if (activeTab === 'transfer') {
      mainFiltered = transactions.filter((t) => t.type === 'transfer');
    }
  
    let billingPaymentsFormatted = [];
    let customerPaymentsFormatted = [];
    let expenses = [];
    let pPayments = [];
    let tPayments = [];
    let projectTransFormatted = [];
  
    if (activeTab === 'all' || activeTab === 'in') {
      billingPaymentsFormatted = billingPayments.map((payment, index) => ({
        _id: payment._id || `billing-payment-${index}`,
        date: payment.date,
        amount: payment.amount,
        paymentFrom: payment.paymentFrom || 'Unknown Customer',
        category: 'Billing Payment',
        method: payment.method || 'cash',
        remark: payment.remark || `Payment Received: ${payment.invoiceNo}`,
        type: 'in',
        source: 'billingPayment',
      }));
    }
  
    if (activeTab === 'all' || activeTab === 'in') {
      customerPaymentsFormatted = customerPayments.map((payment) => ({
        ...payment,
        type: 'in',
        category: payment.category || 'Customer Payment',
        method: payment.method || 'cash',
      }));
    }
  
    if (activeTab === 'all' || activeTab === 'out') {
      expenses = otherExpenses.map((expense) => ({
        ...expense,
        type: 'out',
        paymentTo: 'Other Expense',
        category: 'Other Expense',
        method: expense.method || 'cash',
        remark: expense.remark || 'Additional expense',
      }));
    }
  
    if (activeTab === 'all' || activeTab === 'out') {
      pPayments = purchasePayments.map((payment) => ({
        ...payment,
        type: 'out',
        paymentTo: payment.sellerName || 'Vendor',
        category: payment.category || 'Purchase Payment',
        method: payment.method || 'cash',
        remark: payment.remark || 'Payment towards purchase',
      }));
    }
  
    if (activeTab === 'all' || activeTab === 'out') {
      tPayments = transportPayments.map((payment) => ({
        ...payment,
        type: 'out',
        paymentTo: payment.transportName || 'Transporter',
        category: payment.category || 'Transport Payment',
        method: payment.method || 'cash',
        remark: payment.remark || 'Payment towards transport',
      }));
    }
  
    if (activeTab === 'all' || activeTab === 'transfer') {
      projectTransFormatted = projectTransactions
        .filter((t) => t.type === 'transfer') // Only include transfers for 'all' & 'transfer'
        .map((t) => ({
          _id: t._id,
          date: t.date,
          amount: t.amount,
          type: t.type,
          paymentFrom: t.paymentFrom,
          paymentTo: t.paymentMethod, 
          category: t.paymentCategory || 'Project Transaction',
          remark: t.remarks,
          source: 'projectTransaction',
        }));
    }
  
    let combined = [
      ...mainFiltered,
      ...billingPaymentsFormatted,
      ...customerPaymentsFormatted,
      ...expenses,
      ...pPayments,
      ...tPayments,
      ...projectTransFormatted, // Only in 'all' and 'transfer'
    ];
  
    const uniqueMap = new Map();
    combined.forEach((item) => {
      if (!uniqueMap.has(item._id)) uniqueMap.set(item._id, item);
    });
  
    let filtered = [...uniqueMap.values()];
  
    if (filterCategory) {
      filtered = filtered.filter(
        (t) => t.category && t.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }
  
    if (filterMethod) {
      filtered = filtered.filter(
        (t) => t.method && t.method.toLowerCase() === filterMethod.toLowerCase()
      );
    }
  
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.paymentFrom && t.paymentFrom.toLowerCase().includes(q)) ||
          (t.paymentTo && t.paymentTo.toLowerCase().includes(q)) ||
          (t.remark && t.remark.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }
  
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const amountA = parseFloat(a.amount) || 0;
      const amountB = parseFloat(b.amount) || 0;
  
      switch (sortOption) {
        case 'date_desc':
          return dateB - dateA;
        case 'date_asc':
          return dateA - dateB;
        case 'amount_asc':
          return amountA - amountB;
        case 'amount_desc':
          return amountB - amountA;
        default:
          return dateB - dateA;
      }
    });
  
    return filtered;
  }, [
    transactions,
    billingPayments,
    customerPayments,
    otherExpenses,
    purchasePayments,
    transportPayments,
    projectTransactions,
    activeTab,
    searchQuery,
    filterCategory,
    filterMethod,
    sortOption,
  ]);
  

  // Prepare rows for DataGrid (each row must have an id property)
  const rows = allTransactions.map((item) => ({ ...item, id: item._id }));

  // ------------------------------
  // TOTALS CALCULATION (including project transactions)
  // ------------------------------
  const calculateTotals = (
    transactionsData,
    billingPaymentsData,
    expenseData,
    customerPaymentsData,
    purchasePaymentsData,
    transportPaymentsData,
    projectTransData
  ) => {
    let totalInAmount = 0;
    let totalOutAmount = 0;
    let totalTransferAmount = 0;

    // Daily transactions (in/out/transfer)
    transactionsData.forEach((trans) => {
      const amt = parseFloat(trans.amount) || 0;
      if (trans.type === 'in') totalInAmount += amt;
      else if (trans.type === 'out') totalOutAmount += amt;
      else if (trans.type === 'transfer') totalTransferAmount += amt;
    });
    // Billing Payments (in)
    billingPaymentsData.forEach((payment) => {
      totalInAmount += parseFloat(payment.amount) || 0;
    });
    // Customer Payments (in)
    customerPaymentsData.forEach((payment) => {
      totalInAmount += parseFloat(payment.amount) || 0;
    });
    // Other Expenses (out)
    expenseData.forEach((expense) => {
      totalOutAmount += parseFloat(expense.amount) || 0;
    });
    // Purchase Payments (out)
    purchasePaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });
    // Transport Payments (out)
    transportPaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });
    // Project Transactions
    projectTransData.forEach((trans) => {
      const amt = parseFloat(trans.amount) || 0;
      if (trans.type === 'in') totalInAmount += amt;
      else if (trans.type === 'out') totalOutAmount += amt;
      else if (trans.type === 'transfer') totalTransferAmount += amt;
    });

    setTotalIn(Number(totalInAmount.toFixed(2)));
    setTotalOut(Number(totalOutAmount.toFixed(2)));
    setTotalTransfer(Number(totalTransferAmount.toFixed(2)));
  };

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2, boxSizing: 'border-box' }}>
      {/* Top Action Bar */}

      {/* Collapsible Filters Panel */}
      <Collapse in={showFilters} timeout="auto" unmountOnExit>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 150px' }}
            />
            <TextField
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 150px' }}
            />
            <FormControl sx={{ flex: '1 1 150px' }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label="Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {categories.map((cat, index) => (
                  <MenuItem key={index} value={cat.name}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: '1 1 150px' }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={filterMethod}
                label="Method"
                onChange={(e) => setFilterMethod(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {accounts.map((acc, index) => (
                  <MenuItem key={index} value={acc.accountId}>{acc.accountName}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: '1 1 150px' }}
            />
            <FormControl sx={{ flex: '1 1 150px' }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortOption}
                label="Sort By"
                onChange={(e) => setSortOption(e.target.value)}
              >
                <MenuItem value="date_desc">Date (Latest First)</MenuItem>
                <MenuItem value="date_asc">Date (Oldest First)</MenuItem>
                <MenuItem value="amount_asc">Amount (Low to High)</MenuItem>
                <MenuItem value="amount_desc">Amount (High to Low)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button variant="outlined" onClick={fetchTransactions}>
              Apply Filters
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setFromDate(today);
                setToDate(today);
                setFilterCategory('');
                setFilterMethod('');
                setSearchQuery('');
              }}
            >
              Reset
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Tabs for Payment Type */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newVal) => handleTabChange(newVal)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Payments" value="all" />
          <Tab label="Payment In" value="in" />
          <Tab label="Payment Out" value="out" />
          <Tab label="Transfer" value="transfer" />
        </Tabs>
      </Paper>

      {/* Totals */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2">Payment In</Typography>
          <Typography variant="h6" color="green">₹ {totalIn.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2">Payment Out</Typography>
          <Typography variant="h6" color="red">₹ {totalOut.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2">Total Transfers</Typography>
          <Typography variant="h6" color="blue">₹ {totalTransfer.toFixed(2)}</Typography>
        </Paper>
      </Box>

      {/* Transactions Data Table */}
      <Paper sx={{ flex: 1, p: 2, mb: 10, height: 'calc(100% - 400px)' }}>
        {loading ? (
          <Typography variant="h6" align="center">Loading...</Typography>
        ) : allTransactions.length === 0 ? (
          <Typography variant="body2" align="center" color="textSecondary">
            No transactions found for the selected criteria.
          </Typography>
        ) : (
          <DataGrid
          rows={rows}
          columns={[
            {
              field: 'date',
              headerName: 'Date',
              width: 160,
              renderCell: (params) => new Date(params.value).toLocaleString(),
            },
            { field: 'category', headerName: 'Category', width: 150 },
            {
              field: 'paymentFrom',
              headerName: 'From',
              width: 150,
              renderCell: (params) => {
                // Look up the account name based on the accountId from the "accounts" array
                const account = accounts.find(acc => acc.accountId === params.value);
                return account ? account.accountName : params.value;
              },
            },
            {
              field: 'paymentTo',
              headerName: 'To',
              width: 150,
              renderCell: (params) => {
                // Look up the account name based on the accountId from the "accounts" array
                const account = accounts.find(acc => acc.accountId === params.value);
                return account ? account.accountName : params.value;
              },
            },
            {
              field: 'amount',
              headerName: 'Amount',
              width: 120,
              renderCell: (params) => (
                <Typography
                  color={
                    params.row.type === 'in'
                      ? 'green'
                      : params.row.type === 'out'
                      ? 'red'
                      : 'blue'
                  }
                >
                  {params.row.type === 'in'
                    ? `+₹${parseFloat(params.value).toFixed(2)}`
                    : params.row.type === 'out'
                    ? `-₹${parseFloat(params.value).toFixed(2)}`
                    : `₹${parseFloat(params.value).toFixed(2)}`}
                </Typography>
              ),
            },
            { field: 'remark', headerName: 'Remark', width: 200 },
            {
              field: 'actions',
              headerName: 'Actions',
              width: 100,
              sortable: false,
              renderCell: (params) => {
                return params.row.source === 'daily' ? (
                  <IconButton color="error" onClick={() => handleDeleteTransaction(params.row._id)}>
                    <DeleteIcon />
                  </IconButton>
                ) : null;
              },
            },
          ]}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          disableSelectionOnClick
          autoHeight
          sx={{ border: 0, '& .MuiDataGrid-cell': { py: 1 } }}
        />
        
        )}
      </Paper>

      {/* Fixed Bottom Actions Bar */}
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
          onClick={() => openModal('in')}
          variant="outlined"
          color="success"
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
          title="Add Payment In"
        >
          +
        </Button>
        <Button
          onClick={() => openModal('transfer')}
          variant="outlined"
          color="primary"
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
          title="Transfer Between Accounts"
        >
          <Bank />
        </Button>
        <Button
          onClick={() => openModal('out')}
          variant="outlined"
          color="error"
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
          title="Add Payment Out"
        >
          –
        </Button>
        <Button
          onClick={handleGenerateReport}
          variant="outlined"
          color="secondary"
          sx={{ minWidth: 56, minHeight: 58, borderRadius: '50%' }}
          title="Generate Report"
        >
          <FileDownloadIcon />
        </Button>
      </Box>

      {/* Add Transaction Modal */}
      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {modalType === 'in'
            ? 'Add Payment In'
            : modalType === 'out'
            ? 'Add Payment Out'
            : 'Transfer Between Accounts'}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleTransactionSubmit} sx={{ mt: 1 }}>
            <TextField
              label="Date & Time"
              type="datetime-local"
              fullWidth
              value={transactionData.date}
              onChange={(e) =>
                setTransactionData({ ...transactionData, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              required
            />
            {(modalType === 'in' || modalType === 'transfer') && (
              <TextField
                label="Payment From"
                fullWidth
                value={transactionData.paymentFrom}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, paymentFrom: e.target.value })
                }
                sx={{ mb: 2 }}
                required
              />
            )}
            {(modalType === 'out' || modalType === 'transfer') && (
              <TextField
                label="Payment To"
                fullWidth
                value={transactionData.paymentTo}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, paymentTo: e.target.value })
                }
                sx={{ mb: 2 }}
                required
              />
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              {!showAddCategory ? (
                <Select
                  value={transactionData.category}
                  label="Category"
                  onChange={(e) => {
                    if (e.target.value === 'add_new_category') {
                      setShowAddCategory(true);
                    } else {
                      setTransactionData({ ...transactionData, category: e.target.value });
                    }
                  }}
                  required
                >
                  <MenuItem value="">
                    <em>Select Category</em>
                  </MenuItem>
                  {categories.map((cat, index) => (
                    <MenuItem key={index} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="add_new_category">Add New Category</MenuItem>
                </Select>
              ) : (
                <Box>
                  <TextField
                    label="New Category"
                    fullWidth
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button variant="outlined" onClick={handleAddCategory}>
                    Save Category
                  </Button>
                </Box>
              )}
            </FormControl>
            {modalType === 'out' && transactionData.category === 'Purchase Payment' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Purchase</InputLabel>
                <Select
                  value={transactionData.purchaseId || ''}
                  label="Purchase"
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, purchaseId: e.target.value })
                  }
                  required
                >
                  <MenuItem value="">
                    <em>Select Purchase</em>
                  </MenuItem>
                  {purchasePayments.map((purchase, index) => (
                    <MenuItem key={index} value={purchase._id}>
                      {purchase.invoiceNo} - {purchase.sellerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {modalType === 'out' && transactionData.category === 'Transport Payment' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Transport</InputLabel>
                <Select
                  value={transactionData.transportId || ''}
                  label="Transport"
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, transportId: e.target.value })
                  }
                  required
                >
                  <MenuItem value="">
                    <em>Select Transport</em>
                  </MenuItem>
                  {transportPayments.map((transport, index) => (
                    <MenuItem key={index} value={transport._id}>
                      {transport.transportName} - {new Date(transport.transportDate).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={transactionData.amount}
              onChange={(e) =>
                setTransactionData({ ...transactionData, amount: e.target.value })
              }
              inputProps={{ min: '0.01', step: '0.01' }}
              sx={{ mb: 2 }}
              required
              placeholder="Enter amount in Rs."
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={transactionData.method}
                label="Payment Method"
                onChange={(e) =>
                  setTransactionData({ ...transactionData, method: e.target.value })
                }
                required
              >
                <MenuItem value="">
                  <em>Select Method</em>
                </MenuItem>
                {accounts.map((account, index) => (
                  <MenuItem key={index} value={account.accountId}>
                    {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Remark"
              fullWidth
              multiline
              rows={3}
              value={transactionData.remark}
              onChange={(e) =>
                setTransactionData({ ...transactionData, remark: e.target.value })
              }
              sx={{ mb: 2 }}
              placeholder="Optional remarks"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="secondary">Cancel</Button>
          <Button onClick={handleTransactionSubmit} variant="outlined" color="primary">
            Add Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars for Error and Success */}
      <Snackbar open={Boolean(error)} autoHideDuration={3000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      <Snackbar open={openSuccess} autoHideDuration={3000} onClose={() => setOpenSuccess(false)}>
        <Alert severity="success" onClose={() => setOpenSuccess(false)}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DailyTransactions;
