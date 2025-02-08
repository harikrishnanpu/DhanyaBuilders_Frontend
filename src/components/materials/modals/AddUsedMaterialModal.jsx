// src/components/materials/modals/AddUsedMaterialModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MaterialSearchModal from './MaterialSearchModal';
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

// Transition component to slide the modal from the bottom.
const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

const AddUsedMaterialModal = ({ projectId, date, onClose, open }) => {
  const [items, setItems] = useState([]);
  const [showMaterialSearchModal, setShowMaterialSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user: userInfo } = useAuth();

  // Add Material to Items
  const handleAddMaterial = (material) => {
    const existingItem = items.find(
      (item) => item.material._id === material._id
    );
    if (existingItem) {
      alert('Material already added.');
      return;
    }
    setItems([
      ...items,
      {
        material: material,
        quantity: 1,
      },
    ]);
  };

  // Handle Quantity Change
  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = Number(quantity);
    setItems(updatedItems);
  };

  // Submit Used Materials
  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('Please add at least one material.');
      return;
    }
    setLoading(true);
    try {
      const formattedItems = items.map((item) => ({
        material: item.material._id,
        quantity: item.quantity,
      }));

      await api.post(`/api/projects/project/add-used/${projectId}`, {
        date,
        items: formattedItems,
        userId: userInfo._id,
      });

      alert('Used materials added.');
      onClose();
    } catch (error) {
      console.error('Error adding used materials:', error);
      alert(
        `Error adding used materials: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
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
          <Typography variant="h6">Add Used Materials</Typography>
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
          {/* Date (read-only) */}
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={date.toISOString().substring(0, 10)}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
              sx={{
                backgroundColor: '#f5f5f5',
              }}
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
                  <Typography variant="body2">
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
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Used Materials'}
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

export default AddUsedMaterialModal;
