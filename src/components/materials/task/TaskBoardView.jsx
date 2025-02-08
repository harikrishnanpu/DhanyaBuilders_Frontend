// src/components/Tasks/task/TaskBoardView.jsx
import React from 'react';
import { 
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  ToggleButtonGroup
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Edit,
  Delete,
  MoreVert,
  Person,
  Schedule,
  Label
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const statusColumns = [
  { id: 'todo', title: 'To Do', color: '#4a9dff' },
  { id: 'in_progress', title: 'In Progress', color: '#ffb74d' },
  { id: 'review', title: 'Review', color: '#9575cd' },
  { id: 'done', title: 'Done', color: '#81c784' },
];

const ScrollContainer = styled(Box)({
  display: 'flex',
  overflowX: 'auto',
  padding: '16px 8px',
  gap: '24px',
  minHeight: '70vh',
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '4px',
  },
});

const ColumnHeader = styled(Paper)(({ color }) => ({
  padding: '12px 16px',
  marginBottom: '16px',
  backgroundColor: color,
  color: 'white',
  borderRadius: '8px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const TaskCard = styled(Paper)(({ theme, isselected }) => ({
  marginBottom: '16px',
  borderRadius: '8px',
  boxShadow: theme.shadows[2],
  transition: 'all 0.2s ease',
  border: `2px solid ${isselected === 'true' ? theme.palette.primary.main : 'transparent'}`,
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: 'none',
  ...draggableStyle,
  transform: isDragging ? 'rotate(3deg)' : draggableStyle.transform,
});

export default function TaskBoardView({
  tasks,
  onEdit,
  onDelete,
  onSelect,
  selectedTasks,
}) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    // Handle task reordering logic here
    // You would typically update the task status based on the destination column
    // and update your state/API accordingly
  };

  const getTasksByStatus = (status) => 
    tasks.filter(task => task.status === status);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ScrollContainer>
        {statusColumns.map((column) => (
          <Box key={column.id} sx={{ minWidth: 320, flexShrink: 0 }}>
            <ColumnHeader color={column.color}>
              <Typography variant="subtitle1" fontWeight={600}>
                {column.title}
              </Typography>
              <Chip 
                label={getTasksByStatus(column.id).length} 
                size="small" 
                sx={{ bgcolor: 'white', color: column.color }} 
              />
            </ColumnHeader>

            <Droppable droppableId={column.id}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ minHeight: 100 }}
                >
                  {getTasksByStatus(column.id).map((task, index) => (
                    <Draggable 
                      key={task._id} 
                      draggableId={task._id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <TaskCard
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}
                          isselected={selectedTasks.includes(task._id).toString()}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              onSelect(task._id);
                            } else {
                              // Handle single click action if needed
                            }
                          }}
                        >
                          <CardContent>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="subtitle2">
                                  {task.title}
                                </Typography>
                                <IconButton size="small" onClick={() => onEdit(task)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Stack>

                              {task.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {task.description.substring(0, 60)}...
                                </Typography>
                              )}

                              {task.dueDate && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Schedule fontSize="small" color="action" />
                                  <Typography variant="caption">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </Typography>
                                </Stack>
                              )}

                              {task.assignees?.length > 0 && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Person fontSize="small" color="action" />
                                  <Stack direction="row" spacing={-1}>
                                    {task.assignees.map((assignee, idx) => (
                                      <Avatar 
                                        key={idx} 
                                        sx={{ width: 24, height:24, fontSize: 12 }}
                                        src={assignee.avatar}
                                      >
                                        {assignee.name.charAt(0)}
                                      </Avatar>
                                    ))}
                                  </Stack>
                                </Stack>
                              )}

                              {task.tags?.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {task.tags.map((tag, idx) => (
                                    <Chip
                                      key={idx}
                                      label={tag}
                                      size="small"
                                      icon={<Label fontSize="small" />}
                                      sx={{ 
                                        bgcolor: '#e8f4ff', 
                                        borderRadius: 1,
                                        mt: 0.5,
                                      }}
                                    />
                                  ))}
                                </Stack>
                              )}

                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <IconButton 
                                  size="small" 
                                  onClick={() => onDelete(task._id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                                <IconButton size="small">
                                  <MoreVert fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </TaskCard>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Box>
        ))}
      </ScrollContainer>
    </DragDropContext>
  );
}