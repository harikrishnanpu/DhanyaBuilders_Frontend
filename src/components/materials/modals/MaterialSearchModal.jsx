// src/components/materials/modals/MaterialSearchModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from 'pages/api';

const MaterialSearchModal = ({ onAdd, onClose, open }) => {
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Fetch materials from the server
  const fetchMaterials = async () => {
    try {
      const response = await api.get('/api/projects/project/material');
      setMaterials(response.data);
      setSuggestions(response.data); // Initialize suggestions with all materials
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  // Fetch materials when the component mounts
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Update suggestions as the search term changes
  useEffect(() => {
    if (searchTerm) {
      setSuggestions(
        materials.filter((material) =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setSuggestions(materials);
    }
  }, [searchTerm, materials]);

  // Add material to receipt and close modal
  const handleAddMaterial = (material) => {
    onAdd(material);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
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
        <Typography variant="h6">Select Material</Typography>
        <IconButton
          onClick={onClose}
          aria-label="close"
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
        {/* Search Input */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          margin="normal"
        />

        {/* Suggestions List */}
        {suggestions.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
            No materials found
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <List>
              {suggestions.map((material) => (
                <ListItem
                  key={material._id}
                  button
                  onClick={() => handleAddMaterial(material)}
                >
                  <ListItemText
                    primary={`${material.name} (${material.unit})`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MaterialSearchModal;
