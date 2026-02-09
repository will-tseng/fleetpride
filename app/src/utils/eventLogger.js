/**
 * Event logging utilities for consistent logging across components
 */

import { logger } from './logger';

export const logEvents = {
  /**
   * Log a search initiated event
   * @param {string} query - The search query
   * @param {string} device - Optional device type (desktop/mobile)
   * @param {string} method - Optional method of search (e.g., click, keyboard-enter)
   */
  search: (query, device = null, method = null) => {
    logger.info('Search event:', { query, device, method });
  },
  
  /**
   * Log a typeahead query event
   * @param {string} query - The typeahead query
   * @param {string} device - Optional device type
   */
  typeahead: (value, device = null) => {
    logger.info('Typeahead event:', { value, device });
  },
  
  /**
   * Log a suggestion selection event
   * @param {Object} item - The selected item
   * @param {string} device - Optional device type
   */
  suggestion: (item, device = null) => {
    logger.info('Suggestion selected:', { item: item?.name || item?.id, device });
  }
};
