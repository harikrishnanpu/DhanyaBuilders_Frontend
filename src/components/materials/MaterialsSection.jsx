import React, { useState } from 'react';
import { 
  Tabs,
  Tab,
  Box,
  Paper,
  styled,
  Fab,
  useTheme,
  useMediaQuery,
  Container
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
  // Determine if the current viewport is small (mobile)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    <Container maxWidth="md">
      <Box>
        <Paper 
          sx={{ 
            borderTopRightRadius: 2, 
            borderTopLeftRadius: 2,
            // Responsive padding adjustment if needed
            p: isMobile ? 1 : 2 
          }}
        >
          <Box>
            <StyledTabs
              value={activeTab}
              onChange={handleTabChange}
              // Use scrollable tabs on mobile for a better UX, fullWidth on larger screens.
              variant={isMobile ? "scrollable" : "fullWidth"}
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

        <Box sx={{ marginTop: 2 }}>
          {renderTabContent()}
        </Box>

        <Fab
          color="primary"
          // Adjust FAB size based on screen size
          size={isMobile ? "medium" : "large"}
          sx={{ 
            position: 'fixed',
            // Adjust spacing from the screen edges responsively
            bottom: isMobile ? theme.spacing(2) : theme.spacing(3),
            right: isMobile ? theme.spacing(2) : theme.spacing(3)
          }}
          onClick={handleFabClick}
        >
          <Add />
        </Fab>

        {activeTab === 'requests' && (
          <AddRequestModal
            projectId={projectId}
            open={openAddRequestModal}
            onClose={() => setOpenAddRequestModal(false)}
          />
        )}
      </Box>
    </Container>
  );
}
