import { memo, useMemo, useCallback, useState, useRef } from 'react';
import { 
  Drawer, Box, Typography, Button, List, ListItem, 
  ListItemText, Switch, FormControlLabel, TextField,
  IconButton, Collapse
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const LogItem = memo(({ message, searchTerm }) => {
  const messageStr = useMemo(() => {
    return typeof message === 'object' 
      ? JSON.stringify(message, null, 2) 
      : String(message);
  }, [message]);

  const highlightedMessage = useMemo(() => {
    if (!searchTerm) return messageStr;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return messageStr.replace(regex, '<mark>$1</mark>');
  }, [messageStr, searchTerm]);

  return (
    <ListItem 
      divider
      sx={{ 
        py: 0.5, 
        px: 1,
        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
        wordBreak: 'break-word'
      }}
    >
      <ListItemText
        primary={
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              fontSize: 13,
              whiteSpace: 'pre-wrap'
            }}
            dangerouslySetInnerHTML={{ 
              __html: searchTerm ? highlightedMessage : messageStr 
            }}
          />
        }
      />
    </ListItem>
  );
});

/**
 * Virtualized log list for better performance with large log sets
 */
const VirtualizedLogList = memo(({ messages, searchTerm, maxHeight = 300 }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const listRef = useRef(null);

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    
    return messages.filter(msg => {
      const messageStr = typeof msg === 'object' 
        ? JSON.stringify(msg, null, 2) 
        : String(msg);
      return messageStr.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [messages, searchTerm]);

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(visibleRange.start, visibleRange.end);
  }, [filteredMessages, visibleRange]);

  const handleScroll = useCallback((event) => {
    const { scrollTop, clientHeight } = event.target;
    const itemHeight = 60; // Approximate height per item
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + Math.ceil(clientHeight / itemHeight) + 10, filteredMessages.length);
    
    setVisibleRange({ start, end });
  }, [filteredMessages.length]);

  if (filteredMessages.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {searchTerm ? 'No matching log messages' : 'No log messages yet'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      ref={listRef}
      onScroll={handleScroll}
      sx={{ 
        maxHeight, 
        overflowY: 'auto', 
        border: '1px solid #e0e0e0', 
        borderRadius: 1, 
        background: '#f8f8f8' 
      }}
    >
      <List dense sx={{ p: 0 }}>
        {visibleMessages.map((msg, index) => (
          <LogItem 
            key={visibleRange.start + index} 
            message={msg} 
            index={visibleRange.start + index}
            searchTerm={searchTerm}
          />
        ))}
      </List>
      {filteredMessages.length > visibleRange.end && (
        <Box sx={{ p: 1, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="caption">
            Showing {visibleRange.end} of {filteredMessages.length} messages
          </Typography>
        </Box>
      )}
    </Box>
  );
});

/**
 * Memoized API call display component
 */
const ApiCallDisplay = memo(({ lastApiCall }) => {
  const [expanded, setExpanded] = useState(false);

  const formattedParams = useMemo(() => {
    if (!lastApiCall?.params) return '';
    return JSON.stringify(lastApiCall.params, null, 2);
  }, [lastApiCall?.params]);

  if (!lastApiCall) {
    return (
      <Typography variant="body2" color="text.secondary">
        No API call recorded yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ fontSize: 14, wordBreak: 'break-all' }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>URL:</Typography>
      <Box sx={{ mb: 1, color: 'primary.main' }}>
        <a 
          href={lastApiCall.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            color: '#1976d2', 
            textDecoration: 'underline', 
            wordBreak: 'break-all' 
          }}
        >
          {lastApiCall.url}
        </a>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Parameters:
        </Typography>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ ml: 1 }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <pre style={{ 
          background: 'rgb(245, 245, 245)', 
          padding: 8, 
          borderRadius: 4, 
          fontSize: 13, 
          overflowX: 'auto',
          maxHeight: 200,
          overflowY: 'auto'
        }}>
          {formattedParams}
        </pre>
      </Collapse>
    </Box>
  );
});

/**
 * Optimized debug drawer component for development and troubleshooting
 */
const DebugDrawer = memo(({
  open,
  onClose,
  logMessages = [],
  lastApiCall = null,
  consoleLogsEnabled = false,
  onToggleConsoleLogs,
  onClearLogs
}) => {
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Memoized handlers
  const handleToggleConsoleLogs = useCallback((enabled) => {
    onToggleConsoleLogs?.(enabled);
  }, [onToggleConsoleLogs]);

  const handleClearLogs = useCallback(() => {
    setLogSearchTerm('');
    onClearLogs?.();
  }, [onClearLogs]);

  const handleClearSearch = useCallback(() => {
    setLogSearchTerm('');
  }, []);

  // Memoized external links
  const externalLinks = useMemo(() => [
    {
      label: 'Analytics Dashboard',
      url: 'https://platform.lucidworks.com/signals/b4439ded-aadf-446d-b877-05365ac276dc/',
      description: 'View search analytics and user behavior'
    },
    {
      label: 'Commerce Studio',
      url: 'https://platform.lucidworks.com/applications/em/ab21a1cf-fc0c-4c1a-bb29-5c9ea368d518/ranking-rules/search-and-browse/visual-editor?page=ed982b9d-c6c2-418d-a053-8cb1fe7e45db',
      description: 'Manage search ranking and business rules'
    }
  ], []);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ 
        sx: { 
          width: { xs: '100vw', sm: 600 }, 
          p: 3,
          maxWidth: '100vw'
        } 
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 2, 
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        bgcolor: 'background.paper',
        zIndex: 1
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Development Tools
        </Typography>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
      </Box>
      
      {/* External Links */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Quick Links
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {externalLinks.map((link, index) => (
            <Box key={index}>
              <Button
                variant="outlined"
                color="primary"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                {link.label}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {link.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      
      {/* Console Logging Toggle */}
      <Box sx={{ mt: 2, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={consoleLogsEnabled}
              onChange={(e) => handleToggleConsoleLogs(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Console Logging {consoleLogsEnabled ? '(Enabled)' : '(Disabled)'}
            </Typography>
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Toggle browser console logging for debugging purposes
        </Typography>
      </Box>
      
      {/* API Call Section */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Last Lucidworks Platform Call
        </Typography>
        <ApiCallDisplay lastApiCall={lastApiCall} />
      </Box>
      
      {/* Log Messages Section */}
      <Box sx={{ mt: 3, flex: 1, minHeight: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Log Messages ({logMessages.length})
          </Typography>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={handleClearLogs}
            disabled={logMessages.length === 0}
          >
            Clear All
          </Button>
        </Box>
        
        {/* Log search */}
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search log messages..."
            value={logSearchTerm}
            onChange={(e) => setLogSearchTerm(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: logSearchTerm && (
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem'
              }
            }}
          />
        </Box>
        
        <VirtualizedLogList 
          messages={logMessages}
          searchTerm={logSearchTerm}
          maxHeight={400}
        />
      </Box>
      
      {/* Advanced Tools (Collapsible) */}
      <Box sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
        <Button
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          startIcon={showAdvancedTools ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ mb: 1 }}
        >
          Advanced Tools
        </Button>
        
        <Collapse in={showAdvancedTools}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                // Debug data export functionality disabled
              }}
            >
              Export Debug Data to Console
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const debugData = {
                  logMessages,
                  lastApiCall,
                  timestamp: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(debugData, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `debug-data-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download Debug Data
            </Button>
          </Box>
        </Collapse>
      </Box>
    </Drawer>
  );
});

DebugDrawer.displayName = 'DebugDrawer';

export default DebugDrawer;
