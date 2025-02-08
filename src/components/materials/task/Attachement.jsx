// src/components/Tasks/AttachmentsSection.jsx
import React, { useState } from 'react';
import { Box, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function AttachmentsSection({ attachments, onAddAttachment, onDeleteAttachment }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    // Placeholder: in real usage, you'd do an API upload or store the file in state
    onAddAttachment(selectedFile);
    setSelectedFile(null);
  };

  return (
    <Box>
      <List>
        {attachments.map((att) => (
          <ListItem key={att.id}>
            <ListItemText primary={att.name || att.fileName} />
            <IconButton onClick={() => onDeleteAttachment(att.id)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Box mt={2}>
        <input type="file" onChange={handleFileChange} />
        <Button variant="contained" sx={{ ml: 1 }} onClick={handleUpload}>
          Upload
        </Button>
      </Box>
    </Box>
  );
}
