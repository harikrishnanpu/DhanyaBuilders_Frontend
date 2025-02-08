// src/components/Tasks/TimeTrackingSection.jsx
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

export default function TimeTrackingSection({ initialSeconds = 0, onStop }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let timer;
    if (running) {
      timer = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [running]);

  const handleStartStop = () => {
    if (running) {
      setRunning(false);
      onStop && onStop(seconds);
    } else {
      setRunning(true);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="body1">Time: {formatTime(seconds)}</Typography>
      <Button variant="outlined" onClick={handleStartStop}>
        {running ? 'Stop' : 'Start'}
      </Button>
    </Box>
  );
}
