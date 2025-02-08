// src/components/materials/modals/AddReceiptModal.jsx
import React, { useState, useEffect } from 'react';
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

// Slide transition from bottom
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddReceiptModal = ({ projectId, onClose, material, open }) => {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState([]);
  const [showMaterialSearchModal, setShowMaterialSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // NOTE: We are keeping this as-is per your instructions.
  const { user: userInfo } = useAuth();

  useEffect(() => {
    if (material && material._id) {
      handleAddMaterial(material);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  // Add Material to Items
  const handleAddMaterial = (material) => {
    const existingItem = items.find(
      (item) => item.material._id === material.material._id
    );
    if (existingItem) {
      alert('Material already added.');
      return;
    }
    setItems([
      ...items,
      {
        material: material.material,
        quantity: material.approvedQuantity || 1,
        fromApprovedMaterial: true, // Flag to indicate approved material
      },
    ]);
  };

  // Handle Quantity Change
  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = Number(quantity);
    setItems(updatedItems);
  };

  // Submit Material Receipt
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

      await api.post(`/api/projects/project/add-receipt/${projectId}`, {
        date,
        items: formattedItems,
        userId: userInfo._id,
      });

      // Mark approved materials as received
      for (const item of items) {
        if (item.fromApprovedMaterial) {
          await api.put(
            `/api/projects/project/approved-materials/${projectId}/mark-received`,
            {
              materialId: item.material._id,
              quantityReceived: item.quantity,
            }
          );
        }
      }

      alert('Material receipt added.');
      onClose();
    } catch (error) {
      console.error('Error adding receipt:', error);
      alert(
        `Error adding receipt: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={onClose}
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
          <Typography variant="h6">Add Material Receipt</Typography>
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
        <DialogContent dividers>
          <Box component="form" noValidate>
            {/* Date */}
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />

            {/* Materials Items */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowMaterialSearchModal(true)}
              >
                + Add Material
              </Button>
              {items.map((item, index) => (
                <Box
                  key={item.material._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 2,
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
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleSubmit}
            variant="outlined"
            color="success"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Adding...' : 'Add Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Search Modal */}
      {showMaterialSearchModal && (
        <MaterialSearchModal
          open={showMaterialSearchModal}
          onAdd={(material) => {
            handleAddMaterial({ material, approvedQuantity: 0 });
            setShowMaterialSearchModal(false);
          }}
          onClose={() => setShowMaterialSearchModal(false)}
        />
      )}
    </>
  );
};

export default AddReceiptModal;
