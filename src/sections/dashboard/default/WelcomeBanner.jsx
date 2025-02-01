// React & MUI imports
import React, { useState, useEffect, useRef } from 'react';
import { useTheme, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { keyframes } from '@mui/system';

// Project imports
import MainCard from 'components/MainCard';
import { ThemeMode } from 'config';

// Asset imports
import WelcomeImage from 'assets/images/analytics/welcome-banner.png';
import cardBack from 'assets/images/widget/img-dropbox-bg.svg';
import api from 'pages/api';

// Define pulse animation
const glitterEffect = keyframes`
  0% { background-color: rgba(255, 0, 0, 0.8); box-shadow: 0 0 5px rgba(255, 0, 0, 0.6), inset 0 0 2px rgba(255, 255, 255, 0.3); }
  25% { background-color: rgba(255, 50, 0, 0.9); box-shadow: 0 0 10px rgba(255, 50, 0, 0.8), inset 0 0 4px rgba(255, 255, 255, 0.4); }
  50% { background-color: rgb(255, 0, 0); box-shadow: 0 0 15px rgba(255, 100, 0, 1), inset 0 0 6px rgba(255, 255, 255, 0.5); }
  75% { background-color: rgba(255, 50, 0, 0.9); box-shadow: 0 0 10px rgba(255, 50, 0, 0.8), inset 0 0 4px rgba(255, 255, 255, 0.4); }
  100% { background-color: rgba(255, 0, 0, 0.8); box-shadow: 0 0 5px rgba(255, 0, 0, 0.6), inset 0 0 2px rgba(255, 255, 255, 0.3); }
`;



// Styled component for the "New" badge
const NewBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 2,
  left: 2,
  padding: '6px 14px',
  borderRadius: '14px',
  color: theme.palette.common.white,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  fontSize: '12px',
  letterSpacing: '1px',
  backgroundColor: 'rgba(255, 0, 0, 0.8)',
  animation: `${glitterEffect} 1.2s infinite alternate ease-in-out`, // Faster, more lively effect
}));



