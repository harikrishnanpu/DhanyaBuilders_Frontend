import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import ReactPlayer from 'react-player';

// MUI
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  IconButton as MuiIconButton,
  CircularProgress,
  Drawer,
  Button,
  TextField,
  Stack,
  Typography,
  Snackbar,
  Alert,
  useMediaQuery
} from '@mui/material';

// Third-party
import api from 'pages/api';        // Your Axios instance
import useAuth from 'hooks/useAuth'; // Must provide user object

// Icons
import {
  Send,
  Paperclip,
  InfoCircle,
  Microphone2,
  Stop
} from 'iconsax-react';
import { isMobile } from 'react-device-detect';

// Cloudinary constants
const IMAGE_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload';
const VIDEO_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dqniuczkg/video/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// ---------- Styled Wrappers ----------
const ChatWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  width: '100%',
  height: '100%',
  position: 'relative'
}));

const CardContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)', // Adjust if your nav is a different height
  width: '100%',
}));

const Header = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1)
}));

const MessagesContainer = styled('div')(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  // Smooth scrolling if you like
  scrollBehavior: 'smooth'
}));

const InputContainer = styled('div')(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5)
}));

// ---------- Main Component ----------
export default function ProjectChat({ projectId }) {
  const { user } = useAuth(); // e.g. { _id, name, role }
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down('md')); // For the info drawer

  // Basic states
  const [projectName, setProjectName] = useState('Project');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Socket
  const socketServerUrl = 'https://web-production-9e20.up.railway.app/'; // or your URL
  const socketRef = useRef(null);

  // Audio Recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Typing Indicator
  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState(null);

  // Right Info Drawer
  const [infoOpen, setInfoOpen] = useState(false);

  // Error handling
  const [error, setError] = useState(null);

  // For auto-scroll
  const messagesEndRef = useRef(null);

  // 1) On mount if user & project
  useEffect(() => {
    if (user && projectId) {
      fetchProjectInfo();
      fetchMessages();
      initSocket();
    }
  }, [user, projectId]);

  // 2) Auto-scroll messages when they change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ---------- API Calls ----------
  async function fetchProjectInfo() {
    try {
      // Example: Get project name from your route
      const resp = await api.get(`/api/projects/${projectId}/chat`);
      if (resp.data.name) setProjectName(resp.data.name);
    } catch (err) {
      console.error('fetchProjectInfo error:', err);
    }
  }

  async function fetchMessages() {
    try {
      const resp = await api.get(`/api/projects/${projectId}/chat`);
      setMessages(resp.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    }
  }

  // ---------- Socket.io ----------
  function initSocket() {
    socketRef.current = io(socketServerUrl, { transports: ['websocket'] });

    // Join group chat
    socketRef.current.emit('joinProject', { projectId, toUserId: '' });

    // On new message
    socketRef.current.on('messageAdded', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // On user typing
    socketRef.current.on('userTyping', (data) => {
      if (data.authorId !== user?._id) {
        setWhoIsTyping(data.authorName);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setWhoIsTyping(null);
        }, 3000);
      }
    });
  }

  // ---------- Scroll to bottom ----------
  function scrollToBottom() {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }

  // ---------- Send & Type ----------
  async function handleSendMessage() {
    if (!currentMessage.trim() && !fileToUpload) return;

    let attachmentUrl = '';
    if (fileToUpload) {
      attachmentUrl = await uploadFileToCloudinary(fileToUpload);
      setFileToUpload(null);
    }

    const payload = {
      text: currentMessage.trim(),
      authorName: user?.name || 'Anon',
      authorRole: user?.role || 'N/A',
      authorId: user?._id,
      projectId,
      attachmentUrl,
      toUserId: '' // group chat
    };

    socketRef.current.emit('newMessage', payload);
    setCurrentMessage('');
  }

  function handleTyping(e) {
    setCurrentMessage(e.target.value);

    if (socketRef.current) {
      socketRef.current.emit('typing', {
        projectId,
        authorId: user?._id,
        authorName: user?.name,
        toUserId: ''
      });
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  }

  // ---------- Cloudinary Upload (Image / Video/Audio) ----------
  async function uploadFileToCloudinary(file) {
    try {
      setIsUploadingFile(true);

      // Determine file type
      const fileType = file.type.split('/')[0]; // "image" | "audio" | "video"
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      let uploadUrl = '';
      if (fileType === 'image') {
        uploadUrl = IMAGE_UPLOAD_URL;
      } else if (fileType === 'video' || fileType === 'audio') {
        uploadUrl = VIDEO_UPLOAD_URL;
      } else {
        throw new Error('Unsupported file type');
      }

      const resp = await api.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadingFile(false);
      return resp.data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setError('Upload failed');
      setIsUploadingFile(false);
      return '';
    }
  }

  // ---------- Voice Recording ----------
  async function handleRecordToggle() {
    if (recording) {
      // Stop
      handleStopRecording();
      return;
    }
    // Start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      });

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = await uploadFileToCloudinary(audioBlob);
        if (url) {
          const payload = {
            text: '',
            authorName: user?.name || 'Anon',
            authorRole: user?.role || 'N/A',
            authorId: user?._id,
            projectId,
            attachmentUrl: url,
            toUserId: ''
          };
          socketRef.current.emit('newMessage', payload);
        }
      });

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
      setError('Microphone access denied');
    }
  }

  function handleStopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(false);
  }

  // ---------- Right Info Drawer ----------
  function InfoDrawer() {
    // On mobile it covers the screen, on bigger screens it's narrower
    return (
      <Drawer
        anchor="right"
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        PaperProps={{
          sx: {
            width: isMdDown ? '100%' : 360
          }
        }}
      >
        <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Project Info
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Project: {projectName}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Logged in as: {user?.name} ({user?.role})
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Some More Info: e.g. total members, created date, etc.
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setInfoOpen(false)}
          >
            Hide Info
          </Button>
        </Box>
      </Drawer>
    );
  }

  // ---------- Subcomponents for Rendering ----------
  function renderHeader() {
    return (
      <Header>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Group Chat
          </Typography>
          {isTyping && whoIsTyping && (
            <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
              {whoIsTyping} is typing...
            </Typography>
          )}
        </Box>
        <MuiIconButton onClick={() => setInfoOpen(true)}>
          <InfoCircle />
        </MuiIconButton>
      </Header>
    );
  }

  // We'll store the messages in a scrollable container:
  const messagesContainerRef = useRef(null);

  function renderMessages() {
    // Helper functions to identify file type
    const isImage = (url) => !!url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideoOrAudio = (url) => !!url.match(/\.(mp4|mov|avi|mkv|webm|mp3|wav|ogg|aac|m4a)$/i);

    return (
      <MessagesContainer ref={messagesContainerRef}>
        {messages.map((msg) => {
          const mine = msg.authorId === user?._id;
          return (
            <Box key={msg._id || Math.random()} sx={{ mb: 2, textAlign: mine ? 'right' : 'left' }}>
              <Typography variant="subtitle2">
                {msg.authorName} ({msg.authorRole})
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  p: 1,
                  borderRadius: 2,
                  maxWidth: '70%',
                  bgcolor: mine ? theme.palette.primary.light : theme.palette.grey[200],
                  color: mine ? theme.palette.primary.contrastText : 'inherit',
                }}
              >
                {/* Text */}
                {msg.text && (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {msg.text}
                  </Typography>
                )}
                {/* Attachment */}
                {msg.attachmentUrl && (
                  <Box mt={1}>
                    {isImage(msg.attachmentUrl) ? (
                      <Box
                        component="img"
                        sx={{ maxWidth: 220, borderRadius: 1 }}
                        src={msg.attachmentUrl}
                        alt="attachment"
                      />
                    ) : isVideoOrAudio(msg.attachmentUrl) ? (
                      <ReactPlayer
                        url={msg.attachmentUrl}
                        controls
                        width="220px"
                        height="auto"
                      />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => window.open(msg.attachmentUrl, '_blank')}
                      >
                        Open File
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </MessagesContainer>
    );
  }

  function renderInputBar() {
    return (
      <InputContainer>
        <Stack direction="row" spacing={1} alignItems="center">
          {/* File Upload */}
          <label htmlFor="file-upload">
            <input
              id="file-upload"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => setFileToUpload(e.target.files[0])}
            />
            <MuiIconButton color="secondary" component="span">
              <Paperclip />
            </MuiIconButton>
          </label>
          {fileToUpload && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ maxWidth: 100 }} noWrap>
                {fileToUpload.name}
              </Typography>
              {isUploadingFile && <CircularProgress size={16} />}
            </Stack>
          )}

          {/* Voice Recorder */}
          <MuiIconButton color="secondary" onClick={recording ? handleStopRecording : handleRecordToggle}>
            {recording ? <Stop color="error" /> : <Microphone2 />}
          </MuiIconButton>

          {/* Text Input */}
          <TextField
            fullWidth
            variant="standard"
            placeholder="Type a message..."
            value={currentMessage}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            InputProps={{
              disableUnderline: true,
              style: { paddingLeft: 8 }
            }}
          />

          {/* Send Button */}
          <MuiIconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() && !fileToUpload}
          >
            <Send />
          </MuiIconButton>
        </Stack>
      </InputContainer>
    );
  }

  return (
    <ChatWrapper>
      <CardContainer>
        {/* Header */}
        {renderHeader()}

        {/* Messages */}
        {renderMessages()}

        {/* Input */}
        {renderInputBar()}
      </CardContainer>

      {/* Right Drawer Info */}
      <Drawer
        anchor="right"
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        PaperProps={{
          sx: {
            width: isMdDown ? '100%' : 360,
          }
        }}
      >
        <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Project Info
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Project: {projectName}
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Logged in as: {user?.name} ({user?.role})
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Some More Info: e.g. total members, created date, etc.
          </Typography>

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setInfoOpen(false)}
          >
            Hide Info
          </Button>
        </Box>
      </Drawer>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </ChatWrapper>
  );
}
