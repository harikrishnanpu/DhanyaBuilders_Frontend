// src/components/Tasks/ChecklistSection.jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  List,
  ListItem,
  Checkbox,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import api from 'pages/api';

export default function ChecklistSection({ taskId, checklist, setChecklist }) {
  // Local state for adding a new checklist item
  const [newItemText, setNewItemText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(checklist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setChecklist(items);
  };

  // Toggle the "done" state of an item
  const toggleItem = (index) => {
    const items = [...checklist];
    items[index].done = !items[index].done;
    setChecklist(items);
  };

  // Toggle editing mode for a checklist item
  const toggleEdit = (index, isEditing) => {
    const items = [...checklist];
    items[index].editing = isEditing;
    setChecklist(items);
  };

  // Update the text of a checklist item while editing
  const updateItemText = (index, newText) => {
    const items = [...checklist];
    items[index].text = newText;
    setChecklist(items);
  };

  // Save the edit (exit editing mode)
  const handleSaveEdit = (index) => {
    toggleEdit(index, false);
  };

  // Delete a checklist item
  const handleDeleteItem = (index) => {
    const items = [...checklist];
    items.splice(index, 1);
    setChecklist(items);
  };

  // Add a new checklist item
  const handleAddItem = () => {
    if (newItemText.trim() === '') return;
    const newItem = {
      id: `${Date.now()}`, // simple unique ID based on timestamp
      text: newItemText,
      done: false,
      editing: false,
    };
    setChecklist([...checklist, newItem]);
    setNewItemText('');
  };

  // Persist the current checklist to the backend
  const saveChecklist = async () => {
    setSaving(true);
    try {
      // Assuming your API endpoint is /api/tasks/:id/checklist
      const response = await api.put(`/api/projects/${taskId}/checklist`, {
        checklist,
      });
      // Optionally update local checklist state with response data:
      setChecklist(response.data.checklist);
      setMessage('Checklist saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving checklist:', error);
      setMessage('Error saving checklist.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* New Item Input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextField
          label="New Checklist Item"
          variant="outlined"
          size="small"
          fullWidth
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddItem}>
          Add
        </Button>
      </Box>

      {/* Checklist List with Drag-and-Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklistDroppable">
          {(provided) => (
            <List
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ width: '100%', bgcolor: 'background.paper' }}
            >
              {checklist.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(providedDrag) => (
                    <ListItem
                      ref={providedDrag.innerRef}
                      {...providedDrag.draggableProps}
                      {...providedDrag.dragHandleProps}
                      sx={{
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Checkbox
                        checked={item.done}
                        onClick={() => toggleItem(idx)}
                      />
                      {item.editing ? (
                        <TextField
                          value={item.text}
                          onChange={(e) =>
                            updateItemText(idx, e.target.value)
                          }
                          variant="standard"
                          fullWidth
                        />
                      ) : (
                        <ListItemText
                          primary={item.text}
                          onClick={() => toggleItem(idx)}
                        />
                      )}
                      {item.editing ? (
                        <>
                          <IconButton
                            onClick={() => handleSaveEdit(idx)}
                            size="small"
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => toggleEdit(idx, false)}
                            size="small"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => toggleEdit(idx, true)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteItem(idx)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      {/* Save Button and Message */}
    </Box>
  );
}
