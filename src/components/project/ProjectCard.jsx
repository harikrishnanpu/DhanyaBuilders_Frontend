import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  // Destructure properties from the project object.
  // Adjust the names if your API/model uses different names.
  const {
    _id,
    name,
    image,
    customerName,      // Using "customerName" as in your model.
    startDate,
    estimatedEndDate,  // Using "estimatedEndDate" from your model.
    description,
    transactions,      // Expecting an array of transaction objects.
    progress           // Expecting an array of progress items.
  } = project || {};

  // Format the dates if available.
  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString()
    : 'N/A';
  const formattedEndDate = estimatedEndDate
    ? new Date(estimatedEndDate).toLocaleDateString()
    : 'N/A';

  // Compute transaction totals (assumes each transaction has a type and amount).
  const totalIn = transactions
    ? transactions
        .filter((tx) => tx.type === 'in')
        .reduce((sum, tx) => sum + tx.amount, 0)
    : 0;
  const totalOut = transactions
    ? transactions
        .filter((tx) => tx.type === 'out')
        .reduce((sum, tx) => sum + tx.amount, 0)
    : 0;

  // Compute overall main project progress.
  // This computes the average percentage across all progress items.
  const mainProgress =
    progress && progress.length > 0
      ? Math.round(
          progress.reduce((sum, item) => sum + (item.percentage || 0), 0) /
            progress.length
        )
      : 0;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'row', // Always horizontal—even on mobile.
        mb: 2,
        boxShadow: 2,
        borderRadius: 2,
        overflow: 'hidden',
        height: 150,
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/project/${_id}`)}
    >
      {/* Left: Project Image or Placeholder */}
      {image ? (
        <CardMedia
          component="img"
          image={image}
          alt={name}
          sx={{
            width: 150,
            height: 150,
            objectFit: 'cover'
          }}
        />
      ) : (
        <Box
          sx={{
            width: 150,
            height: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.300'
          }}
        >
          <Typography variant="subtitle1">{name || 'No Image'}</Typography>
        </Box>
      )}

      {/* Right: Project Details */}
      <CardContent sx={{ flex: 1, p: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {name || 'Unnamed Project'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Customer: {customerName || 'N/A'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {`Start: ${formattedStartDate} — End: ${formattedEndDate}`}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}

        {/* Transactions Totals */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Typography variant="body2" sx={{ color: 'green' }}>
            In: {totalIn}
          </Typography>
          <Typography variant="body2" sx={{ color: 'red' }}>
            Out: {totalOut}
          </Typography>
        </Box>

        {/* Main Project Progress */}
        <Box sx={{ mt: 1}}>
            <Box>
          <Typography variant="caption" color="text.secondary">
            Progress: {mainProgress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={mainProgress}
            sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
            />
          </Box>
        </Box>

        {/* View Project Button */}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
