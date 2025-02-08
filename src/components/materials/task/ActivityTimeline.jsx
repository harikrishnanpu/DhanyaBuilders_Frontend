// src/components/Tasks/ActivityTimeline.jsx
import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export default function ActivityTimeline({ activities }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Activity Timeline
      </Typography>
      <List>
        {activities.map((act) => (
          <ListItem key={act.id} sx={{ borderBottom: '1px solid #eee' }}>
            <ListItemText
              primary={act.description}
              secondary={new Date(act.timestamp).toLocaleString()}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
