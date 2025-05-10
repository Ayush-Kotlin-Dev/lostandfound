// AI-powered item matching service
// This service helps match lost items with found items using similarity algorithms

/**
 * Calculate string similarity using Levenshtein distance algorithm
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} - Similarity score (0-1) where 1 is perfect match
 */
const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;

    // Convert both strings to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Calculate Levenshtein distance
    const track = Array(s2.length + 1).fill(null).map(() =>
        Array(s1.length + 1).fill(null));

    for (let i = 0; i <= s1.length; i += 1) {
        track[0][i] = i;
    }

    for (let j = 0; j <= s2.length; j += 1) {
        track[j][0] = j;
    }

    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator, // substitution
            );
        }
    }

    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1; // Both strings are empty

    // Convert distance to similarity score (1 - normalized_distance)
    return 1 - (track[s2.length][s1.length] / maxLength);
};

/**
 * Calculate date proximity score between two dates
 * @param {string} date1 - First date
 * @param {string} date2 - Second date
 * @returns {number} - Proximity score (0-1) where 1 is perfect match
 */
const calculateDateProximity = (date1, date2) => {
    if (!date1 || !date2) return 0.5; // Neutral score if either date is missing

    try {
        const d1 = new Date(date1);
        const d2 = new Date(date2);

        // Calculate difference in days
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Score decreases with distance, max distance considered is 30 days
        return Math.max(0, 1 - (diffDays / 30));
    } catch (error) {
        console.error('Error comparing dates:', error);
        return 0.5; // Neutral score on error
    }
};

/**
 * Calculate location similarity score
 * @param {string} loc1 - First location string
 * @param {string} loc2 - Second location string
 * @returns {number} - Similarity score (0-1)
 */
const calculateLocationSimilarity = (loc1, loc2) => {
    if (!loc1 || !loc2) return 0.3; // Lower score if either location is missing

    // Check for exact building/area matches first
    const location1 = loc1.toLowerCase();
    const location2 = loc2.toLowerCase();

    // Split locations into words and check for common significant words
    const words1 = location1.split(/\s+/);
    const words2 = location2.split(/\s+/);

    // Common buildings or areas that might be mentioned
    const significantWords = ['library', 'cafeteria', 'dorm', 'hall', 'building',
        'classroom', 'lab', 'gym', 'field', 'center', 'court', 'parking', 'auditorium'];

    // Find if both locations mention the same significant area
    for (const word of significantWords) {
        if (location1.includes(word) && location2.includes(word)) {
            return 0.9; // High match if both mention the same significant area
        }
    }

    // Check word overlap
    const commonWords = words1.filter(word => words2.includes(word)).length;
    const totalUniqueWords = new Set([...words1, ...words2]).size;

    if (totalUniqueWords === 0) return 0.3;

    return 0.3 + (0.6 * commonWords / totalUniqueWords);
};

/**
 * Calculate category similarity score
 * @param {string} cat1 - First category
 * @param {string} cat2 - Second category
 * @returns {number} - Similarity score (0-1)
 */
const calculateCategorySimilarity = (cat1, cat2) => {
    if (cat1 === cat2) return 1.0; // Perfect match
    if (!cat1 || !cat2) return 0.0; // No match if either is missing
    return 0.0; // No partial matches for categories
};

/**
 * Calculate overall matching score between a lost and found item
 * @param {Object} lostItem - The lost item object
 * @param {Object} foundItem - The found item object
 * @returns {Object} - Match result with score and details
 */
const calculateItemMatchScore = (lostItem, foundItem) => {
    // Weight factors for different components
    const weights = {
        title: 0.30,
        description: 0.25,
        category: 0.20,
        location: 0.15,
        date: 0.10
    };

    // Calculate individual similarity scores
    const titleScore = calculateStringSimilarity(lostItem.title, foundItem.title);
    const descriptionScore = calculateStringSimilarity(lostItem.description, foundItem.description);
    const categoryScore = calculateCategorySimilarity(lostItem.category, foundItem.category);
    const locationScore = calculateLocationSimilarity(lostItem.location, foundItem.location);
    const dateScore = calculateDateProximity(lostItem.date, foundItem.date);

    // Calculate weighted total score
    const totalScore = (
        (titleScore * weights.title) +
        (descriptionScore * weights.description) +
        (categoryScore * weights.category) +
        (locationScore * weights.location) +
        (dateScore * weights.date)
    );

    // Return detailed match information
    return {
        score: totalScore,
        matchPercentage: Math.round(totalScore * 100),
        details: {
            titleMatch: Math.round(titleScore * 100),
            descriptionMatch: Math.round(descriptionScore * 100),
            categoryMatch: Math.round(categoryScore * 100),
            locationMatch: Math.round(locationScore * 100),
            dateMatch: Math.round(dateScore * 100)
        },
        isHighPotentialMatch: totalScore >= 0.70
    };
};

/**
 * Find potential matches for a given item
 * @param {Object} targetItem - The item to find matches for
 * @param {Array} itemsToSearch - Array of items to search through
 * @param {string} targetType - Type of target item ('lost' or 'found')
 * @param {number} threshold - Minimum match score threshold (0.0-1.0)
 * @returns {Array} - Array of potential matches with scores
 */
const findPotentialMatches = (targetItem, itemsToSearch, targetType = 'lost', threshold = 0.5) => {
    // Only search for opposite item types (lost→found, found→lost)
    const oppositeType = targetType === 'lost' ? 'found' : 'lost';
    const validItemsToSearch = itemsToSearch.filter(item => item.status === oppositeType);

    // Calculate match scores for all valid items
    const matchResults = validItemsToSearch.map(item => {
        const matchResult = calculateItemMatchScore(targetType === 'lost' ? targetItem : item,
            targetType === 'lost' ? item : targetItem);

        return {
            item: item,
            ...matchResult
        };
    });

    // Filter items that meet the threshold and sort by score (highest first)
    return matchResults
        .filter(match => match.score >= threshold)
        .sort((a, b) => b.score - a.score);
};

export {findPotentialMatches};