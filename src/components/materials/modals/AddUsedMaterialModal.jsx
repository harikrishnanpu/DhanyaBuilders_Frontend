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

// Slide transition from bottom.
const Transition = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

export default function AddUsedMaterialModal({ projectId, date, onClose, open }) {
  const [items, setItems] = useState([]);
  const [showMaterialSearchModal, setShowMaterialSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user: userInfo } = useAuth();

  // Add Material to Items
  const handleAddMaterial = (mat) => {
    // Check if it's already added
    const existing = items.find((i) => i.material._id === mat._id);
    if (existing) {
      alert('Material already added.');
      return;
    }
    setItems([...items, { material: mat, quantity: 1 }]);
  };

  // Quantity changed
  const handleQuantityChange = (idx, val) => {
    const updated = [...items];
    updated[idx].quantity = Number(val);
    setItems(updated);
  };

  // Remove an item
  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Submit used materials
  const handleSubmit = async () => {
    if (!items.length) {
      alert('Please add at least one material.');
      return;
    }
    setLoading(true);
    try {
      const formattedItems = items.map((it) => ({
        material: it.material._id,
        quantity: it.quantity,
      }));
      await api.post(`/api/projects/project/add-used/${projectId}`, {
        date,
        items: formattedItems,
        userId: userInfo._id,
      });
      alert('Used materials added successfully.');
      onClose();
    } catch (err) {
      console.error('Error adding used materials:', err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
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
            />
          </Box>

          {/* Items */}
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Materials
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setShowMaterialSearchModal(true)}
            sx={{ mb: 2 }}
          >
            + Add Material
          </Button>

          {items.map((it, idx) => (
            <Box
              key={it.material._id}
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
                  {it.material.name} ({it.material.unit})
                </Typography>
              </Box>
              <TextField
                type="number"
                label="Qty"
                value={it.quantity}
                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                size="small"
                sx={{ width: 80, mr: 1 }}
              />
              <Button variant="text" color="error" onClick={() => handleRemoveItem(idx)}>
                Remove
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            color="success"
            fullWidth
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Adding...' : 'Add Used Materials'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Search */}
      {showMaterialSearchModal && (
        <MaterialSearchModal
          open={showMaterialSearchModal}
          onAdd={(selected) => {
            handleAddMaterial(selected);
            setShowMaterialSearchModal(false);
          }}
          onClose={() => setShowMaterialSearchModal(false)}
        />
      )}
    </>
  );
}
