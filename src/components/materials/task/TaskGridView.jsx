// src/components/Tasks/TaskGridView.jsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';
import PriorityTag from './PrioritySections';

function TaskCard({ task, index, onEdit, onDelete }) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card
            sx={{
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              boxShadow: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                {task.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PriorityTag priority={task.priority || 'Low'} />
                {task.assignedTo && (
                  <Chip label={`Assigned: ${task.assignedTo}`} size="small" color="primary" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Status: {task.status}
              </Typography>
              {task.dueDate && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Progress: {task.progress || 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={task.progress || 0}
                  sx={{
                    height: 8,
                    borderRadius: 2,
                  }}
                />
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
              <Button size="small" onClick={() => onEdit(task)}>
                Edit
              </Button>
              <Button size="small" color="error" onClick={() => onDelete(task._id)}>
                Delete
              </Button>
            </CardActions>
          </Card>
        </Grid>
      )}
    </Draggable>
  );
}

export default function TaskGridView({ tasks, onDragEnd, onEdit, onDelete }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="taskGrid" direction="horizontal">
        {(provided) => (
          <Grid
            container
            spacing={2}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </Grid>
        )}
      </Droppable>
    </DragDropContext>
  );
}
