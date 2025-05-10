/**
 * Utility functions for handling notification preferences
 */

/**
 * Check if the Telegram notification has been dismissed by the user
 * @returns {boolean} - True if notification should be hidden, false otherwise
 */
export const isTelegramNotificationDismissed = () => {
    return localStorage.getItem('telegramNotificationDismissed') === 'true';
};

/**
 * Mark the Telegram notification as dismissed
 * This will hide the notification across the app
 */
export const dismissTelegramNotification = () => {
    localStorage.setItem('telegramNotificationDismissed', 'true');
};

/**
 * Reset the dismissed state of the Telegram notification
 * This will make the notification visible again
 */
export const resetTelegramNotification = () => {
    localStorage.removeItem('telegramNotificationDismissed');
};