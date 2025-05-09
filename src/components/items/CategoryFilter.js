import React from 'react';
import {Box, Chip, Typography} from '@mui/material';
import {useItems} from '../../context/ItemsContext';

export default function CategoryFilter({selectedCategory, onCategoryChange}) {
    const {categories} = useItems();

    return (
        <Box sx={{mb: 4}}>
            <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                Filter by Category
            </Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                <Chip
                    label="All"
                    color={selectedCategory === 'all' ? 'primary' : 'default'}
                    onClick={() => onCategoryChange('all')}
                    variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                />
                {categories.map((category) => (
                    <Chip
                        key={category.id}
                        label={category.label}
                        color={selectedCategory === category.id ? 'primary' : 'default'}
                        onClick={() => onCategoryChange(category.id)}
                        variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                    />
                ))}
            </Box>
        </Box>
    );
}