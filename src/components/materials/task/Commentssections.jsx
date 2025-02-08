// src/components/Tasks/CommentsSection.jsx
import React, { useState } from 'react';
import { Box, Button, List, ListItem, Avatar, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function CommentsSection({ comments, onAddComment, onDeleteComment }) {
  const [value, setValue] = useState('');

  const handlePost = () => {
    if (!value.trim()) return;
    onAddComment(value);
    setValue('');
  };

  return (
    <Box>
      <List>
        {comments.map((c) => (
          <ListItem key={c._id} alignItems="flex-start" sx={{ borderBottom: '1px solid #eee' }}>
            <Avatar sx={{ mr: 2 }}>{c.author?.charAt(0)?.toUpperCase() || 'U'}</Avatar>
            <ListItemText
              primary={
                <div
                  dangerouslySetInnerHTML={{ __html: c.text }}
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              }
              secondary={`By: ${c.author} | ${new Date(c.createdAt).toLocaleString()}`}
            />
            <IconButton onClick={() => onDeleteComment(c._id)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Box mt={2}>
        <ReactQuill value={value} onChange={setValue} placeholder="Type @ to mention someone..." />
        <Button variant="contained" sx={{ mt: 1 }} onClick={handlePost}>
          Post
        </Button>
      </Box>
    </Box>
  );
}
