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
    VisibilityOff as VisibilityOffIcon
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

export default function ChatBox({otherUser, itemId, itemTitle}) {
    const {initializeChat, sendMessage, messages, loading} = useChat();
    const {currentUser} = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const messagesEndRef = useRef(null);

    // Initialize chat when component mounts
    useEffect(() => {
        if (currentUser && otherUser && itemId) {
            initializeChat(itemId, otherUser.userId);
        }
    }, [currentUser, otherUser, itemId, initializeChat]);

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

    return (
        <Paper elevation={3} sx={{height: '500px', display: 'flex', flexDirection: 'column'}}>
            {/* Chat Header */}
            <Box sx={{p: 2, bgcolor: 'primary.main', color: 'white'}}>
                <Typography variant="h6">
                    Chat about: {itemTitle || 'Item'}
                </Typography>
                <Typography variant="body2">
                    {otherUser ? `Chatting with ${otherUser.displayName || 'User'}` : 'Loading...'}
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
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                        <CircularProgress/>
                    </Box>
                ) : messages.length === 0 ? (
                    <Box sx={{textAlign: 'center', color: 'text.secondary', mt: 10}}>
                        <Typography variant="body1">
                            No messages yet. Start the conversation!
                        </Typography>
                    </Box>
                ) : (
                    messages.map(message => (
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
                                            <Avatar src={otherUser?.photoURL} alt={message.senderName}/>
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
                                        ) : message.senderId === currentUser?.uid ? 'You' : message.senderName}
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
                    ))
                )}
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
                    disabled={loading}
                    sx={{mr: 1}}
                />
                <IconButton
                    color="primary"
                    type="submit"
                    disabled={!newMessage.trim() || loading}
                >
                    <SendIcon/>
                </IconButton>
            </Box>
        </Paper>
    );
}