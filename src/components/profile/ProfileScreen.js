import React, {useState, useEffect} from 'react';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Grid,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Card,
    CardContent,
    IconButton,
    LinearProgress,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    VerifiedUser as VerifiedUserIcon,
    EmojiEvents as TrophyIcon,
    Star as StarIcon,
    Update as UpdateIcon
} from '@mui/icons-material';
import {useAuth} from '../../context/AuthContext';
import {useItems} from '../../context/ItemsContext';
import {doc, updateDoc} from 'firebase/firestore';
import {db} from '../../firebase/config';
import {updateProfile} from 'firebase/auth';
import TopAppBar from '../layout/TopAppBar';

export default function ProfileScreen() {
    const {currentUser, userData, getUserReputationLevel} = useAuth();
    const {myItems} = useItems();

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [photoURL, setPhotoURL] = useState('');

    // Initialize form with user data
    useEffect(() => {
        if (userData) {
            setDisplayName(userData.displayName || '');
            setPhoneNumber(userData.phoneNumber || '');
            setPhotoURL(userData.photoURL || '');
        }
    }, [userData]);

    // Stats for the user
    const lostItemsCount = myItems ? myItems.filter(item => item.status === 'lost').length : 0;
    const foundItemsCount = myItems ? myItems.filter(item => item.status === 'found').length : 0;

    // User contributions
    const contributions = userData?.contributions || {
        itemsFound: 0,
        itemsReturned: 0,
        totalPoints: 0
    };

    // Get user reputation level
    const reputation = getUserReputationLevel(contributions.totalPoints);

    // Calculate progress to next level
    const getProgressToNextLevel = () => {
        const points = contributions.totalPoints || 0;

        if (points < 50) return {current: points, next: 50, progress: (points / 50) * 100};
        if (points < 100) return {current: points - 50, next: 50, progress: ((points - 50) / 50) * 100};
        if (points < 200) return {current: points - 100, next: 100, progress: ((points - 100) / 100) * 100};
        if (points < 400) return {current: points - 200, next: 200, progress: ((points - 200) / 200) * 100};
        return {current: points, next: 0, progress: 100}; // Max level
    };

    const progressData = getProgressToNextLevel();

    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            if (!currentUser) {
                setError('You need to be logged in to update your profile');
                return;
            }

            // Update displayName in Firebase Auth
            if (displayName !== currentUser.displayName) {
                await updateProfile(currentUser, {displayName});
            }

            // Update user document in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName,
                phoneNumber,
                photoURL
            });

            setSuccess(true);
            setEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset form to original values
        if (userData) {
            setDisplayName(userData.displayName || '');
            setPhoneNumber(userData.phoneNumber || '');
            setPhotoURL(userData.photoURL || '');
        }
        setEditing(false);
    };

    if (!currentUser || !userData) {
        return (
            <div>
                <TopAppBar/>
                <Container maxWidth="lg" sx={{mt: 4}}>
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
                        <CircularProgress/>
                    </Box>
                </Container>
            </div>
        );
    }

    return (
        <div>
            <TopAppBar/>
            <Container maxWidth="lg" sx={{mt: 4, mb: 8}}>
                <Grid container spacing={4}>
                    {/* Profile Information */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{p: 4, borderRadius: 2}}>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 2}}>
                                <Typography variant="h4" gutterBottom>
                                    My Profile
                                </Typography>
                                {!editing && (
                                    <Button
                                        startIcon={<EditIcon/>}
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </Box>

                            {error && <Alert severity="error" sx={{mb: 3}}>{error}</Alert>}

                            <Box sx={{display: 'flex', alignItems: 'center', mb: 4}}>
                                <Avatar
                                    src={photoURL || currentUser.photoURL}
                                    alt={displayName || currentUser.displayName}
                                    sx={{width: 100, height: 100, mr: 3}}
                                />
                                <Box>
                                    <Typography variant="h5">
                                        {userData.displayName || 'User'}
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center', mt: 0.5}}>
                                        <EmailIcon sx={{fontSize: 18, color: 'text.secondary', mr: 0.5}}/>
                                        <Typography variant="body2" color="text.secondary">
                                            {userData.email}
                                        </Typography>
                                        {currentUser.emailVerified && (
                                            <VerifiedUserIcon sx={{fontSize: 16, color: 'success.main', ml: 1}}/>
                                        )}
                                    </Box>

                                    {/* Reputation Level */}
                                    <Box sx={{display: 'flex', alignItems: 'center', mt: 1}}>
                                        <Tooltip title="Your contribution reputation level">
                                            <TrophyIcon sx={{fontSize: 20, color: reputation.color, mr: 1}}/>
                                        </Tooltip>
                                        <Typography
                                            variant="body2"
                                            sx={{fontWeight: 'bold', color: reputation.color}}
                                        >
                                            {reputation.level}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{my: 3}}/>

                            {/* Edit Form */}
                            {editing ? (
                                <Box component="form" noValidate>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Display Name"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                InputProps={{
                                                    startAdornment: <PhoneIcon sx={{color: 'action.active', mr: 1}}/>,
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Photo URL"
                                                value={photoURL}
                                                onChange={(e) => setPhotoURL(e.target.value)}
                                                helperText="Enter a URL for your profile picture"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 2}}>
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleCancel}
                                                    startIcon={<CancelIcon/>}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    onClick={handleSave}
                                                    disabled={loading}
                                                    startIcon={loading ? <CircularProgress size={24}/> : <SaveIcon/>}
                                                >
                                                    Save Changes
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) : (
                                <Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                                                Contact Information
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <EmailIcon sx={{color: 'action.active', mr: 1}}/>
                                                <Typography>
                                                    {userData.email}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        {userData.phoneNumber && (
                                            <Grid item xs={12}>
                                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                    <PhoneIcon sx={{color: 'action.active', mr: 1}}/>
                                                    <Typography>
                                                        {userData.phoneNumber}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Activity Stats */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{p: 4, borderRadius: 2, mb: 4}}>
                            <Typography variant="h5" gutterBottom>
                                Your Activity
                            </Typography>
                            <Divider sx={{my: 2}}/>

                            <Box sx={{mb: 3}}>
                                <Typography variant="body2" color="text.secondary">
                                    Account created
                                </Typography>
                                <Typography variant="body1">
                                    {userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" sx={{textAlign: 'center'}}>
                                                {lostItemsCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{textAlign: 'center'}}>
                                                Lost Items
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" sx={{textAlign: 'center'}}>
                                                {foundItemsCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{textAlign: 'center'}}>
                                                Found Items
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Contribution Stats */}
                        <Paper elevation={3} sx={{p: 4, borderRadius: 2}}>
                            <Typography variant="h5" gutterBottom>
                                Contribution Stats
                            </Typography>
                            <Divider sx={{my: 2}}/>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                        <StarIcon sx={{color: 'gold', mr: 1}}/>
                                        <Typography variant="h6">
                                            {contributions.totalPoints} Points
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" sx={{textAlign: 'center'}}>
                                                {contributions.itemsFound}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{textAlign: 'center'}}>
                                                Items Found
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" sx={{textAlign: 'center'}}>
                                                {contributions.itemsReturned}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{textAlign: 'center'}}>
                                                Items Returned
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Progress to Next Level */}
                            {progressData.next > 0 && (
                                <Box sx={{mt: 3}}>
                                    <Typography variant="body2" color="text.secondary">
                                        Progress to next level
                                    </Typography>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Box sx={{width: '100%', mr: 1}}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={progressData.progress}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: reputation.color
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{minWidth: 35}}>
                                            <Typography variant="body2"
                                                        color="text.secondary">{`${Math.round(progressData.progress)}%`}</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                                        {`${progressData.current} / ${progressData.next} points needed`}
                                    </Typography>
                                </Box>
                            )}

                            {/* Last Contribution */}
                            {contributions.lastContributionDate && (
                                <Box sx={{display: 'flex', alignItems: 'center', mt: 2}}>
                                    <UpdateIcon fontSize="small" sx={{color: 'text.secondary', mr: 1}}/>
                                    <Typography variant="body2" color="text.secondary">
                                        Last
                                        contribution: {new Date(contributions.lastContributionDate.toDate()).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={() => setSuccess(false)}
            >
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{width: '100%'}}>
                    Profile updated successfully!
                </Alert>
            </Snackbar>
        </div>
    );
}