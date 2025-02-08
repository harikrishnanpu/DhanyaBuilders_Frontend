import React, { useState } from 'react';
import { 
  Tabs,
  Tab,
  Box,
  Paper,
  styled,
  Fab,
  useTheme
} from '@mui/material';
import {
  Add,
  Inventory2,
  Assignment,
  MoveToInbox,
  Build
} from '@mui/icons-material';
import InventoryTab from '../materials/InventoryTab';
import RequestsTab from '../materials/RequestsTab';
import ReceivedTab from '../materials/ReceivedTab';
import UsedTab from '../materials/UsedTab';
import AddRequestModal from './modals/AddRequestModal';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    height: 4,
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: theme.typography.fontWeightMedium,
  minHeight: 48,
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const tabData = [
  { value: 'inventory', label: 'Inventory', icon: <Inventory2 /> },
  { value: 'requests', label: 'Requests', icon: <Assignment /> },
  { value: 'received', label: 'Received', icon: <MoveToInbox /> },
  { value: 'used', label: 'Used', icon: <Build /> },
];

export default function MaterialsSection({ projectId }) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [openAddRequestModal, setOpenAddRequestModal] = useState(false);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <InventoryTab projectId={projectId} />;
      case 'requests':
        return <RequestsTab projectId={projectId} />;
      case 'received':
        return <ReceivedTab projectId={projectId} />;
      case 'used':
        return <UsedTab projectId={projectId} />;
      default:
        return <InventoryTab projectId={projectId} />;
    }
  };

  const handleFabClick = () => {
    if (activeTab === 'requests') {
      setOpenAddRequestModal(true);
    } else {
      console.log('Add action not implemented for this tab:', activeTab);
    }
  };

  return (
    <Box
    >
      <Paper square sx={{ p: 2, borderTopRightRadius: 2, borderTopLeftRadius: 2 }}>
        <Box >
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabData.map((tab) => (
              <StyledTab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
              />
            ))}
          </StyledTabs>
        </Box>
      </Paper>

      <Box sx={{ marginTop: 2}}>
        {renderTabContent()}
      </Box>

      <Fab
        color="primary"
        sx={{ 
          position: 'fixed',
          bottom: theme.spacing(3),
          right: theme.spacing(3)
        }}
        onClick={handleFabClick}
      >
        <Add />
      </Fab>

      {/* Conditionally render the AddRequestModal only if the Requests tab is active */}
      {activeTab === 'requests' && (
        <AddRequestModal
          projectId={projectId}
          open={openAddRequestModal}
          onClose={() => setOpenAddRequestModal(false)}
        />
      )}
    </Box>
  );
}
