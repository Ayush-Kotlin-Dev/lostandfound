import React, {createContext, useContext, useState, useEffect} from 'react';
import {rtdb, auth} from '../firebase/config';
import {
    ref,
    push,
    set,
    onValue,
    query,
    orderByChild,
    startAt,
    serverTimestamp
} from 'firebase/database';
import {useAuth} from './AuthContext';

// Create context
const ChatContext = createContext();

// Custom hook for using the chat context
export const useChat = () => {
    return useContext(ChatContext);
};

export const ChatProvider = ({children}) => {
    const {currentUser} = useAuth();
    const [chats, setChats] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthorView, setIsAuthorView] = useState(false);

    // Initialize or get chat session between two users for an item
    const initializeChat = async (itemId, otherUserId, isItemAuthor = false) => {
        if (!currentUser) return null;

        // Reset states when initializing a new chat - unless we're already in the same chat
        const currentActiveChat = isItemAuthor ? `item_${itemId}` :
        [currentUser.uid, otherUserId].sort().join('_') + `_${itemId}`;

        // Only process if we're switching chats or it's new
        if (activeChat !== currentActiveChat || !activeChat) {
            // Set loading state
            setLoading(true);
            setError(null);

            // Clear messages when switching chats
            setMessages([]);
        } else {
            // If we're already in this chat, just return the chat ID without reinitializing
            // This prevents unnecessary loading states
            return currentActiveChat;
        }

        // Update isAuthorView state
        if (isAuthorView !== isItemAuthor) {
            setIsAuthorView(isItemAuthor);
        }

        if (isItemAuthor) {
            // For item authors, we set the itemId as the active "chat"
            // This indicates we want to see all messages about this item
            if (activeChat !== `item_${itemId}`) {
                setActiveChat(`item_${itemId}`);
            }
            return `item_${itemId}`;
        }

        // For regular users, create a unique chat ID by sorting and combining user IDs
        const chatId = [currentUser.uid, otherUserId].sort().join('_') + `_${itemId}`;

        // Only update if necessary to prevent rerenders
        if (activeChat !== chatId) {
            setActiveChat(chatId);
        }

        // Check if chat exists in the chats list, if not create it
        try {
            if (!chats[chatId]) {
                const chatRef = ref(rtdb, `chats/${chatId}`);

                // Set up basic chat info
                await set(chatRef, {
                    participants: {
                        [currentUser.uid]: true,
                        [otherUserId]: true
                    },
                    itemId: itemId,
                    createdAt: serverTimestamp()
                });

                // Update local state
                setChats(prevChats => ({
                    ...prevChats,
                    [chatId]: {
                        participants: {
                            [currentUser.uid]: true,
                            [otherUserId]: true
                        },
                        itemId: itemId,
                        lastMessage: null
                    }
                }));
            }
        } catch (error) {
            console.error('Error initializing chat:', error);
            setError('Failed to initialize chat');
            setLoading(false);
            // Return null to indicate failure
            return null;
        }

        return chatId;
    };

    // Send a message in the active chat
    const sendMessage = async (content, isAnonymous = false) => {
        if (!activeChat || !currentUser) return false;

        try {
            // If we're in author view, we need to handle this differently
            if (isAuthorView && activeChat.startsWith('item_')) {
                // We need to get the last message to know which chat to respond to
                // If there are no messages yet, we can't respond
                if (messages.length === 0) return false;

                // Get the last message's chat ID
                const lastMsgChatId = messages[messages.length - 1].chatId;

                // Send message to that specific chat
                const messagesRef = ref(rtdb, `messages/${lastMsgChatId}`);
                const newMessageRef = push(messagesRef);

                await set(newMessageRef, {
                    content,
                    senderId: currentUser.uid,
                    senderName: isAnonymous ? "Anonymous" : currentUser.displayName || "User",
                    senderPhotoURL: currentUser.photoURL,
                    isAnonymous,
                    timestamp: serverTimestamp(),
                    chatId: lastMsgChatId
                });

                // Add a temporary message to local state for immediate feedback
                const tempMsg = {
                    id: Math.random().toString(36).substring(2, 15),
                    content,
                    senderId: currentUser.uid,
                    senderName: isAnonymous ? "Anonymous" : currentUser.displayName || "User",
                    senderPhotoURL: currentUser.photoURL,
                    isAnonymous,
                    timestamp: Date.now(),
                    chatId: lastMsgChatId
                };

                setMessages(prev => [...prev, tempMsg]);
            } else {
                // Normal message sending for direct chats
                const messagesRef = ref(rtdb, `messages/${activeChat}`);
                const newMessageRef = push(messagesRef);

                await set(newMessageRef, {
                    content,
                    senderId: currentUser.uid,
                    senderName: isAnonymous ? "Anonymous" : currentUser.displayName || "User",
                    senderPhotoURL: currentUser.photoURL,
                    isAnonymous,
                    timestamp: serverTimestamp(),
                    chatId: activeChat
                });

                // Add a temporary message to local state for immediate feedback
                const tempMsg = {
                    id: Math.random().toString(36).substring(2, 15),
                    content,
                    senderId: currentUser.uid,
                    senderName: isAnonymous ? "Anonymous" : currentUser.displayName || "User",
                    senderPhotoURL: currentUser.photoURL,
                    isAnonymous,
                    timestamp: Date.now(),
                    chatId: activeChat
                };

                setMessages(prev => [...prev, tempMsg]);
            }

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    };

    // Listen for messages in the active chat
    useEffect(() => {
        if (!activeChat) {
            setMessages([]);
            setLoading(false);
            return;
        }

        // Avoid setting loading state if it's already true
        // This prevents potential infinite rerenders
        if (!loading) {
            setLoading(true);
        }

        // Only set error to null if there was an error before
        if (error) {
            setError(null);
        }

        // Add a safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            setLoading(false); // Force loading to false after timeout
        }, 5000); // 5 seconds maximum loading time

        let messagesRef;

        if (isAuthorView && activeChat.startsWith('item_')) {
            // Extract the itemId from the activeChat
            const itemId = activeChat.replace('item_', '');

            // For item authors, we need to listen to all messages related to their item
            // This requires a different query approach - we'll use onValue with a filter
            messagesRef = ref(rtdb, 'messages');
        } else {
            // For regular chats, we just listen to the specific chat
            messagesRef = query(
                ref(rtdb, `messages/${activeChat}`),
                orderByChild('timestamp')
            );
        }

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                if (isAuthorView && activeChat.startsWith('item_')) {
                    // For author view, we need to filter and combine messages from all chats
                    // related to this item
                    const itemId = activeChat.replace('item_', '');
                    let allItemMessages = [];

                    // Iterate through all chats
                    Object.entries(data).forEach(([chatId, chatData]) => {
                        // Check if this chat relates to our item
                        if (chatId.includes(`_${itemId}`)) {
                            // Add all messages from this chat
                            const chatMessages = Object.entries(chatData).map(([msgId, msg]) => ({
                                id: msgId,
                                chatId: chatId,  // Store which chat this message belongs to
                                ...msg,
                                timestamp: msg.timestamp || Date.now()
                            }));
                            allItemMessages = [...allItemMessages, ...chatMessages];
                        }
                    });

                    // Sort all messages by timestamp
                    allItemMessages.sort((a, b) => a.timestamp - b.timestamp);
                    setMessages(allItemMessages);
                } else {
                    // Regular chat processing
                    const messageList = Object.entries(data).map(([id, message]) => ({
                        id,
                        ...message,
                        chatId: activeChat,
                        timestamp: message.timestamp || Date.now()
                    })).sort((a, b) => a.timestamp - b.timestamp);

                    setMessages(messageList);
                }
            } else {
                setMessages([]);
            }

            setLoading(false);
        });

        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [activeChat, isAuthorView]);

    // Value to be provided by the context
    const value = {
        chats,
        activeChat,
        messages,
        loading,
        error,
        initializeChat,
        sendMessage,
        setActiveChat,
        isAuthorView,
        setLoading
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};