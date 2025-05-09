import React, {useState} from 'react';
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
import {useNavigate} from 'react-router-dom';
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

export default function ReportItemForm() {
    const {categories, status, reportItem} = useItems();
    const {currentUser} = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        date: '',
        contact: currentUser?.phoneNumber || '',
        status: status.LOST,
        imageUrl: '' // In a real app, you'd implement file upload
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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

        try {
            setLoading(true);
            setError('');

            const result = await reportItem(formData);

            if (result) {
                setSuccess(true);
                // Redirect to dashboard after a brief delay
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            }
        } catch (err) {
            setError('Failed to report item. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
                        Report an Item
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{mb: 3}}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{mb: 3}}>
                            Item reported successfully!
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Status Selection */}
                            <Grid item xs={12}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">What are you reporting?</FormLabel>
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
                                    placeholder="e.g. Blue Backpack, iPhone 13, Student ID Card"
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
                                    placeholder="Please provide details about the item (color, brand, identifying features, etc.)"
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
                                    label={formData.status === status.LOST ? "Where did you lose it?" : "Where did you find it?"}
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Library, Cafeteria, Parking Lot"
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
                                    label="Contact Number (optional)"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    placeholder="Your phone number for contact"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Image URL (In a real app, you'd implement file upload) */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Image URL (optional)"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </Grid>

                            {/* Submit Button */}
                            <Grid item xs={12}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24}/> : 'Report Item'}
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