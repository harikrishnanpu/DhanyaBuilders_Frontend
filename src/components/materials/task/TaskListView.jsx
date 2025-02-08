import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PriorityTag from './PrioritySections'; 
// ^ Adjust this import path if you have a different priority tag component 
//   or remove entirely if not needed.

export default function TaskListView({ tasks, onEdit, onDelete }) {
  if (!tasks || tasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No tasks found in list view.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <List>
        {tasks.map((task) => {
          const isCompleted = task.status === 'Completed';
          return (
            <ListItem key={task._id} divider alignItems="flex-start">
              {/* Checkbox to indicate completion (disabled for display only) */}
              <Checkbox disabled checked={isCompleted} />
              
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', gap: 1 }}>
                    {task.title}
                    {/* Priority Tag (optional) */}
                    {task.priority && <PriorityTag priority={task.priority} />}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography variant="body2">
                      Status: {task.status}
                    </Typography>
                    <Typography variant="body2">
                      Assigned To: {task.assignedTo || 'N/A'}
                    </Typography>
                  </>
                }
              />
              
              <ListItemSecondaryAction>
                <IconButton onClick={() => onEdit(task)} sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => onDelete(task._id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
