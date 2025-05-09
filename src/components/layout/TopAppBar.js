import React, {useState} from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    InputBase,
    Badge,
    Avatar,
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    AccountCircle,
    Notifications as NotificationsIcon,
    Menu as MenuIcon,
    Add as AddIcon,
    Dashboard as DashboardIcon,
    Bookmark as BookmarkIcon,
    ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import {alpha, styled} from '@mui/material/styles';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

// Styled components
const SearchContainer = styled('div')(({theme}) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({theme}) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({theme}) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

export default function TopAppBar() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const {currentUser, userData, logout} = useAuth();
    const navigate = useNavigate();

    const isMenuOpen = Boolean(anchorEl);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <DashboardIcon/>,
            onClick: () => navigate('/dashboard')
        },
        {
            text: 'My Items',
            icon: <BookmarkIcon/>,
            onClick: () => navigate('/my-items')
        },
        {
            text: 'Report Item',
            icon: <AddIcon/>,
            onClick: () => navigate('/report-item')
        },
        {
            text: 'Logout',
            icon: <ExitToAppIcon/>,
            onClick: handleLogout
        }
    ];

    const drawer = (
        <div>
            <Box sx={{p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
                <Avatar
                    src={currentUser?.photoURL || ""}
                    alt={currentUser?.displayName || "User"}
                    sx={{width: 64, height: 64, mb: 1}}
                />
                <Typography variant="h6" noWrap component="div">
                    {currentUser?.displayName || "User"}
                </Typography>
            </Box>
            <Divider/>
            <List>
                {menuItems.map((item, index) => (
                    <ListItem button key={item.text} onClick={item.onClick}>
                        <ListItemIcon>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text}/>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={() => {
                handleMenuClose();
                navigate('/profile');
            }}>Profile</MenuItem>
            <MenuItem onClick={() => {
                handleMenuClose();
                navigate('/my-items');
            }}>My Items</MenuItem>
            <MenuItem onClick={() => {
                handleMenuClose();
                handleLogout();
            }}>Logout</MenuItem>
        </Menu>
    );

    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        sx={{mr: 2}}
                        onClick={handleDrawerToggle}
                    >
                        <MenuIcon/>
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{display: {xs: 'none', sm: 'block'}}}
                    >
                        Lost and Found
                    </Typography>
                    <SearchContainer>
                        <SearchIconWrapper>
                            <SearchIcon/>
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder="Search…"
                            inputProps={{'aria-label': 'search'}}
                        />
                    </SearchContainer>
                    <Box sx={{flexGrow: 1}}/>
                    <Box sx={{display: {xs: 'none', md: 'flex'}}}>
                        <Button
                            color="inherit"
                            startIcon={<AddIcon/>}
                            onClick={() => navigate('/report-item')}
                        >
                            Report Item
                        </Button>
                        <IconButton
                            size="large"
                            aria-label="show 17 new notifications"
                            color="inherit"
                        >
                            <Badge badgeContent={0} color="error">
                                <NotificationsIcon/>
                            </Badge>
                        </IconButton>
                        <IconButton
                            size="large"
                            edge="end"
                            aria-label="account of current user"
                            aria-haspopup="true"
                            onClick={handleProfileMenuOpen}
                            color="inherit"
                        >
                            {currentUser?.photoURL ? (
                                <Avatar src={currentUser.photoURL} alt={currentUser.displayName}
                                        sx={{width: 32, height: 32}}/>
                            ) : (
                                <AccountCircle/>
                            )}
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                }}
                sx={{
                    display: {xs: 'block', sm: 'none'},
                    '& .MuiDrawer-paper': {boxSizing: 'border-box', width: 240},
                }}
            >
                {drawer}
            </Drawer>
            {renderMenu}
        </Box>
    );
}