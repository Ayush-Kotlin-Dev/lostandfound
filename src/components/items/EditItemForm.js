import React, {useState, useEffect} from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    MenuItem,
    Typography,
    Paper,
    Grid,
    Alert,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import {useItems} from '../../context/ItemsContext';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import TopAppBar from '../layout/TopAppBar';
import {
    Title as TitleIcon,
    Description as DescriptionIcon,
    Category as CategoryIcon,
    LocationOn as LocationIcon,
    CalendarToday as DateIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';
import {useAuth} from '../../context/AuthContext';
import {doc, updateDoc} from 'firebase/firestore';
import {db} from '../../firebase/config';

export default function EditItemForm() {
    const {categories, status, fetchMyItems} = useItems();
    const {currentUser} = useAuth();
    const navigate = useNavigate();
    const {id} = useParams();
    const location = useLocation();

    // Get item from location state or fetch it
    const itemFromState = location.state?.item;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        date: '',
        contact: '',
        status: status.LOST,
        imageUrl: ''
    });

    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Initialize form with item data
    useEffect(() => {
        if (itemFromState) {
            setFormData({
                title: itemFromState.title || '',
                description: itemFromState.description || '',
                category: itemFromState.category || '',
                location: itemFromState.location || '',
                date: itemFromState.date || '',
                contact: itemFromState.contact || '',
                status: itemFromState.status || status.LOST,
                imageUrl: itemFromState.imageUrl || ''
            });
        } else {
            // If no item in state, fetch it from Firestore (not implemented in this example)
            setError('Item not found. Please go back and try again.');
        }
    }, [itemFromState, status.LOST]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title || !formData.category || !formData.location) {
            setError('Please fill in all required fields');
            return;
        }

        if (!id) {
            setError('Item ID is missing');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Update the item in Firestore
            const itemRef = doc(db, 'items', id);
            await updateDoc(itemRef, {
                ...formData,
                updatedAt: new Date()
            });

            setSuccess(true);

            // Refresh my items and redirect after a brief delay
            await fetchMyItems();
            setTimeout(() => {
                navigate('/my-items');
            }, 1500);

        } catch (err) {
            console.error('Error updating item:', err);
            setError('Failed to update item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // If still fetching the item, show loading
    if (fetchLoading) {
        return (
            <div>
                <TopAppBar/>
                <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
                    <CircularProgress/>
                </Box>
            </div>
        );
    }

    return (
        <div>
            <TopAppBar/>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    py: 4,
                    px: 2,
                    maxWidth: 'md',
                    mx: 'auto'
                }}
            >
                <Paper elevation={3} sx={{p: 4, borderRadius: 2}}>
                    <Typography variant="h4" gutterBottom>
                        Edit Item
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{mb: 3}}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{mb: 3}}>
                            Item updated successfully!
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Status Selection */}
                            <Grid item xs={12}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">Item Status</FormLabel>
                                    <RadioGroup
                                        row
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <FormControlLabel value={status.LOST} control={<Radio/>} label="Lost Item"/>
                                        <FormControlLabel value={status.FOUND} control={<Radio/>} label="Found Item"/>
                                    </RadioGroup>
                                </FormControl>
                            </Grid>

                            {/* Title */}
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <TitleIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Description */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <DescriptionIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Category */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    select
                                    fullWidth
                                    label="Category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CategoryIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Date */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={formData.status === status.LOST ? "When did you lose it?" : "When did you find it?"}
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    InputLabelProps={{shrink: true}}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <DateIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Location */}
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LocationIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Contact */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Contact Number"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Image URL */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Image URL"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Submit Button */}
                            <Grid item xs={12}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/my-items')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24}/> : 'Save Changes'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </div>
    );
}