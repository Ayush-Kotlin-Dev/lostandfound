import React, {useState, useEffect} from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Chip,
    Button,
    Divider,
    Avatar,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Collapse,
    IconButton
} from '@mui/material';
import {
    LocationOn as LocationIcon,
    CalendarToday as DateIcon,
    Category as CategoryIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Chat as ChatIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import {useParams, useNavigate} from 'react-router-dom';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {db} from '../../firebase/config';
import TopAppBar from '../layout/TopAppBar';
import {useAuth} from '../../context/AuthContext';
import {useItems} from '../../context/ItemsContext';
import ChatBox from '../chat/ChatBox';

// Helper to format date
const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function ItemDetailsScreen() {
    const {id} = useParams();
    const {currentUser} = useAuth();
    const {status: itemStatus} = useItems();
    const navigate = useNavigate();
    const {updateUserContributions} = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for "I found this" dialog
    const [foundDialogOpen, setFoundDialogOpen] = useState(false);
    const [contactInfo, setContactInfo] = useState('');
    const [foundLocation, setFoundLocation] = useState('');
    const [foundNotes, setFoundNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [contributionPoints, setContributionPoints] = useState(0);

    // State for chat
    const [chatOpen, setChatOpen] = useState(false);

    // Fetch item details
    useEffect(() => {
        const fetchItemDetails = async () => {
            try {
                setLoading(true);
                const itemDoc = await getDoc(doc(db, 'items', id));

          if (itemDoc.exists()) {
              setItem({id: itemDoc.id, ...itemDoc.data()});
          } else {
              setError('Item not found');
        }
      } catch (error) {
          console.error('Error fetching item:', error);
          setError('Failed to load item details');
      } finally {
          setLoading(false);
      }
    };

      if (id) {
          fetchItemDetails();
      }
  }, [id]);

    // Handle "I found this" claim submission
    const handleFoundSubmit = async () => {
        if (!currentUser || !item) return;

      try {
          setSubmitting(true);

        // Update item in Firestore
        const itemRef = doc(db, 'items', id);
        await updateDoc(itemRef, {
            status: itemStatus.CLAIMED,
            claimedBy: {
                userId: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                contactInfo,
                foundLocation,
                foundNotes,
                claimedAt: new Date()
            }
        });

        // Update local state
        setItem(prev => ({
            ...prev,
            status: itemStatus.CLAIMED,
            claimedBy: {
                userId: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                contactInfo,
                foundLocation,
                foundNotes,
                claimedAt: new Date()
        }
      }));

        // Update user contributions - they found a lost item
        const points = await updateUserContributions(currentUser.uid, 'itemFound');
        setContributionPoints(points);

        setSuccessMessage(`You have successfully claimed this item! The owner will contact you soon. You earned ${points} contribution points!`);
        setFoundDialogOpen(false);
    } catch (error) {
        console.error('Error claiming item:', error);
        setError('Failed to submit your claim. Please try again.');
    } finally {
        setSubmitting(false);
    }
  };

    // Handle "This is mine" claim submission
    const handleThisIsMineSubmit = async () => {
        if (!currentUser || !item) return;

      try {
          setSubmitting(true);

        // Update item in Firestore
        const itemRef = doc(db, 'items', id);
        await updateDoc(itemRef, {
            status: itemStatus.CLAIMED,
            claimedBy: {
                userId: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                contactInfo,
                claimedAt: new Date()
        }
      });

        // Update local state
        setItem(prev => ({
            ...prev,
            status: itemStatus.CLAIMED,
            claimedBy: {
                userId: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                contactInfo,
                claimedAt: new Date()
        }
      }));

        // If this is a "found" item being returned to owner, update the finder's contribution points
        if (item.userId && item.status === itemStatus.FOUND) {
            await updateUserContributions(item.userId, 'itemReturned');
        }

        setSuccessMessage('You have successfully claimed this item! The finder will contact you soon.');
        setFoundDialogOpen(false);
    } catch (error) {
        console.error('Error claiming item:', error);
        setError('Failed to submit your claim. Please try again.');
    } finally {
        setSubmitting(false);
    }
  };

    // Get status color for the chip
    const getStatusColor = (status) => {
        switch (status) {
            case itemStatus.LOST:
                return 'error';
            case itemStatus.FOUND:
                return 'success';
            case itemStatus.CLAIMED:
                return 'warning';
            case itemStatus.RETURNED:
                return 'info';
            default:
                return 'default';
    }
  };

    // Loading state
    if (loading) {
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

    // Error state
    if (error || !item) {
    return (
        <div>
            <TopAppBar/>
            <Container maxWidth="lg" sx={{mt: 4}}>
                <Alert severity="error" sx={{my: 2}}>
                    {error || 'Item not found'}
                </Alert>
                <Button
                    variant="contained"
                    onClick={() => navigate('/dashboard')}
                    sx={{mt: 2}}
                >
                    Back to Dashboard
                </Button>
            </Container>
        </div>
    );
  }

    return (
        <div>
            <TopAppBar/>
            <Container maxWidth="lg" sx={{mt: 4, mb: 8}}>
                {successMessage && (
                    <Alert severity="success" sx={{mb: 4}}>
                        {successMessage}
                    </Alert>
                )}

          {/* Item Details Paper */}
          <Paper elevation={3} sx={{p: 4, borderRadius: 2, mb: 4}}>
              <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 3,
                  flexWrap: 'wrap'
              }}>
                  <Typography variant="h4" gutterBottom>
                      {item.title}
                  </Typography>
                  <Chip
                      label={item.status.toUpperCase()}
                      color={getStatusColor(item.status)}
                      size="medium"
                  />
              </Box>

            {item.imageUrl && (
                <Box sx={{mb: 4, borderRadius: 2, overflow: 'hidden', maxWidth: 500, mx: 'auto'}}>
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{width: '100%', display: 'block'}}
                    />
            </Box>
          )}

            {/* Category Tag */}
            <Box sx={{mb: 3}}>
                <Chip
                    icon={<CategoryIcon/>}
                    label={item.category}
                    variant="outlined"
                />
            </Box>

            {/* Description */}
            <Typography variant="h6" gutterBottom>
                Description
            </Typography>
            <Typography variant="body1" paragraph>
                {item.description || 'No description provided.'}
            </Typography>

            <Grid container spacing={3}>
                {/* Location */}
                <Grid item xs={12} md={6}>
                    <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
                        <LocationIcon sx={{mr: 1, color: 'text.secondary', mt: 0.5}}/>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                {item.status === itemStatus.LOST ? 'Lost At' : 'Found At'}
                            </Typography>
                            <Typography variant="body1">
                                {item.location}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

              {/* Date */}
              <Grid item xs={12} md={6}>
                  <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
                      <DateIcon sx={{mr: 1, color: 'text.secondary', mt: 0.5}}/>
                      <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                              {item.status === itemStatus.LOST ? 'Date Lost' : 'Date Found'}
                          </Typography>
                          <Typography variant="body1">
                              {formatDate(item.createdAt)}
                          </Typography>
                      </Box>
                  </Box>
              </Grid>

              {/* Contact Number */}
              {item.contact && (
                  <Grid item xs={12} md={6}>
                      <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
                          <PhoneIcon sx={{mr: 1, color: 'text.secondary', mt: 0.5}}/>
                          <Box>
                              <Typography variant="subtitle2" color="text.secondary">
                                  Contact Number
                    </Typography>
                      <Typography variant="body1">
                          {item.contact}
                      </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

          {/* Chat Section - Only show if the item has an owner different from current user */}
          {item && item.userId !== currentUser?.uid && (
              <Paper elevation={3} sx={{p: 4, borderRadius: 2, mb: 4}}>
                  <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                      <Typography variant="h6">
                          <ChatIcon sx={{mr: 1, verticalAlign: 'middle'}}/>
                          Private Discussion
              </Typography>
              <Button
                  variant="outlined"
                  endIcon={<ExpandMoreIcon sx={{
                      transform: chatOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                  }}/>}
                  onClick={() => setChatOpen(!chatOpen)}
              >
                  {chatOpen ? 'Close Chat' : 'Open Chat'}
              </Button>
            </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                  You can discuss privately with {item.userName || 'the user'} about
                  this {item.status === itemStatus.LOST ? 'lost' : 'found'} item.
                  Your messages can be sent anonymously if you prefer.
              </Typography>

              <Collapse in={chatOpen}>
                  <Box sx={{mt: 2}}>
                      <ChatBox
                          otherUser={{
                              userId: item.userId,
                              displayName: item.userName,
                              photoURL: item.userPhotoURL
                          }}
                          itemId={item.id}
                          itemTitle={item.title}
                      />
                  </Box>
              </Collapse>
          </Paper>
        )}

          {/* User Information Paper */}
          <Paper elevation={3} sx={{p: 4, borderRadius: 2, mb: 4}}>
              <Typography variant="h6" gutterBottom>
                  {item.status === itemStatus.LOST ? 'Posted By' : 'Found By'}
              </Typography>
              <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                  <Avatar
                      src={item.userPhotoURL}
                      alt={item.userName}
                      sx={{width: 56, height: 56, mr: 2}}
                  />
                  <Box>
                      <Typography variant="h6">
                          {item.userName || 'Anonymous User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                          {item.userEmail}
                      </Typography>
                  </Box>
              </Box>
          </Paper>

          {/* Action Buttons */}
          <Box sx={{mt: 4, display: 'flex', gap: 2}}>
              <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
              >
                  Back
              </Button>

              {/* Show "I Found This" button only for lost items that aren't claimed */}
              {item.status === itemStatus.LOST && !item.claimedBy && (
                  <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon/>}
                      onClick={() => setFoundDialogOpen(true)}
                  >
                      I Found This
                  </Button>
              )}

              {/* Show "This is Mine" button only for found items that aren't claimed */}
              {item.status === itemStatus.FOUND && !item.claimedBy && (
                  <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PersonIcon/>}
                      onClick={() => setFoundDialogOpen(true)}
                  >
                      This is Mine
                  </Button>
              )}
        </Box>

          {/* "I Found This" Dialog */}
          <Dialog open={foundDialogOpen} onClose={() => setFoundDialogOpen(false)}>
              <DialogTitle>
                  {item.status === itemStatus.LOST ? "You Found This Item?" : "This Item is Yours?"}
              </DialogTitle>
              <DialogContent>
                  <DialogContentText sx={{mb: 3}}>
                      {item.status === itemStatus.LOST
                          ? "Please provide your contact information and details about finding this item."
                          : "Please provide your contact information to claim this item."}
                  </DialogContentText>

              <Grid container spacing={2}>
                  <Grid item xs={12}>
                      <TextField
                          fullWidth
                          label="Contact Information"
                          placeholder="Phone number or email"
                          value={contactInfo}
                          onChange={(e) => setContactInfo(e.target.value)}
                          required
                          disabled={submitting}
                      />
                  </Grid>

                  {item.status === itemStatus.LOST && (
                      <>
                  <Grid item xs={12}>
                      <TextField
                          fullWidth
                          label="Where did you find it?"
                          value={foundLocation}
                          onChange={(e) => setFoundLocation(e.target.value)}
                          required
                          disabled={submitting}
                      />
                  </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Additional Notes"
                            multiline
                            rows={3}
                            value={foundNotes}
                            onChange={(e) => setFoundNotes(e.target.value)}
                            disabled={submitting}
                        />
                    </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setFoundDialogOpen(false)}
                    disabled={submitting}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color={item.status === itemStatus.LOST ? "success" : "primary"}
                    onClick={item.status === itemStatus.LOST ? handleFoundSubmit : handleThisIsMineSubmit}
                    disabled={!contactInfo || submitting}
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
}