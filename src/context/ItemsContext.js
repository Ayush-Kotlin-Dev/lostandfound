import React, {createContext, useContext, useState, useEffect} from 'react';
import {db} from '../firebase/config';
import {collection, query, where, getDocs, addDoc, serverTimestamp, orderBy} from 'firebase/firestore';
import {useAuth} from './AuthContext';

// Create the context
const ItemsContext = createContext();

// Custom hook to use the items context
export const useItems = () => {
    return useContext(ItemsContext);
};

// Categories for items
export const ITEM_CATEGORIES = [
    {id: 'electronics', label: 'Electronics'},
    {id: 'stationery', label: 'Stationery'},
    {id: 'clothing', label: 'Clothing'},
    {id: 'accessories', label: 'Accessories'},
    {id: 'documents', label: 'Documents'},
    {id: 'other', label: 'Other'}
];

// Item status options
export const ITEM_STATUS = {
    LOST: 'lost',
    FOUND: 'found',
    CLAIMED: 'claimed',
    RETURNED: 'returned'
};

export const ItemsProvider = ({children}) => {
    const [lostItems, setLostItems] = useState([]);
    const [foundItems, setFoundItems] = useState([]);
    const [myItems, setMyItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const {currentUser} = useAuth();

    // Fetch all lost items
    const fetchLostItems = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'items'),
                where('status', '==', ITEM_STATUS.LOST),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLostItems(items);
        } catch (error) {
            console.error('Error fetching lost items:', error);
            setError('Failed to load lost items');
        } finally {
            setLoading(false);
        }
    };

    // Fetch all found items
    const fetchFoundItems = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'items'),
                where('status', '==', ITEM_STATUS.FOUND),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFoundItems(items);
        } catch (error) {
            console.error('Error fetching found items:', error);
            setError('Failed to load found items');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's items
    const fetchMyItems = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const q = query(
                collection(db, 'items'),
                where('userId', '==', currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMyItems(items);
        } catch (error) {
            console.error('Error fetching my items:', error);
            setError('Failed to load your items');
        } finally {
            setLoading(false);
        }
    };

    // Report a new item (lost or found)
    const reportItem = async (itemData) => {
        if (!currentUser) return;

        try {
            const newItem = {
                ...itemData,
                userId: currentUser.uid,
                userName: currentUser.displayName,
                userEmail: currentUser.email,
                userPhotoURL: currentUser.photoURL,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'items'), newItem);

            // Refresh the appropriate list
            if (itemData.status === ITEM_STATUS.LOST) {
                await fetchLostItems();
            } else if (itemData.status === ITEM_STATUS.FOUND) {
                await fetchFoundItems();
            }

            // Refresh my items
            await fetchMyItems();

            return true;
        } catch (error) {
            console.error('Error reporting item:', error);
            setError('Failed to report item');
            return false;
        }
    };

    // Initialize data
    useEffect(() => {
        fetchLostItems();
        fetchFoundItems();
    }, []);

    // Fetch user's items when auth state changes
    useEffect(() => {
        if (currentUser) {
            fetchMyItems();
        } else {
            setMyItems([]);
        }
    }, [currentUser]);

    // Value to be provided by the context
    const value = {
        lostItems,
        foundItems,
        myItems,
        loading,
        error,
        reportItem,
        fetchLostItems,
        fetchFoundItems,
        fetchMyItems,
        categories: ITEM_CATEGORIES,
        status: ITEM_STATUS
    };

    return (
        <ItemsContext.Provider value={value}>
            {children}
        </ItemsContext.Provider>
    );
};