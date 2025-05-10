import React, {useState, useEffect} from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Divider,
    Button,
    Card,
    CardContent,
    CardActions,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Tooltip,
    Grid,
    LinearProgress,
    Collapse
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Compare as CompareIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Title as TitleIcon,
    Description as DescriptionIcon,
    Category as CategoryIcon,
    LocationOn as LocationIcon,
    CalendarToday as DateIcon
} from '@mui/icons-material';
import {useItems} from '../../context/ItemsContext';
import {findPotentialMatches} from '../../services/ItemMatchingService';
import {useNavigate} from 'react-router-dom';

function MatchDetails({details}) {
    return (
        <List dense>
            <ListItem>
                <ListItemIcon>
                    <TitleIcon/>
                </ListItemIcon>
                <ListItemText primary="Title Match"/>
                <LinearProgress
                    variant="determinate"
                    value={details.titleMatch}
                    sx={{width: 100, ml: 2, height: 8, borderRadius: 5}}
                />
                <Typography sx={{ml: 1, minWidth: 40}}>
                    {details.titleMatch}%
                </Typography>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <DescriptionIcon/>
                </ListItemIcon>
                <ListItemText primary="Description Match"/>
                <LinearProgress
                    variant="determinate"
                    value={details.descriptionMatch}
                    sx={{width: 100, ml: 2, height: 8, borderRadius: 5}}
                />
                <Typography sx={{ml: 1, minWidth: 40}}>
                    {details.descriptionMatch}%
                </Typography>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <CategoryIcon/>
                </ListItemIcon>
                <ListItemText primary="Category Match"/>
                <LinearProgress
                    variant="determinate"
                    value={details.categoryMatch}
                    sx={{width: 100, ml: 2, height: 8, borderRadius: 5}}
                />
                <Typography sx={{ml: 1, minWidth: 40}}>
                    {details.categoryMatch}%
                </Typography>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <LocationIcon/>
                </ListItemIcon>
                <ListItemText primary="Location Match"/>
                <LinearProgress
                    variant="determinate"
                    value={details.locationMatch}
                    sx={{width: 100, ml: 2, height: 8, borderRadius: 5}}
                />
                <Typography sx={{ml: 1, minWidth: 40}}>
                    {details.locationMatch}%
                </Typography>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <DateIcon/>
                </ListItemIcon>
                <ListItemText primary="Date Match"/>
                <LinearProgress
                    variant="determinate"
                    value={details.dateMatch}
                    sx={{width: 100, ml: 2, height: 8, borderRadius: 5}}
                />
                <Typography sx={{ml: 1, minWidth: 40}}>
                    {details.dateMatch}%
                </Typography>
            </ListItem>
        </List>
    );
}

export default function PotentialMatches({item}) {
    const {lostItems, foundItems} = useItems();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMatch, setExpandedMatch] = useState(null);

    useEffect(() => {
        if (item) {
            // Find potential matches for the current item
            const allItems = [...lostItems, ...foundItems];
            const potentialMatches = findPotentialMatches(
                item,
                allItems,
                item.status,
                0.4  // Lower threshold to show more potential matches
            );
            setMatches(potentialMatches);
            setLoading(false);
        }
    }, [item, lostItems, foundItems]);

    const toggleMatchDetails = (itemId) => {
        setExpandedMatch(expandedMatch === itemId ? null : itemId);
    };

    const viewItem = (itemId) => {
        navigate(`/item/${itemId}`);
    };

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', p: 3}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (matches.length === 0) {
        return (
            <Paper sx={{p: 3, mb: 4, borderRadius: 2}}>
                <Typography variant="subtitle1" sx={{display: 'flex', alignItems: 'center'}}>
                    <ErrorIcon color="warning" sx={{mr: 1}}/>
                    No potential matches found for this item.
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                    We'll continue scanning for matches as new items are reported.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{p: 3, mb: 4, borderRadius: 2}}>
            <Typography variant="h6" mb={2} sx={{display: 'flex', alignItems: 'center'}}>
                <CompareIcon sx={{mr: 1}}/>
                AI-Powered Potential Matches
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
                Our system
                found {matches.length} potential {item.status === 'lost' ? 'found' : 'lost'} {matches.length === 1 ? 'item' : 'items'} that
                might match yours.
            </Typography>

            <Grid container spacing={2}>
                {matches.map((match) => (
                    <Grid item xs={12} key={match.item.id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Typography variant="h6">
                                        {match.item.title}
                                    </Typography>
                                    <Chip
                                        label={`${match.matchPercentage}% Match`}
                                        color={match.isHighPotentialMatch ? "success" : "primary"}
                                        variant={match.isHighPotentialMatch ? "filled" : "outlined"}
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    {match.item.description ? match.item.description.substring(0, 100) + (match.item.description.length > 100 ? '...' : '') : 'No description provided'}
                                </Typography>

                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                                    {match.item.category && (
                                        <Chip
                                            size="small"
                                            icon={<CategoryIcon/>}
                                            label={match.item.categoryName || match.item.category}
                                        />
                                    )}
                                    {match.item.location && (
                                        <Chip
                                            size="small"
                                            icon={<LocationIcon/>}
                                            label={match.item.location}
                                        />
                                    )}
                                    {match.item.date && (
                                        <Chip
                                            size="small"
                                            icon={<DateIcon/>}
                                            label={new Date(match.item.date).toLocaleDateString()}
                                        />
                                    )}
                                </Box>

                                <Collapse in={expandedMatch === match.item.id}>
                                    <Box sx={{mt: 2, bgcolor: 'background.default', borderRadius: 1, p: 1}}>
                                        <Typography variant="subtitle2" mb={1}>
                                            Match Details
                                        </Typography>
                                        <MatchDetails details={match.details}/>
                                    </Box>
                                </Collapse>
                            </CardContent>

                            <CardActions>
                                <Button
                                    size="small"
                                    onClick={() => toggleMatchDetails(match.item.id)}
                                    startIcon={expandedMatch === match.item.id ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                                >
                                    {expandedMatch === match.item.id ? 'Hide Details' : 'Show Match Details'}
                                </Button>
                                <Button
                                    size="small"
                                    color="primary"
                                    onClick={() => viewItem(match.item.id)}
                                >
                                    View Item
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}