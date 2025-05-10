import React, {useState} from 'react';
import {
    Container,
    Typography,
    Box,
    Tabs,
    Tab,
    Paper,
    Button,
    Fade,
    Alert,
    Link,
    Divider,
    Chip
} from '@mui/material';
import {useAuth} from '../context/AuthContext';
import {useItems} from '../context/ItemsContext';
import TopAppBar from './layout/TopAppBar';
import ItemsGrid from './items/ItemsGrid';
import CategoryFilter from './items/CategoryFilter';
import {
    Add as AddIcon,
    Telegram as TelegramIcon
} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import TELEGRAM_CONFIG from '../config/telegramConfig';

export default function Dashboard() {
    const [tabValue, setTabValue] = useState(0); // 0 for Lost, 1 for Found
    const [selectedCategory, setSelectedCategory] = useState('all');
    const {currentUser} = useAuth();
    const {lostItems, foundItems, loading, error} = useItems();
    const navigate = useNavigate();

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setSelectedCategory('all'); // Reset category filter when changing tabs
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    // Filter items by category
    const getFilteredItems = () => {
        const items = tabValue === 0 ? lostItems : foundItems;

        if (selectedCategory === 'all') {
            return items;
        }

        return items.filter(item => item.category === selectedCategory);
    };

    return (
        <div>
            <TopAppBar/>
            <Container maxWidth="lg" sx={{mt: 4, mb: 8}}>
                {/* Welcome Section */}
                <Paper sx={{p: 3, mb: 4, borderRadius: 2}}>
                    <Box
                        sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                Welcome, {currentUser?.displayName || 'User'}!
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Browse lost and found items or report a new item.
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon/>}
                            onClick={() => navigate('/report-item')}
                            sx={{mt: {xs: 2, sm: 0}}}
                        >
                            Report Item
                        </Button>
                    </Box>
                </Paper>

                {/* Telegram Alert */}
                {TELEGRAM_CONFIG.ENABLED && (
                    <Alert
                        severity="info"
                        icon={<TelegramIcon sx={{color: '#0088cc'}}/>}
                        sx={{mb: 3, '& .MuiAlert-message': {width: '100%'}}}
                    >
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            flexWrap: 'wrap'
                        }}>
                            <Typography variant="body2">
                                Get instant notifications for new lost & found items on our Telegram channel!
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{color: '#0088cc', borderColor: '#0088cc', mt: {xs: 1, sm: 0}}}
                                href={`https://t.me/${TELEGRAM_CONFIG.CHANNEL_ID.replace('-100', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Join Now
                            </Button>
                        </Box>
                    </Alert>
                )}

                {/* Tabs for Lost and Found */}
                <Box sx={{borderBottom: 1, borderColor: 'divider', mb: 3}}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="lost and found tabs"
                        textColor="primary"
                        indicatorColor="primary"
                    >
                        <Tab label="Lost Items" id="lost-tab"/>
                        <Tab label="Found Items" id="found-tab"/>
                    </Tabs>
                </Box>

                {/* Category Filter */}
                <CategoryFilter
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                />

                {/* Tab Panels */}
                <Fade in={tabValue === 0} timeout={500} unmountOnExit>
                    <div hidden={tabValue !== 0}>
                        <ItemsGrid
                            items={getFilteredItems()}
                            loading={loading}
                            error={error}
                        />
                    </div>
                </Fade>
                <Fade in={tabValue === 1} timeout={500} unmountOnExit>
                    <div hidden={tabValue !== 1}>
                        <ItemsGrid
                            items={getFilteredItems()}
                            loading={loading}
                            error={error}
                        />
                    </div>
                </Fade>
            </Container>
        </div>
    );
}