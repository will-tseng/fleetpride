import { logger } from '../utils/logger';

/**
 * Generate a UUID v4 (random)
 * @returns {string} - UUID string
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

/**
 * Get current session UUID or generate a new one
 * @returns {string} - UUID for the session
 */
export const getSessionUUID = () => {
  try {
    // Try to get existing session UUID from local storage
    const sessionId = localStorage.getItem('sessionUUID');
    if (sessionId) {
      return sessionId;
    }
    
    // Generate a new UUID and store it
    const newUUID = generateUUID();
    localStorage.setItem('sessionUUID', newUUID);
    return newUUID;
  } catch (error) {
    logger.error('Error retrieving session UUID:', error);
    // Fallback to a new UUID without storing it
    return generateUUID();
  }
};
