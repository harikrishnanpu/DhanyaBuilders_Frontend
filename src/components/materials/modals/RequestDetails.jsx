import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import { format } from 'date-fns';

// Define status colors that match the ones used in your RequestsTab component.
const statusColors = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  'Partially Approved': 'info',
  Revoked: 'default'
};

const RequestDetails = ({ request }) => {
  if (!request) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Header section with Request ID, Status, and Created Date */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" component="span">
            Request ID:
          </Typography>
          <Typography variant="body1" component="span">
            {request.requestId}
          </Typography>
          <Chip
            label={request.status}
            color={statusColors[request.status] || 'default'}
            size="small"
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Created on: {format(new Date(request.createdAt), 'dd MMM yyyy, h:mm a')}
        </Typography>

        <Divider />

        {/* Materials requested */}
        <Box>
          <Typography variant="subtitle1">Materials Requested:</Typography>
          {request.items && request.items.length > 0 ? (
            <List disablePadding>
              {request.items.map((item, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemText
                    primary={`${item.material.name} (${item.quantity} ${item.material.unit})`}
                    secondary={item.description || null}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No materials requested.
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

RequestDetails.propTypes = {
  request: PropTypes.shape({
    requestId: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        material: PropTypes.shape({
          name: PropTypes.string.isRequired,
          unit: PropTypes.string.isRequired
        }).isRequired,
        quantity: PropTypes.number.isRequired,
        description: PropTypes.string
      })
    )
  })
};

export default RequestDetails;
