// src/components/materials/modals/MaterialSearchModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  IconButton,
  Slide,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from 'pages/api';

// Transition component to slide the modal from the bottom.
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const MaterialSearchModal = ({ onAdd, onClose, open }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');

  const units = [
    'nos',
    'kg',
    'bags',
    'cft',
    'tonne',
    'brass',
    'litre',
    'sqft',
    'km',
    'meter',
    'box',
    'ft',
    'cum',
    'mm',
    'sqm',
    'gram',
    // ... add more units as needed
  ];

  const searchMaterials = async () => {
    try {
      const response = await api.get('/api/projects/project/searchMaterial', {
        params: { query: searchQuery },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error('Error searching materials:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchMaterials();
    } else {
      setMaterials([]);
    }
  }, [searchQuery]);

  const handleAddNewMaterial = async () => {
    if (!newMaterialName || !newMaterialUnit) {
      alert('Please enter material name and unit.');
      return;
    }
    try {
      const response = await api.post('/api/projects/material/add', {
        name: newMaterialName,
        unit: newMaterialUnit,
      });
      onAdd(response.data.material);
      setShowAddMaterialForm(false);
      setNewMaterialName('');
      setNewMaterialUnit('');
      onClose();
    } catch (error) {
      console.error('Error adding new material:', error);
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
      // Adjust the Paper component style so the modal appears at the bottom.
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
        <Typography variant="h6">Add Material</Typography>
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
        {/* Search Input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search material..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          margin="normal"
        />

        {/* Search Results */}
        {materials.map((material) => (
          <Box
            key={material._id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #ccc',
              py: 1,
            }}
          >
            <Typography variant="body1">
              {material.name} ({material.unit})
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                onAdd(material);
                onClose();
              }}
            >
              Add
            </Button>
          </Box>
        ))}

        {/* Add New Material */}
        <Box sx={{ mt: 2 }}>
          {!showAddMaterialForm ? (
            <Button
              variant="text"
              color="primary"
              onClick={() => setShowAddMaterialForm(true)}
            >
              + Add New Material
            </Button>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Material Name"
                variant="outlined"
                fullWidth
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel id="unit-label">Unit</InputLabel>
                <Select
                  labelId="unit-label"
                  label="Unit"
                  value={newMaterialUnit}
                  onChange={(e) => setNewMaterialUnit(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Unit</em>
                  </MenuItem>
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                color="success"
                onClick={handleAddNewMaterial}
              >
                Add Material
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialSearchModal;
