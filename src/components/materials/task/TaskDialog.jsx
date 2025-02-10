// src/components/Tasks/TaskDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  SwipeableDrawer,
  Tabs,
  Tab,
  Box,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import ReactQuill from 'react-quill';
import PriorityTag from './PrioritySections';
import ChecklistSection from './Checklist'; // Updated checklist component
import AttachmentsSection from './Attachement';
import CommentsSection from './Commentssections';
import TimeTrackingSection from './TimeTracking';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Verified', 'Denied', 'Re-do'];

export default function TaskDialog({ open, onClose, onSubmit, editingTaskData, onDelete }) {
  // Local state for tab index and task data
  const [tabIndex, setTabIndex] = useState(0);
  const [data, setData] = useState({
    title: editingTaskData?.title || '',
    description: editingTaskData?.description || '',
    status: editingTaskData?.status || 'Not Started',
    priority: editingTaskData?.priority || 'Low',
    startDateTime: editingTaskData?.startDateTime ? new Date(editingTaskData.startDateTime) : new Date(),
    endDateTime: editingTaskData?.endDateTime ? new Date(editingTaskData.endDateTime) : new Date(),
    checklist: editingTaskData?.checklist || [],
    attachments: editingTaskData?.attachments || [],
    comments: editingTaskData?.comments || [],
    timeSpent: editingTaskData?.timeSpent || 0,
    isRecurring: editingTaskData?.isRecurring || false,
    recurrenceRule: editingTaskData?.recurrenceRule || 'Every Monday',
  });

  // Update local state when editingTaskData changes
  useEffect(() => {
    setData({
      title: editingTaskData?.title || '',
      description: editingTaskData?.description || '',
      status: editingTaskData?.status || 'Not Started',
      priority: editingTaskData?.priority || 'Low',
      startDateTime: editingTaskData?.startDateTime ? new Date(editingTaskData.startDateTime) : new Date(),
      endDateTime: editingTaskData?.endDateTime ? new Date(editingTaskData.endDateTime) : new Date(),
      checklist: editingTaskData?.checklist || [],
      attachments: editingTaskData?.attachments || [],
      comments: editingTaskData?.comments || [],
      timeSpent: editingTaskData?.timeSpent || 0,
      isRecurring: editingTaskData?.isRecurring || false,
      recurrenceRule: editingTaskData?.recurrenceRule || 'Every Monday',
    });
  }, [editingTaskData]);

  const handleChangeTab = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleFieldChange = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Update checklist state from ChecklistSection
  const handleChecklistUpdate = (updatedList) => {
    setData((prev) => ({ ...prev, checklist: updatedList }));
  };

  const handleAttachmentsAdd = (file) => {
    const newAttachment = {
      id: Date.now().toString(),
      name: file.name,
    };
    setData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, newAttachment],
    }));
  };

  const handleAttachmentDelete = (id) => {
    setData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((att) => att.id !== id),
    }));
  };

  const handleCommentsAdd = (htmlText) => {
    const newComment = {
      _id: Date.now().toString(),
      text: htmlText,
      author: 'You',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      comments: [...prev.comments, newComment],
    }));
  };

  const handleCommentsDelete = (id) => {
    setData((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c._id !== id),
    }));
  };

  const handleTimeStop = (secs) => {
    // accumulate time
    setData((prev) => ({ ...prev, timeSpent: prev.timeSpent + secs }));
  };

  const handleSubmit = () => {
    onSubmit(data);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: { xs: '90vh', sm: '80vh' },
          overflow: 'visible',
        },
      }}
    >
      {/* Drag handle */}
      <Box
        sx={{
          width: 40,
          height: 4,
          backgroundColor: 'grey.400',
          borderRadius: 2,
          margin: '8px auto',
        }}
      />
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">
          {editingTaskData ? 'Edit Task' : 'Create Task'}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={handleChangeTab}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Details" />
        <Tab label="Checklist" />
        <Tab label="Attachments" />
        <Tab label="Comments" />
        <Tab label="Time Tracking" />
        <Tab label="Recurring" />
        <Tab label="Report/Export" />
      </Tabs>

      {/* Content Area */}
      <Box sx={{ px: 2, py: 1, overflowY: 'auto', flexGrow: 1, maxHeight: { xs: 'calc(90vh - 200px)', sm: 'calc(80vh - 200px)' } }}>
        {tabIndex === 0 && (
          <Box>
            <TextField
              label="Title"
              fullWidth
              margin="dense"
              value={data.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
            />
            <Box mt={2} mb={2}>
              <Typography variant="subtitle2">Description (Rich Text):</Typography>
              <ReactQuill
                value={data.description}
                onChange={(val) => handleFieldChange('description', val)}
                theme="snow"
              />
            </Box>
            <FormControl margin="dense" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={data.status}
                label="Status"
                onChange={(e) => handleFieldChange('status', e.target.value)}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl margin="dense" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={data.priority}
                label="Priority"
                onChange={(e) => handleFieldChange('priority', e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p} value={p}>
                    <PriorityTag priority={p} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Date & Time"
                value={data.startDateTime}
                onChange={(newVal) => handleFieldChange('startDateTime', newVal)}
                renderInput={(params) => <TextField margin="dense" fullWidth {...params} />}
              />
              <DateTimePicker
                label="End Date & Time"
                value={data.endDateTime}
                onChange={(newVal) => handleFieldChange('endDateTime', newVal)}
                renderInput={(params) => <TextField margin="dense" fullWidth {...params} />}
              />
            </LocalizationProvider>
          </Box>
        )}

        {tabIndex === 1 && (
          <ChecklistSection
            taskId={editingTaskData?._id} // Pass taskId if editing an existing task
            checklist={data.checklist}
            setChecklist={handleChecklistUpdate}
          />
        )}

        {tabIndex === 2 && (
          <AttachmentsSection
            attachments={data.attachments}
            onAddAttachment={handleAttachmentsAdd}
            onDeleteAttachment={handleAttachmentDelete}
          />
        )}

        {tabIndex === 3 && (
          <CommentsSection
            comments={data.comments}
            onAddComment={handleCommentsAdd}
            onDeleteComment={handleCommentsDelete}
          />
        )}

        {tabIndex === 4 && (
          <Box>
            <TimeTrackingSection initialSeconds={0} onStop={handleTimeStop} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Total Time Spent: {data.timeSpent} seconds
            </Typography>
          </Box>
        )}

        {tabIndex === 5 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Recurring Tasks
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Recurring</InputLabel>
              <Select
                value={data.isRecurring}
                label="Recurring"
                onChange={(e) => handleFieldChange('isRecurring', e.target.value)}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
            {data.isRecurring && (
              <TextField
                label="Recurrence Rule"
                margin="dense"
                fullWidth
                value={data.recurrenceRule}
                onChange={(e) => handleFieldChange('recurrenceRule', e.target.value)}
              />
            )}
          </Box>
        )}

        {tabIndex === 6 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Reporting / Export
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              (Placeholder) Here you could generate reports, export tasks to CSV, or integrate with analytics.
            </Typography>
            <Button variant="outlined">Export Task</Button>
          </Box>
        )}
      </Box>

      {/* Actions */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {editingTaskData && (
          <Button color="error" onClick={() => onDelete(editingTaskData._id)}>
            Delete
          </Button>
        )}
        <Button onClick={onClose} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button variant="outlined" onClick={handleSubmit}>
          {editingTaskData ? 'Update' : 'Create'}
        </Button>
      </Box>
    </SwipeableDrawer>
  );
}
