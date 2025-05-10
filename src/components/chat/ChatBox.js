import React, {useState, useRef, useEffect} from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    CircularProgress,
    Divider,
    Avatar,
    FormGroup,
    FormControlLabel,
    Switch,
    Badge,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Refresh as RefreshIcon,
    ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import {useChat} from '../../context/ChatContext';
import {useAuth} from '../../context/AuthContext';

// Helper to format message time
const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
};

export default function ChatBox({otherUser, itemId, itemTitle, isItemAuthor}) {
    const {initializeChat, sendMessage, messages, loading, error} = useChat();
    const {currentUser} = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const messagesEndRef = useRef(null);
    const [initializing, setInitializing] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [showLoading, setShowLoading] = useState(true);

    // Initialize chat when component mounts
    useEffect(() => {
        let isMounted = true;

        const initChat = async () => {
            if (!currentUser || !itemId || initializing || initialized) return;

            try {
                setInitializing(true);

                if (isItemAuthor) {
                    // Item author can see all chats about this item
                    await initializeChat(itemId, null, true);
                } else if (otherUser && otherUser.userId) {
                    // Normal user chatting with the item author
                    await initializeChat(itemId, otherUser.userId);
                }

                if (isMounted) {
                    setInitialized(true);
                }
            } catch (err) {
                console.error("Failed to initialize chat:", err);
            } finally {
                if (isMounted) {
                    setInitializing(false);
                }
            }
        };

        initChat();

        // Clean up function
        return () => {
            isMounted = false;
        };
    }, [currentUser, otherUser, itemId, isItemAuthor, initializeChat, initializing, initialized]);

    // Add a loading timeout to avoid infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoading(false);
            // If still loading after timeout, force initialized state
            if (!initialized && (loading || initializing)) {
                setInitialized(true);
                setInitializing(false);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [loading, initializing, initialized]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        const success = await sendMessage(newMessage, isAnonymous);
        if (success) {
            setNewMessage('');
        }
    };

    // Handle retrying when there's an error
    const handleRetry = () => {
        // Reset state
        setInitialized(false);
        setInitializing(false);
        setShowLoading(true);
    };

    // Show appropriate loading or error states
    const renderContent = () => {
        // Initial loading state
        if (showLoading && (loading || initializing) && !initialized && messages.length === 0) {
            return (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    pt: 3,
                    pb: 3
                }}>
                    <CircularProgress size={32} thickness={4}/>
                    <Typography variant="body2" sx={{mt: 2, color: 'text.secondary'}}>
                        Loading conversation...
                    </Typography>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={handleRetry}
                        sx={{mt: 2}}
                    >
                        Click here if loading takes too long
                    </Button>
                </Box>
            );
        }

        // Error state
        if (error) {
            return (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    pt: 3,
                    pb: 3
                }}>
                    <ErrorIcon color="error" sx={{fontSize: 40, mb: 2}}/>
                    <Typography variant="body1" gutterBottom color="error">
                        {error}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon/>}
                        onClick={handleRetry}
                        sx={{mt: 1}}
                    >
                        Try Again
                    </Button>
                </Box>
            );
        }

        // Empty conversation state
        if (messages.length === 0) {
            return (
                <Box sx={{
                    textAlign: 'center',
                    color: 'text.secondary',
                    mt: 10
                }}>
                    <Typography variant="body1">
                        No messages yet. Start the conversation!
                    </Typography>
                </Box>
            );
        }

        // Messages list
        return messages.map(message => (
            <Box
                key={message.id}
                sx={{
                    alignSelf: message.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
                    mb: 1.5
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
                    {message.senderId !== currentUser?.uid && (
                        <Box sx={{mr: 1}}>
                            {message.isAnonymous ? (
                                <Avatar sx={{bgcolor: 'grey.500'}}>
                                    <VisibilityOffIcon fontSize="small"/>
                                </Avatar>
                            ) : (
                                <Avatar src={message.senderPhotoURL} alt={message.senderName}/>
                            )}
                        </Box>
                    )}

                    <Box>
                        {/* Sender Name with Anonymous Badge */}
                        <Typography
                            variant="caption"
                            sx={{
                                ml: 1,
                                display: 'block',
                                textAlign: message.senderId === currentUser?.uid ? 'right' : 'left',
                                color: 'text.secondary'
                            }}
                        >
                            {message.isAnonymous ? (
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                                    badgeContent={
                                        <Tooltip title="Anonymous message">
                                            <VisibilityOffIcon fontSize="inherit"/>
                                        </Tooltip>
                                    }
                                >
                                    Anonymous
                                </Badge>
                            ) : message.senderId === currentUser?.uid ? 'You' : (
                                isItemAuthor ? `${message.senderName} (User)` : message.senderName
                            )}
                        </Typography>

                        {/* Message Content */}
                        <Paper
                            elevation={1}
                            sx={{
                                p: 1.5,
                                bgcolor: message.senderId === currentUser?.uid ? 'primary.light' : 'grey.100',
                                color: message.senderId === currentUser?.uid ? 'white' : 'inherit',
                                borderRadius: 2,
                                maxWidth: '300px',
                                wordBreak: 'break-word'
                            }}
                        >
                            <Typography variant="body1">{message.content}</Typography>
                        </Paper>

                        {/* Message Timestamp */}
                        <Typography
                            variant="caption"
                            sx={{
                                ml: 1,
                                display: 'block',
                                textAlign: message.senderId === currentUser?.uid ? 'right' : 'left',
                                color: 'text.secondary'
                            }}
                        >
                            {formatTime(message.timestamp)}
                        </Typography>
                    </Box>

                    {message.senderId === currentUser?.uid && (
                        <Box sx={{ml: 1}}>
                            {message.isAnonymous ? (
                                <Avatar sx={{bgcolor: 'primary.dark'}}>
                                    <VisibilityOffIcon fontSize="small"/>
                                </Avatar>
                            ) : (
                                <Avatar src={currentUser?.photoURL}
                                        alt={currentUser?.displayName || 'You'}/>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        ));
    };

    return (
        <Paper elevation={3} sx={{height: '500px', display: 'flex', flexDirection: 'column'}}>
            {/* Chat Header */}
            <Box sx={{p: 2, bgcolor: 'primary.main', color: 'white'}}>
                <Typography variant="h6">
                    Chat about: {itemTitle || 'Item'}
                </Typography>
                <Typography variant="body2">
                    {isItemAuthor
                        ? 'All conversations about this item'
                        : otherUser
                            ? `Chatting with ${otherUser.displayName || 'User'}`
                            : 'Loading...'}
                </Typography>
            </Box>

            <Divider/>

            {/* Messages Area */}
            <Box sx={{
                flexGrow: 1,
                p: 2,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {renderContent()}
                <div ref={messagesEndRef}/>
            </Box>

            <Divider/>

            {/* Anonymous Toggle */}
            <Box sx={{pl: 2, pr: 2, pt: 1}}>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isAnonymous}
                                onChange={() => setIsAnonymous(!isAnonymous)}
                                color="primary"
                                size="small"
                            />
                        }
                        label={
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                {isAnonymous ? <VisibilityOffIcon fontSize="small" sx={{mr: 0.5}}/> :
                                    <VisibilityIcon fontSize="small" sx={{mr: 0.5}}/>}
                                <Typography variant="body2">
                                    {isAnonymous ? "Send as Anonymous" : "Send as Yourself"}
                                </Typography>
                            </Box>
                        }
                    />
                </FormGroup>
            </Box>

            {/* Message Input */}
            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    display: 'flex'
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Type your message..."
                    variant="outlined"
                    size="small"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    sx={{mr: 1}}
                />
                <IconButton
                    color="primary"
                    type="submit"
                    disabled={!newMessage.trim()}
                >
                    <SendIcon/>
                </IconButton>
            </Box>
        </Paper>
    );
}