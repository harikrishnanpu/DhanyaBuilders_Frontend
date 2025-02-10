import React, { useState, useEffect } from 'react';
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

// Slide the modal from the right side
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
});

/**
 * ApproveRequestModal
 * 
 * Allows the user to set an approved quantity for a single item, 
 * ensuring it is between 0 and the total requested quantity.
 */
const ApproveRequestModal = ({ projectId, item, onClose, open }) => {
  if (!item) return null;

  // Local state for the item’s approved quantity
  const [approvedQuantity, setApprovedQuantity] = useState(
    item.approvedQuantity ?? item.quantity
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset when the item changes
    setApprovedQuantity(item.approvedQuantity ?? item.quantity);
  }, [item]);

  // Ensure the approved quantity stays between 0 and item.quantity
  const handleChange = (value) => {
    const qty = Math.max(0, Math.min(Number(value), item.quantity));
    setApprovedQuantity(qty);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const rejectedQuantity = item.quantity - approvedQuantity;
      let status = 'Partially Approved';
      if (approvedQuantity === 0) status = 'Rejected';
      if (approvedQuantity === item.quantity) status = 'Approved';

      const approvalData = {
        items: [
          {
            materialId: item.material._id,
            requestedQuantity: item.quantity,
            approvedQuantity,
            rejectedQuantity,
            status,
          },
        ],
      };

      // Call the same "approve" endpoint with updated item data
      const response = await api.put(
        `/api/projects/project/materials/requests/${item.request_id}/approve`,
        approvalData
      );

      if (response.status === 404) {
        alert('Material request not found.');
      } else {
        alert('Approval updated successfully.');
        onClose();
      }
    } catch (error) {
      console.error('Error approving item:', error);
      alert('Failed to submit approval');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      fullWidth
      maxWidth="sm"
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
          Approve / Update Item: {item.material.name}
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
        <Typography variant="subtitle2" gutterBottom>
          Request ID: {item.requestId}
        </Typography>
        <Typography variant="body2">
          Material: {item.material.name} ({item.material.unit})
        </Typography>
        <Typography variant="body2">
          Requested: {item.quantity}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ mr: 1 }}>
            Approved Quantity:
          </Typography>
          <TextField
            type="number"
            size="small"
            value={approvedQuantity}
            onChange={(e) => handleChange(e.target.value)}
            inputProps={{ min: 0, max: item.quantity }}
            sx={{ width: 100 }}
          />
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
          {loading ? 'Submitting...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApproveRequestModal;
