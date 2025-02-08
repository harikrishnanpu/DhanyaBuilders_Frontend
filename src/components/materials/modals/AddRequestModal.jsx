// src/components/materials/modals/AddRequestModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Slide,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MaterialSearchModal from './MaterialsSearchModal';
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

// Transition component to slide the modal from the bottom.
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddRequestModal = ({ projectId, onClose, open }) => {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState([]);
  const [showMaterialSearchModal, setShowMaterialSearchModal] = useState(false);

  const { user: userInfo } = useAuth();

  // Add Material to Items
  const handleAddMaterial = (material) => {
    const existingItem = items.find((item) => item.material._id === material._id);
    if (existingItem) {
      alert('Material already added.');
      return;
    }
    setItems([...items, { material, quantity: 1 }]);
  };

  // Handle Quantity Change
  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    setItems(updatedItems);
  };

  // Submit Material Request
  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('Please add at least one material.');
      return;
    }
    try {
      if (userInfo) {
        await api.post(`/api/projects/materials/${projectId}`, {
          date,
          items: items.map((item) => ({
            material: item.material._id,
            name: item.material.name,
            unit: item.material.unit,
            quantity: item.quantity,
            status: 'Pending',
          })),
          userId: userInfo._id,
        });
        alert('Material request submitted.');
      } else {
        alert('User not found');
      }
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        keepMounted
        fullWidth
        maxWidth="sm"
        // Position the modal at the bottom.
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
          <Typography variant="h6">Add Material Request</Typography>
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
          {/* Date Input */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          </Box>

          {/* Materials Items */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Materials
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowMaterialSearchModal(true)}
              sx={{ mb: 2 }}
            >
              + Add Material
            </Button>
            {items.map((item, index) => (
              <Box
                key={item.material._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  p: 1,
                  border: '1px solid #ccc',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    {item.material.name} ({item.material.unit})
                  </Typography>
                </Box>
                <TextField
                  type="number"
                  label="Qty"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                  size="small"
                  sx={{ width: 80, mr: 1 }}
                />
                <Button
                  variant="text"
                  color="error"
                  onClick={() =>
                    setItems(items.filter((_, idx) => idx !== index))
                  }
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleSubmit}
            variant="outlined"
            color="success"
            fullWidth
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Search Modal */}
      {showMaterialSearchModal && (
        <MaterialSearchModal
          open={showMaterialSearchModal}
          onAdd={(material) => {
            handleAddMaterial(material);
            setShowMaterialSearchModal(false);
          }}
          onClose={() => setShowMaterialSearchModal(false)}
        />
      )}
    </>
  );
};

export default AddRequestModal;
