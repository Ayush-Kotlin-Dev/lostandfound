import React, {useState, useEffect} from 'react';
import {
    Container,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
    Button,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {useItems} from '../../context/ItemsContext';
import {useAuth} from '../../context/AuthContext';
import TopAppBar from '../layout/TopAppBar';
import ItemsGrid from './ItemsGrid';
import {doc, deleteDoc} from 'firebase/firestore';
import {db} from '../../firebase/config';

export default function MyItemsScreen() {
    const {myItems, fetchMyItems, loading, error} = useItems();
    const {currentUser} = useAuth();
    const navigate = useNavigate();

    const [tabValue, setTabValue] = useState(0); // 0 for Lost, 1 for Found
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Refetch items data when component mounts
    useEffect(() => {
        if (currentUser) {
            fetchMyItems();
        }
    }, [currentUser, fetchMyItems]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Filter items based on tab
    const getFilteredItems = () => {
        if (!myItems) return [];

        if (tabValue === 0) {
            return myItems.filter(item => item.status === 'lost');
        } else {
            return myItems.filter(item => item.status === 'found');
        }
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    // Navigate to edit screen
    const handleEditClick = (item) => {
        navigate(`/edit-item/${item.id}`, {state: {item}});
    };

    // Delete the item
    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        try {
            setDeleteLoading(true);
            setDeleteError('');

            await deleteDoc(doc(db, 'items', itemToDelete.id));

            // Close dialog and refresh items
            setDeleteDialogOpen(false);
            setItemToDelete(null);
            fetchMyItems(); // Refresh the list

        } catch (error) {
            console.error('Error deleting item:', error);
            setDeleteError('Failed to delete item. Please try again.');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Override ItemCard to include edit/delete functions
    const MyItemsGrid = () => {
        const items = getFilteredItems();

        // Provide custom actions for each item card
        const itemActions = (item) => (
            <>
                <Button
                    size="small"
                    color="primary"
                    startIcon={<EditIcon/>}
                    onClick={() => handleEditClick(item)}
                >
                    Edit
                </Button>
                <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon/>}
                    onClick={() => handleDeleteClick(item)}
                >
                    Delete
                </Button>
            </>
        );

        return (
            <ItemsGrid
                items={items}
                loading={loading}
                error={error}
                itemActions={itemActions}
            />
        );
    };

    return (
        <div>
            <TopAppBar/>
            <Container maxWidth="lg" sx={{mt: 4, mb: 8}}>
                {/* Header Section */}
                <Paper sx={{p: 3, mb: 4, borderRadius: 2}}>
                    <Box
                        sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                        <Typography variant="h4" gutterBottom>
                            My Items
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon/>}
                            onClick={() => navigate('/report-item')}
                        >
                            Report New Item
                        </Button>
                    </Box>
                </Paper>

                {/* Tabs */}
                <Box sx={{borderBottom: 1, borderColor: 'divider', mb: 3}}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="my items tabs"
                        textColor="primary"
                        indicatorColor="primary"
                    >
                        <Tab
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    Lost Items
                                    <Chip
                                        label={myItems?.filter(item => item.status === 'lost').length || 0}
                                        size="small"
                                        color="error"
                                        sx={{ml: 1}}
                                    />
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    Found Items
                                    <Chip
                                        label={myItems?.filter(item => item.status === 'found').length || 0}
                                        size="small"
                                        color="success"
                                        sx={{ml: 1}}
                                    />
                                </Box>
                            }
                        />
                    </Tabs>
                </Box>

                {/* Items Grid */}
                <MyItemsGrid/>

                {/* No items message */}
                {myItems && myItems.length === 0 && (
                    <Box sx={{textAlign: 'center', py: 5}}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            You haven't reported any items yet
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon/>}
                            onClick={() => navigate('/report-item')}
                            sx={{mt: 2}}
                        >
                            Report an Item
                        </Button>
                    </Box>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                >
                    <DialogTitle>Delete Item</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this item? This action cannot be undone.
                        </DialogContentText>
                        {deleteError && (
                            <Alert severity="error" sx={{mt: 2}}>
                                {deleteError}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            color="error"
                            disabled={deleteLoading}
                            startIcon={deleteLoading && <CircularProgress size={16}/>}
                        >
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </div>
    );
}