// ProjectChat.jsx
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// MUI
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  useMediaQuery,
  IconButton as MuiIconButton,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  TextField,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';

// Third-party
import api from 'pages/api';  // your Axios instance
import useAuth from 'hooks/useAuth'; // must provide user object

// Icons
import { Send, Paperclip, InfoCircle, Menu as MenuIcon } from 'iconsax-react';

// Cloudinary constants
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dqniuczkg/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// ---------- STYLED WRAPPERS ----------
const ChatWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  width: '100%',
}));

const MainContent = styled('div')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(1)
}));

const CardContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 64px)' // offset from top nav, adjust as needed
}));

// SUBCOMPONENT: Drawer (Sidebar)
function ChatDrawer({ open, onToggle, supervisors, activeChat, setActiveChat, projectId }) {
  return (
    <Box
      sx={{
        width: { xs: open ? 260 : 0, md: 320 },
        borderRight: `1px solid #eee`,
        transition: 'width 0.3s ease-out',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <MuiIconButton
          onClick={onToggle}
          color="secondary"
          sx={{ display: { md: 'none', xs: 'inline-flex' } }}
        >
          <MenuIcon />
        </MuiIconButton>
        <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
          Project Chat
        </Typography>
      </Box>

      {/* Chat Channels */}
      <List>
        {/* Group Chat */}
        <ListItemButton
          selected={activeChat.type === 'group'}
          onClick={() => setActiveChat({ type: 'group', userId: null })}
        >
          <ListItemText primary="Group Chat" />
        </ListItemButton>
        <Divider />

        {/* Each assigned supervisor */}
        {supervisors.map((sup) => (
          <ListItemButton
            key={sup._id}
            selected={activeChat.type === 'private' && activeChat.userId === sup._id}
            onClick={() => setActiveChat({ type: 'private', userId: sup._id })}
          >
            <ListItemText
              primary={sup.name}
              secondary={sup.role}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

// SUBCOMPONENT: Header (top bar in the chat)
function ChatHeader({ user, isTyping, whoIsTyping, onToggleRightPanel, activeChat, supervisors, projectName }) {
  // Figure out the label for the current chat
  let chatLabel = 'Group Chat';
  if (activeChat.type === 'private') {
    // find the user from supervisors
    const sup = supervisors.find((s) => s._id === activeChat.userId);
    if (sup) {
      chatLabel = sup.name;
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        p: 1
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {chatLabel}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Project: {projectName || 'N/A'}
        </Typography>

        {/* Typing indicator */}
        {isTyping && whoIsTyping && (
          <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
            {whoIsTyping} is typing...
          </Typography>
        )}
      </Box>

      {/* Toggle right panel */}
      <MuiIconButton onClick={onToggleRightPanel} color="secondary">
        <InfoCircle />
      </MuiIconButton>
    </Box>
  );
}

// SUBCOMPONENT: ChatHistory
function ChatHistory({ messages, currentUserId }) {
  const theme = useTheme();

  // Helper to see if it's an image
  const isImage = (url) => !!url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: theme.palette.grey[50] }}>
      {messages.map((msg) => {
        const mine = msg.authorId === currentUserId;
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
                color: mine ? theme.palette.primary.contrastText : 'inherit'
              }}
            >
              {msg.text && (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {msg.text}
                </Typography>
              )}
              {msg.attachmentUrl && (
                <Box mt={1}>
                  {isImage(msg.attachmentUrl) ? (
                    <Box component="img" sx={{ maxWidth: 200, borderRadius: 1 }} src={msg.attachmentUrl} alt="attachment" />
                  ) : (
                    <Button
                      variant="contained"
                      color="secondary"
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
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
    </Box>
  );
}

// SUBCOMPONENT: RightPanel (UserDetails)
function RightPanel({ open, onClose, user, projectName }) {
  // On large screens, we can show a side panel
  // On small screens, we show as a dialog
  return (
    <Box
      sx={{
        width: 300,
        borderLeft: '1px solid #eee',
        p: 2,
        display: { xs: 'none', md: open ? 'block' : 'none' }
      }}
    >
      <Typography variant="h6" gutterBottom>
        Project Info
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Project: {projectName}
      </Typography>

      <Typography variant="body2" sx={{ mt: 1 }}>
        Logged in as: {user?.name} ({user?.role})
      </Typography>

      <Box mt={2}>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </Box>
    </Box>
  );
}


// MAIN COMPONENT
export default function ProjectChat({ projectId }) {
  // Example: If your socket server is on localhost:4000
  const socketServerUrl = 'https://web-production-9e20.up.railway.app/';

  const { user } = useAuth(); // get user from your auth
  const theme = useTheme();
  const matchesMd = useMediaQuery(theme.breakpoints.down('md'));
  const matchesLg = useMediaQuery(theme.breakpoints.down('lg'));

  // Project info
  const [projectName, setProjectName] = useState('');
  const [supervisors, setSupervisors] = useState([]);

  // Chat states
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState(null);

  // Drawer and Right Panel
  const [drawerOpen, setDrawerOpen] = useState(!matchesLg);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // activeChat: { type: 'group' | 'private', userId: string | null }
  const [activeChat, setActiveChat] = useState({ type: 'group', userId: null });

  // 1) On mount (and if user is loaded), fetch project info & supervisors
  useEffect(() => {
    if (user && projectId) {
      fetchProjectInfo();
      fetchGroupMessages(); // default is group chat
      initSocket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId]);

  // 2) Re-fetch messages (or re-join socket room) if user changes chat type
  useEffect(() => {
    if (activeChat.type === 'group') {
      // fetch group chat
      fetchGroupMessages();
      joinSocketRoom({ projectId, toUserId: '' });
    } else {
      // fetch private chat
      if (activeChat.userId) {
        fetchPrivateMessages(activeChat.userId);
        joinSocketRoom({ projectId, toUserId: activeChat.userId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat]);

  // -------------- API & Socket Setup --------------

  const fetchProjectInfo = async () => {
    try {
      // 1) Get the project to read .name or so
      //    (You might store the project name in the returned data.)
      // 2) Also get supervisors from your endpoint
      const respSuper = await api.get(`/api/projects/${projectId}/supervisors`);
      setSupervisors(respSuper.data);

      // If you store project details or name in another endpoint:
      // e.g. /api/projects/:projectId -> returns { name, ... }
      const projectResp = await api.get(`/api/projects/${projectId}/chat`);
      setProjectName(projectResp.data.name || 'Project');
    } catch (err) {
      console.error('Error fetching project info:', err);
    }
  };

  const fetchGroupMessages = async () => {
    try {
      const resp = await api.get(`/api/projects/${projectId}/chat`);
      setMessages(resp.data);
    } catch (err) {
      console.error('Error fetching group chat:', err);
    }
  };

  // Suppose for private chat, we define:
  // GET /api/projects/:projectId/chat/user/:userA/:userB
  // We'll treat "userA" as your user, "userB" as other user
  const fetchPrivateMessages = async (otherUserId) => {
    try {
      const resp = await api.get(`/api/projects/${projectId}/chat/user/${user._id}/${otherUserId}`);
      setMessages(resp.data);
    } catch (err) {
      console.error('Error fetching private chat:', err);
    }
  };

  const initSocket = () => {
    socketRef.current = io(socketServerUrl, { transports: ['websocket'] });

    // Listen for messageAdded
    socketRef.current.on('messageAdded', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Listen for userTyping
    socketRef.current.on('userTyping', (data) => {
      if (data.authorId !== user?._id) {
        setWhoIsTyping(data.authorName);
        setIsTyping(true);
        // Clear after a few seconds
        setTimeout(() => {
          setIsTyping(false);
          setWhoIsTyping(null);
        }, 3000);
      }
    });
  };

  const joinSocketRoom = ({ projectId, toUserId }) => {
    if (!socketRef.current) return;
    socketRef.current.emit('joinProject', { projectId, toUserId });
  };

  // -------------- SENDING MESSAGES --------------
  const handleSendMessage = async () => {
    if (!currentMessage.trim() && !fileToUpload) return;

    let attachmentUrl = '';
    if (fileToUpload) {
      attachmentUrl = await uploadToCloudinary(fileToUpload);
      setFileToUpload(null);
    }

    const payload = {
      text: currentMessage,
      authorName: user?.name || 'NoName',
      authorRole: user?.role || 'NoRole',
      authorId: user?._id,
      projectId,
      attachmentUrl
    };
    // if private
    if (activeChat.type === 'private' && activeChat.userId) {
      payload.toUserId = activeChat.userId;
    } else {
      payload.toUserId = ''; // group
    }

    socketRef.current.emit('newMessage', payload);

    setCurrentMessage('');
  };

  // -------------- CLOUDINARY UPLOAD --------------
  const uploadToCloudinary = async (file) => {
    try {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const resp = await api.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsUploadingFile(false);
      return resp.data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setIsUploadingFile(false);
      return '';
    }
  };

  // -------------- TYPING --------------
  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    if (!socketRef.current) return;

    const data = {
      projectId,
      authorId: user?._id,
      authorName: user?.name
    };
    // If private chat, pass toUserId
    if (activeChat.type === 'private' && activeChat.userId) {
      data.toUserId = activeChat.userId;
    } else {
      data.toUserId = '';
    }

    socketRef.current.emit('typing', data);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // RENDER
  return (
    <ChatWrapper>
      {/* LEFT DRAWER: shows "Group Chat" and list of supervisors */}
      <ChatDrawer
        open={drawerOpen}
        onToggle={() => setDrawerOpen((o) => !o)}
        supervisors={supervisors}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        projectId={projectId}
      />

      {/* MAIN CONTENT */}
      <MainContent>
        <CardContainer>
          {/* Chat Header */}
          <ChatHeader
            user={user}
            isTyping={isTyping}
            whoIsTyping={whoIsTyping}
            onToggleRightPanel={() => setRightPanelOpen(true)}
            activeChat={activeChat}
            supervisors={supervisors}
            projectName={projectName}
          />

          {/* Chat History */}
          <ChatHistory messages={messages} currentUserId={user?._id} />

          {/* Input bar */}
          <Box sx={{ borderTop: '1px solid #eee', p: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {/* File upload button */}
              <label htmlFor="file-upload">
                <input
                  id="file-upload"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                />
                <MuiIconButton component="span" color="secondary">
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

              {/* Message input */}
              <TextField
                fullWidth
                variant="standard"
                placeholder="Type a message..."
                value={currentMessage}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                InputProps={{ disableUnderline: true, style: { paddingLeft: 8 } }}
              />

              {/* Send button */}
              <MuiIconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() && !fileToUpload}
              >
                <Send />
              </MuiIconButton>
            </Stack>
          </Box>
        </CardContainer>
      </MainContent>

      {/* RIGHT PANEL (shows on md+ screens) */}
      <RightPanel
        open={rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
        user={user}
        projectName={projectName}
      />

      {/* On small screens, show the right panel as a dialog */}
      <Dialog
        open={matchesMd && rightPanelOpen}
        onClose={() => setRightPanelOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Project Info
          </Typography>
          <Typography variant="body2">
            Project: {projectName}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Logged in as: {user?.name} ({user?.role})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRightPanelOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </ChatWrapper>
  );
}
