// src/components/Tasks/TaskFilters.jsx
import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Button
} from '@mui/material';

const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];

export default function TaskFilters({ onFilterChange }) {
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');

  const handleApplyFilters = () => {
    onFilterChange({
      searchText,
      status,
      priority,
    });
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: 'column', sm: 'row' }}
      gap={2}
      mb={2}
      alignItems="center"
    >
      <TextField
        label="Search"
        variant="outlined"
        size="small"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Not Started">Not Started</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Verified">Verified</MenuItem>
          <MenuItem value="Denied">Denied</MenuItem>
          <MenuItem value="Re-do">Re-do</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={handleApplyFilters}>
        Apply
      </Button>
    </Box>
  );
}