export default function WelcomeBanner() {
  const theme = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);


  const timeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
  
    if (diffInSeconds < 60) return "Just now"; // Less than a minute
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`; // Less than an hour
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`; // Less than a day
    if (diffInSeconds < 172800) return "Yesterday"; // Less than 2 days
    return `${Math.floor(diffInSeconds / 86400)} days ago`; // More than 2 days
  };
  

  // Fetch announcements from API
  useEffect(() => {
    api
      .get('/api/announcements') // Update to your API
      .then((response) => {
        // Sort announcements by time descending to have the latest first
        const sortedAnnouncements = response.data.sort(
          (a, b) => new Date(b.time) - new Date(a.time)
        );
        setAnnouncements(sortedAnnouncements);
      })
      .catch((error) => {
        console.error('Error fetching announcements:', error);
      });
  }, []);

  // Auto-scroll logic (stops when manually clicked)
  useEffect(() => {
    if (announcements.length === 0 || isManual) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 6000); // 3 seconds interval

    return () => clearInterval(interval);
  }, [announcements, isManual]);

  // Progress bar logic
  useEffect(() => {
    if (isManual || announcements.length === 0) {
      setProgress(0);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(progressInterval.current);
          return 0;
        }
        const increment = 100 / (6000 / 100); // Increment per 100ms
        return Math.min(oldProgress + increment, 100);
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isManual, announcements.length]);

  // Manual Navigation via Dots
  const handleDotClick = (index) => {
    setIsManual(true); // Stop auto-scrolling when user interacts
    setCurrentIndex(index);
    setProgress(0);
    setTimeout(() => setIsManual(false), 4000); // Resume auto-scroll after 4 seconds
  };

  // Determine the latest announcement
  const latestAnnouncementId =
    announcements.length > 0 ? announcements[0]._id : null;

  return (
    <MainCard
      border={false}
      sx={{
        color: 'common.white',
        bgcolor:
          theme.palette.mode === ThemeMode.DARK
            ? 'primary.400'
            : 'primary.darker',
        position: 'relative',
        overflow: 'hidden',
        '&:after': {
          content: '""',
          background: `url("${cardBack}") 100% 100% / cover no-repeat`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          opacity: 0.5,
        },
      }}
    >
      <Grid container>
        {/* Left Section: Announcements */}
        <Grid item md={6} sm={6} xs={12}>
          <Stack
            spacing={2}
            sx={{ padding: 3, position: 'relative', zIndex: 2, height: '100%' }}
          >
            {/* Carousel Wrapper */}
            <Box
              ref={containerRef}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              {/* Announcements (Scrollable Effect) */}
              <Box
                sx={{
                  display: 'flex',
                  width: `${announcements.length * 100}%`,
                  transform: `translateX(-${currentIndex * 100}%)`,
                  transition: 'transform 0.6s ease-in-out',
                }}
              >
                {announcements.map((announcement, index) => (
                  <Box
                    key={announcement._id}
                    sx={{
                      minWidth: '100%',
                      paddingRight: 2,
                      position: 'relative',
                      paddingTop: latestAnnouncementId === announcement._id ? '40px' : '16px',
                    }}
                  >
                    {/* "New" Badge for the Latest Announcement */}
                    {announcement._id === latestAnnouncementId && (
                      <NewBadge>
                        New
                      </NewBadge>
                    )}

                    {/* Title & Message */}
                    <Typography
                      variant="h4"
                      color={theme.palette.background.paper}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {announcement.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color={theme.palette.background.paper}
                      sx={{ mt: 0.5 }}
                    >
                      {announcement.message}
                    </Typography>

                    {/* Time & Submitted By */}
                    <Typography variant="caption" color={theme.palette.background.paper}>
  {timeAgo(announcement.time)} - {announcement.submitted}
</Typography>


                    {/* Attachments (Buttons) */}
                    {announcement.attachments?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" spacing={1}>
                          {announcement.attachments.map((attachment, idx) => (
                            <Button
                              key={idx}
                              variant="outlined"
                              color="secondary"
                              href={attachment}
                              target="_blank"
                              sx={{
                                color: 'background.paper',
                                borderColor: theme.palette.background.paper,
                                '&:hover': {
                                  color: 'background.paper',
                                  borderColor: theme.palette.background.paper,
                                  bgcolor: 'primary.main',
                                },
                              }}
                            >
                              Attachment {idx + 1}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Custom Buttons */}
                    {announcement.buttons?.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" spacing={1}>
                          {announcement.buttons.map((btn, idx) => (
                            <Button
                              key={idx}
                              variant="contained"
                              color={btn.color || 'primary'}
                              href={`/${btn.url}`}
                              sx={{
                                textTransform: 'none',
                                boxShadow: 'none',
                                '&:hover': {
                                  boxShadow: 'none',
                                },
                              }}
                            >
                              {btn.text}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'white.500', // Background color
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'rgba(255, 235, 59, 0.7)', // Light yellow with transparency
                  },
                }}
              />
            </Box>

            {/* Clickable Carousel Dots */}
            {announcements.length > 1 && (
              <Stack direction="row" spacing={1} justifyContent="start" sx={{ pt: 1 }}>
                {announcements.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: idx === currentIndex ? 'rgba(239, 78, 78, 0.85)' : 'rgba(252, 252, 252, 0.85)', // Red for active, semi-transparent for inactive
                      transition: 'background-color 0.3s',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Stack>
            )}

            {/* Additional Text (Version Info) */}
            <Typography
              variant="h6"
              color={theme.palette.background.paper}
              sx={{ mt: 2 }}
            >
              Dhanya Builders 1.0.0
            </Typography>
          </Stack>
        </Grid>

        {/* Right Section: Welcome Image */}
        <Grid item md={6} sm={6} xs={12} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Stack
            sx={{ position: 'relative', pr: { sm: 3, md: 8 }, zIndex: 2, height: '100%' }}
            justifyContent="center"
            alignItems="flex-end"
          >
            <img src={WelcomeImage} alt="Welcome" width="200px" />
          </Stack>
        </Grid>
      </Grid>
    </MainCard>
  );
}
