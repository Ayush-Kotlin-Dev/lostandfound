import React from 'react';
import {Grid, Box, CircularProgress, Typography, Alert} from '@mui/material';
import ItemCard from './ItemCard';

export default function ItemsGrid({items, loading, error, itemActions}) {
    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}>
                <CircularProgress/>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{my: 2}}>
                {error}
            </Alert>
        );
    }

    if (!items || items.length === 0) {
        return (
            <Box sx={{py: 5, textAlign: 'center'}}>
                <Typography variant="body1" color="text.secondary">
                    No items found
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {items.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <ItemCard item={item} itemActions={itemActions}/>
                </Grid>
            ))}
        </Grid>
    );
}