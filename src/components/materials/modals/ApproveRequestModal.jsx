// src/components/materials/modals/ApproveRequestModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from 'pages/api';

// Transition component to slide the modal from the bottom.
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
});

const ApproveRequestModal = ({ projectId, request, onClose, open }) => {
  const [items, setItems] = useState(
    request?.items?.map((item) => ({
      ...item,
      approvedQuantity: item.quantity,
    })) || []
  );
  const [loading, setLoading] = useState(false);

  // Handle quantity change ensuring approvedQuantity is between 0 and requested quantity.
  const handleQuantityChange = (index, value) => {
    const updatedItems = [...items];
    const approvedQuantity = Math.max(
      0,
      Math.min(Number(value), updatedItems[index].quantity)
    );
    updatedItems[index].approvedQuantity = approvedQuantity;
    setItems(updatedItems);
  };

  // Submit the approval data to the server.
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const approvalData = {
        items: items.map((item) => {
          const approvedQuantity = item.approvedQuantity;
          const rejectedQuantity = item.quantity - approvedQuantity;

          return {
            materialId: item.material._id,
            requestedQuantity: item.quantity,
            approvedQuantity: approvedQuantity,
            rejectedQuantity: rejectedQuantity,
            status:
              approvedQuantity === item.quantity
                ? 'Approved'
                : approvedQuantity === 0
                ? 'Rejected'
                : 'Partially Approved',
          };
        }),
      };

      const response = await api.put(
        `/api/projects/project/materials/requests/${request.requestId}/approve`,
        approvalData
      );
      if (response.status === 404) {
        alert('Material request not found.');
      } else {
        alert('Request approved successfully.');
        onClose();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('An error occurred while approving the request.');
    } finally {
      setLoading(false);
    }
  };

  // If there is no request, do not render anything.
  if (!request) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      fullWidth
      maxWidth="sm"
      // Position the modal at the bottom with rounded top corners.
      PaperProps={{
        style: {
          margin: 0,
          position: 'absolute',
          bottom: 0,
          borderRadius: '8px 8px 0 0',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Typography variant="h6">
          Approve Request {request.requestId}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption">
            Date: {new Date(request.date).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" sx={{ ml: 2 }}>
            Supervisor: {request.supervisor?.name || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Items:
          </Typography>
          {items.map((item, index) => (
            <Box
              key={item.material._id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2">
                  {item.material.name} ({item.material.unit}) - Requested:{' '}
                  {item.quantity}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  Approve:
                </Typography>
                <TextField
                  type="number"
                  inputProps={{ min: 0, max: item.quantity }}
                  value={item.approvedQuantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  size="small"
                  sx={{ width: 80 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleSubmit}
          variant="outlined"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? 'Approving...' : 'Approve Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveRequestModal;
