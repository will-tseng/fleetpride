import { Box, Tooltip, CircularProgress, IconButton } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
const PdfStatusIndicator = ({ status, loading, details, error, product, onDownloadClick, downloading }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <CircularProgress size={8} sx={{ color: '#999' }} />
      </Box>
    );
  }

  // Determine color, tooltip, and clickability based on status
  let color = '#999'; // default gray
  let tooltipText = 'Unknown status';
  let isClickable = false;
  let clickAction = null;

  if (error) {
    color = '#f44336'; // red
    tooltipText = `Error checking PDF status: ${error}`;
  } else {
    switch (status) {
      case 'no_pdfs':
        color = '#999'; // gray
        tooltipText = 'No PDFs available for this product';
        break;
      case 'all_ready':
        color = '#4caf50'; // green
        tooltipText = `All ${details?.total || 0} PDFs are ready in cloud storage`;
        break;
      case 'partial_ready':
        color = '#ff9800'; // orange
        tooltipText = `${details?.inGcs || 0} of ${details?.total || 0} PDFs ready. Click to download remaining PDFs.`;
        isClickable = true;
        clickAction = () => {
          onDownloadClick && onDownloadClick(product);
        };
        break;
      case 'none_ready':
        color = '#f44336'; // red
        tooltipText = `Click to download ${details?.total || 0} PDFs to cloud storage for AI analysis`;
        isClickable = true;
        clickAction = () => {
          onDownloadClick && onDownloadClick(product);
        };
        break;
      default:
        color = '#999'; // gray
        tooltipText = 'PDF status unknown';
    }
  }

  // Show download spinner if downloading
  if (downloading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <Tooltip title="Downloading PDFs to cloud storage..." placement="top">
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <CircularProgress size={8} sx={{ color: '#ff9800' }} />
          </Box>
        </Tooltip>
      </Box>
    );
  }

  // Create the icon content
  const iconContent = (
    <FiberManualRecordIcon 
      sx={{ 
        fontSize: '10px', 
        color: color,
        filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.2))',
        cursor: isClickable ? 'pointer' : 'default'
      }} 
    />
  );

  // Always wrap in a Box container, then apply tooltip to the appropriate child
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
      {isClickable && clickAction ? (
        <Tooltip title={tooltipText} placement="top">
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clickAction();
            }}
            sx={{
              p: 0.5,
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
                borderRadius: '50%'
              }
            }}
          >
            {iconContent}
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={tooltipText} placement="top">
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            {iconContent}
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default PdfStatusIndicator;
