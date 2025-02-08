// src/components/Tasks/PriorityTagSystem.jsx
import React from 'react';
import { Chip } from '@mui/material';

export default function PriorityTag({ priority }) {
  let color = 'default';
  switch (priority) {
    case 'Low':
      color = 'success';
      break;
    case 'Medium':
      color = 'primary';
      break;
    case 'High':
      color = 'warning';
      break;
    case 'Critical':
      color = 'error';
      break;
    default:
      break;
  }
  return <Chip label={priority} color={color} size="small" />;
}
