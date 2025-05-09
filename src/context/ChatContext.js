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

    // Initialize or get chat session between two users for an item
    const initializeChat = async (itemId, otherUserId) => {
        if (!currentUser) return null;

        // Create a unique chat ID by sorting and combining user IDs
        const chatId = [currentUser.uid, otherUserId].sort().join('_') + `_${itemId}`;

        setActiveChat(chatId);

        // Check if chat exists in the chats list, if not create it
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

        return chatId;
    };

    // Send a message in the active chat
    const sendMessage = async (content, isAnonymous = false) => {
        if (!activeChat || !currentUser) return;

        try {
            const messagesRef = ref(rtdb, `messages/${activeChat}`);
            const newMessageRef = push(messagesRef);

            await set(newMessageRef, {
                content,
                senderId: currentUser.uid,
                senderName: isAnonymous ? "Anonymous" : currentUser.displayName || "User",
                isAnonymous,
                timestamp: serverTimestamp()
            });

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
            return;
        }

        setLoading(true);

        const messagesRef = query(
            ref(rtdb, `messages/${activeChat}`),
            orderByChild('timestamp')
        );

        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const messageList = Object.entries(data).map(([id, message]) => ({
                    id,
                    ...message,
                    timestamp: message.timestamp || Date.now()
                })).sort((a, b) => a.timestamp - b.timestamp);

                setMessages(messageList);
            } else {
                setMessages([]);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeChat]);

    // Value to be provided by the context
    const value = {
        chats,
        activeChat,
        messages,
        loading,
        initializeChat,
        sendMessage,
        setActiveChat
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};