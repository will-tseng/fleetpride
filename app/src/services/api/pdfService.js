import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://se-demos-tools.lucidworkssales.com';

/**
 * PDF Service for handling PDF downloads and status checks
 */
export class PdfService {
  /**
   * Download PDFs to Google Cloud Storage for AI analysis
   * @param {string[]} pdfLinks - Array of PDF URLs to download
   * @param {string} productId - Optional product ID for organizing files
   * @returns {Promise<Object>} Download results and status
   */
  static async downloadPdfs(pdfLinks, productId = null) {
    try {
      
      const response = await axios.post(`${API_BASE_URL}/api/download-pdfs`, {
        pdfLinks,
        productId
      });

      return response.data;
    } catch (error) {
      console.error('❌ PDF download request failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to download PDFs'
      );
    }
  }

  /**
   * Check PDF status in Google Cloud Storage
   * @param {string[]} pdfLinks - Array of PDF URLs to check
   * @param {string} productId - Optional product ID
   * @returns {Promise<Object>} Status information for each PDF
   */
  static async checkPdfStatus(pdfLinks, productId = null) {
    try {
      const params = new URLSearchParams();
      params.append('pdfLinks', JSON.stringify(pdfLinks));
      if (productId) {
        params.append('productId', productId);
      }

      const response = await axios.get(`${API_BASE_URL}/api/pdf-status?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ PDF status check failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to check PDF status'
      );
    }
  }

  /**
   * List all PDFs in Google Cloud Storage
   * @param {string} productId - Optional product ID to filter by
   * @returns {Promise<Object>} List of PDFs in storage
   */
  static async listPdfs(productId = null) {
    try {
      const params = productId ? `?productId=${encodeURIComponent(productId)}` : '';
      const response = await axios.get(`${API_BASE_URL}/api/list-pdfs${params}`);
      return response.data;
    } catch (error) {
      console.error('❌ PDF list request failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to list PDFs'
      );
    }
  }
}

export default PdfService;
