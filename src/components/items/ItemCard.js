import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActions,
    Button,
    Chip,
    Box,
    Avatar,
    Divider
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {ITEM_STATUS} from '../../context/ItemsContext';

// Helper to format date
const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function ItemCard({item}) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/item/${item.id}`);
    };

    // Define chip color based on item status
    const getStatusColor = (status) => {
        switch (status) {
            case ITEM_STATUS.LOST:
                return 'error';
            case ITEM_STATUS.FOUND:
                return 'success';
            case ITEM_STATUS.CLAIMED:
                return 'warning';
            case ITEM_STATUS.RETURNED:
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Card sx={{maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column'}}>
            {item.imageUrl && (
                <CardMedia
                    component="img"
                    height="140"
                    image={item.imageUrl}
                    alt={item.title}
                />
            )}
            <CardContent sx={{flexGrow: 1}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2}}>
                    <Typography gutterBottom variant="h6" component="div" sx={{mb: 0}}>
                        {item.title}
                    </Typography>
                    <Chip
                        label={item.status.toUpperCase()}
                        color={getStatusColor(item.status)}
                        size="small"
                    />
                </Box>

                <Chip
                    label={item.category}
                    size="small"
                    sx={{mb: 2}}
                    variant="outlined"
                />

                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    {item.description && item.description.length > 100
                        ? `${item.description.substring(0, 100)}...`
                        : item.description}
                </Typography>

                {item.location && (
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                        <LocationIcon fontSize="small" color="action" sx={{mr: 1}}/>
                        <Typography variant="body2" color="text.secondary">
                            {item.location}
                        </Typography>
                    </Box>
                )}

                <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                    <TimeIcon fontSize="small" color="action" sx={{mr: 1}}/>
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(item.createdAt)}
                    </Typography>
                </Box>
            </CardContent>

            <Divider/>

            <Box sx={{p: 2, display: 'flex', alignItems: 'center'}}>
                <Avatar
                    src={item.userPhotoURL}
                    alt={item.userName}
                    sx={{width: 24, height: 24, mr: 1}}
                />
                <Typography variant="body2" color="text.secondary">
                    {item.userName}
                </Typography>
            </Box>

            <CardActions>
                <Button size="small" color="primary" onClick={handleViewDetails}>
                    View Details
                </Button>
                {item.status === ITEM_STATUS.LOST && (
                    <Button size="small" color="success">
                        I Found This
                    </Button>
                )}
                {item.status === ITEM_STATUS.FOUND && (
                    <Button size="small" color="primary">
                        This is Mine
                    </Button>
                )}
            </CardActions>
        </Card>
    );
}