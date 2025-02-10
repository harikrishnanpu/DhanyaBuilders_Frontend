import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

export default function CommentDrawer({ open, onClose, item, usageDocId, itemIndex }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // If your item already has comments, you can load them or fetch them from the server
  useEffect(() => {
    if (item.comments) {
      setComments(item.comments);
    }
  }, [item]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await api.post(
        `/api/projects/project/add-used/${usageDocId}/item/${itemIndex}/comments`,
        {
          text: newComment.trim(),
          authorId: user._id,
          authorName: user.name,
        }
      );
      // The server should return the updated comment array or the new comment
      setComments(response.data.comments); 
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await api.delete(
        `/api/projects/project/add-used/${usageDocId}/item/${itemIndex}/comments/${commentId}`
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment.');
    }
  };

  // Example edit function
  const handleEditComment = async (commentId) => {
    const newText = window.prompt('Edit your comment:');
    if (!newText) return;
    try {
      const response = await api.put(
        `/api/projects/project/add-used/${usageDocId}/item/${itemIndex}/comments/${commentId}`,
        { text: newText }
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment.');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320, p: 2 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Comments for {item.material.name}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ mb: 2 }}>
        {comments.map((c) => (
          <Box
            key={c._id}
            sx={{
              mb: 1,
              p: 1,
              border: '1px solid #ddd',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              <strong>{c.authorName || 'User'}:</strong> {c.text}
            </Typography>
            <Stack direction="row" spacing={1}>
              {c.authorId === user._id && (
                <>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleEditComment(c._id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    color="error"
                    onClick={() => handleDeleteComment(c._id)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        ))}
      </Box>

      <Box>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 1 }}
          onClick={handleAddComment}
        >
          Add
        </Button>
      </Box>
    </Drawer>
  );
}
