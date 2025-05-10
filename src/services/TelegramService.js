// New file for Telegram integration service

import TELEGRAM_CONFIG from '../config/telegramConfig';

// Image proxy service to handle CORS issues
const IMAGE_PROXY = 'https://corsproxy.io/?';

/**
 * Formats an item details into a nicely formatted Telegram message
 * @param {Object} item - The lost or found item
 * @returns {string} - HTML formatted message for Telegram
 */
const formatItemMessage = (item) => {
    // Emoji based on item status
    const statusEmoji = item.status === 'lost' ? '❓' : '✅';
    const statusText = item.status === 'lost' ? 'LOST' : 'FOUND';

    // Format date if available
    const dateText = item.date ? new Date(item.date).toLocaleDateString() : 'Not specified';

    // Format contact info if available
    const contactInfo = item.contact ? `\n<b>Contact:</b> ${item.contact}` : '';

    // Format reporter info
    const reporterInfo = item.userName ?
        `\n<b>Reported by:</b> ${item.userName}` : '';

    // Format the message with HTML formatting for Telegram
    const message = `
<b>${statusEmoji} ${statusText} ITEM: ${item.title}</b>

<b>Description:</b> ${item.description || 'No description provided'}
<b>Category:</b> ${item.categoryName || item.category}
<b>Location:</b> ${item.location}
<b>Date:</b> ${dateText}${contactInfo}${reporterInfo}

<b>Item ID:</b> ${item.id}

<i>Please check the Lost and Found app for more details or to contact the reporter.</i>
`;

    return message;
};

/**
 * Generate a shortened caption for images
 * @param {Object} item - Item information
 * @returns {string} - HTML formatted caption
 */
const formatImageCaption = (item) => {
    // Emoji based on item status
    const statusEmoji = item.status === 'lost' ? '❓' : '✅';
    const statusText = item.status === 'lost' ? 'LOST' : 'FOUND';

    return `
<b>${statusEmoji} ${statusText} ITEM: ${item.title}</b>

<b>${item.status === 'lost' ? 'Lost' : 'Found'} at:</b> ${item.location}
<b>Category:</b> ${item.categoryName || item.category}
<b>Date:</b> ${item.date ? new Date(item.date).toLocaleDateString() : 'Not specified'}
<b>Description:</b> ${(item.description || '').substring(0, 50)}${item.description && item.description.length > 50 ? '...' : ''}

<b>Item ID:</b> ${item.id}
<i>See app for complete details</i>
`;
};

/**
 * Send item notification to Telegram channel
 * @param {Object} item - The item to notify about
 * @returns {Promise} - Result of the API call
 */
const sendItemNotification = async (item) => {
    // Skip if notifications are disabled
    if (!TELEGRAM_CONFIG.ENABLED) {
        if (TELEGRAM_CONFIG.DEBUG) {
            console.log('Telegram notifications disabled. Skipping notification.');
        }
        return null;
    }

    try {
        // Check if the item has an image
        if (item.imageUrl && item.imageUrl.trim() !== '') {
            // If image URL exists, send as photo with caption
            return await sendItemWithImage(item);
        } else {
            // Otherwise, send as text message
            return await sendItemAsText(item);
        }
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
        return null;
    }
};

/**
 * Send item notification as text message
 * @param {Object} item - The item to notify about
 * @returns {Promise} - Result of the API call
 */
const sendItemAsText = async (item) => {
    // Build the URL for the Telegram Bot API
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;

    // Prepare the payload
    const payload = {
        chat_id: TELEGRAM_CONFIG.CHANNEL_ID,
        text: formatItemMessage(item),
        parse_mode: "HTML"
    };

    // Send the request
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Telegram API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Item text notification sent to Telegram:', data);
    return data;
};

/**
 * Send item notification with image
 * @param {Object} item - The item to notify about
 * @returns {Promise} - Result of the API call
 */
const sendItemWithImage = async (item) => {
    try {
        // First, fetch the image from the URL
        console.log('Downloading image from URL:', item.imageUrl);

        // Handle Firebase Storage URLs specially
        let imageResponse;
        const isFirebaseStorageUrl = item.imageUrl.includes('firebasestorage.googleapis.com');

        try {
            // For Firebase Storage URLs, we need to add special headers to avoid CORS issues
            if (isFirebaseStorageUrl) {
                imageResponse = await fetch(item.imageUrl, {
                    headers: {
                        'Origin': window.location.origin,
                    },
                    mode: 'cors',
                    cache: 'no-cache',
                });
            } else {
                // For regular URLs, try direct access first
                imageResponse = await fetch(item.imageUrl);
            }

            if (!imageResponse.ok) {
                throw new Error(`Direct fetch failed: ${imageResponse.status}`);
            }
        } catch (directError) {
            console.warn('Direct image fetch failed, trying proxy:', directError);

            // Try with proxy - this works better with third-party images
            // For Firebase Storage, we add a special token parameter to avoid CORS
            const urlToProxy = isFirebaseStorageUrl
                ? `${item.imageUrl}&token=tg-proxy`
                : item.imageUrl;

            const proxiedUrl = `${IMAGE_PROXY}${encodeURIComponent(urlToProxy)}`;
            imageResponse = await fetch(proxiedUrl);

            if (!imageResponse.ok) {
                throw new Error(`Proxied image fetch failed: ${imageResponse.status} ${imageResponse.statusText}`);
            }
        }

        // Get the image blob
        const imageBlob = await imageResponse.blob();

        // Create a shorter caption for the image
        const caption = formatImageCaption(item);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CONFIG.CHANNEL_ID);

        // Add image with proper filename based on mime type
        const fileExtension = imageBlob.type.split('/')[1] || 'jpg';
        formData.append('photo', imageBlob, `item_${item.id}.${fileExtension}`);

        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');

        // Build the URL for the Telegram Bot API
        const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendPhoto`;

        // Send the request with the image file
        console.log(`Sending image to Telegram with size: ${imageBlob.size} bytes`);

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Telegram API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Item image notification uploaded to Telegram:', data);
        return data;

    } catch (error) {
        console.error('Error uploading image to Telegram:', error);
        // If there was a problem with image upload, try to send the image URL directly
        try {
            const caption = formatImageCaption(item);
            const urlPayload = {
                chat_id: TELEGRAM_CONFIG.CHANNEL_ID,
                photo: item.imageUrl, // Send the direct URL to let Telegram handle it
                caption: caption,
                parse_mode: "HTML"
            };

            console.log("Falling back to direct URL method:", item.imageUrl);
            const urlResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(urlPayload)
            });

            if (urlResponse.ok) {
                const urlData = await urlResponse.json();
                console.log('Fallback URL method succeeded:', urlData);
                return urlData;
            }
        } catch (urlError) {
            console.error('URL fallback also failed:', urlError);
        }

        // If all image methods fail, fall back to text
        console.warn('All image methods failed, falling back to text message');
        return await sendItemAsText(item);
    }
};

export {sendItemNotification};