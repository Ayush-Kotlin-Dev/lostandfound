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
    InputAdornment,
    IconButton,
    LinearProgress
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
    Phone as PhoneIcon,
    Telegram as TelegramIcon,
    Psychology as AiIcon,
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import {useAuth} from '../../context/AuthContext';
import TELEGRAM_CONFIG from '../../config/telegramConfig';
import {isTelegramNotificationDismissed, dismissTelegramNotification} from '../../utils/notificationUtils';
import {storage} from '../../firebase/config';
import {ref as storageRef, uploadBytes, getDownloadURL} from 'firebase/storage';
import {v4 as uuidv4} from 'uuid';

export default function ReportItemForm() {
    const {categories, status, reportItem} = useItems();
    const {currentUser} = useAuth();
    const navigate = useNavigate();
    const [showTelegramNotification, setShowTelegramNotification] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        date: '',
        contact: currentUser?.phoneNumber || '',
        status: status.LOST,
        imageUrl: ''
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const isDismissed = isTelegramNotificationDismissed();
        setShowTelegramNotification(!isDismissed);
    }, []);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDismissTelegramNotification = () => {
        dismissTelegramNotification();
        setShowTelegramNotification(false);
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];

            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }

            // Check file type
            if (!file.type.match('image.*')) {
                setError('Please select an image file (JPEG, PNG, etc.)');
                return;
            }

            // Clear any manually entered URL since we're uploading a file
            setFormData(prev => ({...prev, imageUrl: ''}));

            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(''); // Clear any previous errors
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);

        // Clear the file input by creating a reference to it
        const fileInput = document.getElementById('image-upload-button');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const uploadImageToStorage = async () => {
        if (!selectedImage) return null;

        try {
            setUploading(true);

            // Create a unique filename with timestamp to avoid name conflicts
            const timestamp = new Date().getTime();
            const fileName = `item-images/${currentUser.uid}/${timestamp}-${uuidv4()}-${selectedImage.name}`;
            const fileRef = storageRef(storage, fileName);

            // Start upload
            setUploadProgress(10);

            // Upload the file
            const uploadTask = await uploadBytes(fileRef, selectedImage);

            // Show progress
            setUploadProgress(60);

            // Get the download URL
            const downloadURL = await getDownloadURL(fileRef);
            setUploadProgress(100);

            return downloadURL;
        } catch (err) {
            console.error('Error uploading image:', err);
            throw new Error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.category || !formData.location) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setUploadProgress(0);

            // Upload image if selected
            let imageUrl = '';
            if (selectedImage) {
                try {
                    imageUrl = await uploadImageToStorage();
                } catch (imgError) {
                    setError('Failed to upload image. Please try again.');
                    setLoading(false);
                    setUploadProgress(0);
                    return;
                }
            } else if (formData.imageUrl?.trim()) {
                // Use the manually entered URL if no file was selected
                imageUrl = formData.imageUrl.trim();
            }

            // Create the final data object to be saved
            const finalFormData = {
                ...formData,
                imageUrl
            };

            const result = await reportItem(finalFormData);

            if (result) {
                setSuccess(true);
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

                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <AiIcon sx={{color: 'primary.main', mr: 1}}/>
                        <Typography variant="body2" color="text.secondary">
                            Our AI-powered system will automatically find potential matches between lost and found
                            items.
                        </Typography>
                    </Box>

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

                            {/* Image Upload */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Upload Image (recommended)
                                </Typography>
                                <Box sx={{mb: 2}}>
                                    <input
                                        accept="image/*"
                                        style={{display: 'none'}}
                                        id="image-upload-button"
                                        type="file"
                                        onChange={handleImageChange}
                                    />
                                    <label htmlFor="image-upload-button">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<UploadIcon/>}
                                        >
                                            Choose Image
                                        </Button>
                                    </label>
                                    {selectedImage && (
                                        <>
                                            <Typography variant="body2" sx={{ml: 2, display: 'inline'}}>
                                                {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                                            </Typography>
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={handleRemoveImage}
                                                sx={{ml: 1, verticalAlign: 'middle'}}
                                            >
                                                <DeleteIcon fontSize="small"/>
                                            </IconButton>
                                        </>
                                    )}
                                </Box>

                                {imagePreview && (
                                    <Box sx={{
                                        mt: 2,
                                        mb: 2,
                                        maxWidth: '300px',
                                        position: 'relative',
                                        display: 'inline-block'
                                    }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        />
                                        <IconButton
                                            color="error"
                                            size="small"
                                            onClick={handleRemoveImage}
                                            sx={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8,
                                                bgcolor: 'rgba(255,255,255,0.8)',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255,255,255,0.9)',
                                                }
                                            }}
                                        >
                                            <DeleteIcon fontSize="small"/>
                                        </IconButton>
                                    </Box>
                                )}

                                <Typography variant="caption" color="textSecondary">
                                    Or, alternatively, provide an image URL:
                                </Typography>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Image URL (alternative to upload)"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                    helperText="Only use this if you cannot upload an image directly"
                                    disabled={!!selectedImage}
                                />
                                {uploading && (
                                    <Box sx={{mt: 2, width: '100%'}}>
                                        <Typography variant="body2" color="primary" gutterBottom>
                                            Uploading image... {uploadProgress}%
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={uploadProgress}
                                            sx={{height: 8, borderRadius: 5}}
                                        />
                                    </Box>
                                )}
                            </Grid>

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
                                        disabled={loading || uploading}
                                    >
                                        {loading ?
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <CircularProgress size={24} sx={{mr: 1}}/>
                                                {uploadProgress > 0 && uploadProgress < 100 ?
                                                    `Uploading... ${uploadProgress}%` : 'Processing...'}
                                            </Box> :
                                            'Report Item'
                                        }
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* Telegram Info Paper */}
                {TELEGRAM_CONFIG.ENABLED && showTelegramNotification && (
                    <Paper elevation={2} sx={{p: 3, borderRadius: 2, mt: 3, bgcolor: '#f5f9ff', position: 'relative'}}>
                        <IconButton
                            aria-label="close"
                            size="small"
                            sx={{position: 'absolute', top: 8, right: 8}}
                            onClick={handleDismissTelegramNotification}
                        >
                            <CloseIcon fontSize="small"/>
                        </IconButton>

                        <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                            <TelegramIcon sx={{mr: 1, color: '#0088cc'}}/>
                            <Typography variant="h6" sx={{color: '#0088cc'}}>
                                Get Updates via Telegram
                            </Typography>
                        </Box>
                        <Typography variant="body2">
                            All reported items are automatically posted to our Telegram channel.
                            Join to get instant notifications about lost and found items!
                        </Typography>

                        <Button
                            variant="outlined"
                            startIcon={<TelegramIcon/>}
                            sx={{mt: 2, color: '#0088cc', borderColor: '#0088cc'}}
                            href={TELEGRAM_CONFIG.INVITE_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Join Telegram Channel
                        </Button>
                    </Paper>
                )}
            </Box>
        </div>
    );
}