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

  // Auth info (assuming a custom hook returns user info)
  const { user: userInfo } = useAuth();

  // If a single "approved material" is passed, automatically add it to items
  useEffect(() => {
    if (material && material._id) {
      handleAddMaterial(material);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  // Add a material to the list (either from "Approved Materials" or the search modal)
  const handleAddMaterial = (mat) => {
    // If already present, skip
    const exists = items.find(
      (itm) => itm.material._id === mat.material._id
    );
    if (exists) {
      alert('Material already added.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        material: mat.material,
        quantity: mat.approvedQuantity || 1, // default quantity
        fromApprovedMaterial: !!mat.approvedQuantity,
      },
    ]);
  };

  // Handle quantity changes
  const handleQuantityChange = (index, quantity) => {
    const updated = [...items];
    updated[index].quantity = Number(quantity) || 1;
    setItems(updated);
  };

  // Submit the final receipt
  const handleSubmit = async () => {
    if (!date) {
      alert('Please select a date for the receipt.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one material.');
      return;
    }

    setLoading(true);
    try {
      // Prepare items for submission
      const formattedItems = items.map((item) => ({
        material: item.material._id,
        quantity: item.quantity,
      }));

      // 1) Create the new receipt
      await api.post(`/api/projects/project/add-receipt/${projectId}`, {
        date,
        items: formattedItems,
        userId: userInfo?._id,
      });

      // 2) If some items came from approved materials, mark them as received
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

      alert('Material receipt added successfully.');
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
            boxShadow: 'none',
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
            {/* Date Field */}
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              margin="normal"
            />

            {/* Items List */}
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
                    border: `1px solid #ccc`,
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
                      setItems((prev) => prev.filter((_, i) => i !== index))
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
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Adding...' : 'Add Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal to search for new materials (not pre-approved) */}
      {showMaterialSearchModal && (
        <MaterialSearchModal
          open={showMaterialSearchModal}
          onAdd={(foundMaterial) => {
            // "foundMaterial" might just have "material" property
            handleAddMaterial({ material: foundMaterial, approvedQuantity: 0 });
            setShowMaterialSearchModal(false);
          }}
          onClose={() => setShowMaterialSearchModal(false)}
        />
      )}
    </>
  );
};

export default AddReceiptModal;
