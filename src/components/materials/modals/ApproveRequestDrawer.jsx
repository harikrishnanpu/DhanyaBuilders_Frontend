import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  Stack,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ApproveRequestDrawer = ({ open, onClose, request, onApprove }) => {
  const [approvedItems, setApprovedItems] = useState([]);

  useEffect(() => {
    if (request && request.items) {
      setApprovedItems(
        request.items.map((item) => ({
          ...item,
          approvedQuantity: item.quantity,
        }))
      );
    }
  }, [request]);
  

  const handleApprovedQuantityChange = (index, value) => {
    setApprovedItems((prev) => {
      const updated = [...prev];
      updated[index].approvedQuantity = Number(value); // Ensure it's a number
      return updated;
    });
  };
  

  const handleApprove = () => {
    const finalApprovedItems = approvedItems.map((item) => ({
      materialId: item.material._id, // Ensure correct field name
      approvedQuantity: Number(item.approvedQuantity), // Convert to number
    }));
  
    onApprove(request, finalApprovedItems);
  };
  

  if (!request) {
    return null;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400 } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Approve Request
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Request Info & Items */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Request ID: {request.requestId}
        </Typography>

        {approvedItems.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {item.material.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requested: {item.quantity} {item.material.unit}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 1, alignItems: 'center' }}
            >
              <TextField
                label="Approved Quantity"
                type="number"
                size="small"
                value={item.approvedQuantity}
                onChange={(e) =>
                  handleApprovedQuantityChange(index, e.target.value)
                }
                inputProps={{ min: 0 }}
                sx={{ width: 120 }}
              />
              <Typography variant="body2">{item.material.unit}</Typography>
            </Stack>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Footer Actions */}
      <Stack direction="row" spacing={2} sx={{ p: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outlined" onClick={handleApprove}>
          Approve
        </Button>
      </Stack>
    </Drawer>
  );
};

export default ApproveRequestDrawer;
