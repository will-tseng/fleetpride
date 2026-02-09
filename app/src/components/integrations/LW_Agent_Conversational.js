import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Snackbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import aiAnswerIcon from '@assets/icons/ai.svg';
import userIcon from '@assets/icons/user.svg';
import headerIcon from '@assets/icons/header.svg';
import {
  fetchBotResponse,
  fetchBotResponseStreaming,
  createConversationRequest,
  clearRequestCache
} from '@services/conversationalService';
import { getUserFriendlyError, logError } from '@utils/errorHandling';

// Development-only logging helper
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Generate a unique session ID for this browser tab/session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const LW_Agent_Conversational = ({ product, hideHeader = false }) => {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memoryUuid, setMemoryUuid] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const hasInitialized = useRef(false);
  const sessionId = useRef(generateSessionId()); // Unique session ID for this user/tab

  // Get storage key unique to this user session and product
  const getMemoryUuidKey = useCallback(() => {
    const productId = product?.id || product?.unique_id || product?.product_id;
    return `memoryUuid_${sessionId.current}_${productId}`;
  }, [product]);

  // Save memoryUuid to localStorage with user session isolation
  const saveMemoryUuid = useCallback((uuid) => {
    try {
      const key = getMemoryUuidKey();
      if (uuid) {
        localStorage.setItem(key, uuid);
        devLog('Memory UUID saved for user session:', uuid);
      } else {
        localStorage.removeItem(key);
        devLog('Memory UUID cleared for user session');
      }
    } catch (error) {
      devLog('Failed to save memory UUID to localStorage:', error);
    }
  }, [getMemoryUuidKey]);

  // Load memoryUuid from localStorage for this user session
  const loadMemoryUuid = useCallback(() => {
    try {
      const key = getMemoryUuidKey();
      const storedUuid = localStorage.getItem(key);
      if (storedUuid) {
        setMemoryUuid(storedUuid);
        devLog('Restored memory UUID for user session:', storedUuid);
        return storedUuid;
      }
    } catch (error) {
      devLog('Failed to load memory UUID from localStorage:', error);
    }
    return null;
  }, [getMemoryUuidKey]);

  // Update memoryUuid and persist it
  const updateMemoryUuid = useCallback((uuid) => {
    setMemoryUuid(uuid);
    saveMemoryUuid(uuid);
  }, [saveMemoryUuid]);

  // Optimized scroll behavior with debouncing
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Single optimized scroll effect
  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [conversations.length, scrollToBottom]); // Only trigger on conversation count change

  // Simple component initialization with user session persistence
  useEffect(() => {
    if (product && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Try to restore existing memory UUID for this user session
      const restoredUuid = loadMemoryUuid();
      
      // Clear request cache for this product to ensure fresh requests
      const productId = product?.id || product?.unique_id || product?.product_id;
      clearRequestCache(productId);
      
      devLog('Q&A session started for user session:', sessionId.current);
      if (restoredUuid) {
        devLog('Restored existing conversation memory for this user');
      } else {
        devLog('Starting fresh conversation - will get new UUID on first question');
      }
    }
  }, [product, loadMemoryUuid]);

  const suggestionQuestions = useMemo(() => [
    'How has this been rated for outdoor use?',
    'What is the minimum ceiling height required for safe installation?', 
    'What are the dimensions of this fan?'
  ], []);

  const handleQuestionSubmit = useCallback(async () => {
    if (!question.trim() || loading) return;
    
    setShowSuggestions(false);
    
    const userQuestion = question.trim();
    const userMessageId = Date.now();
    const botMessageId = userMessageId + 10;
    
    // Batch state updates
    setConversations(prev => [
      ...prev, 
      { id: userMessageId, type: 'user', message: userQuestion, timestamp: new Date() },
      { id: botMessageId, type: 'bot', message: '', timestamp: new Date(), success: true, isStreaming: false }
    ]);
    setQuestion('');
    setLoading(true);
    setError(null);
    
    try {
      const requestBody = createConversationRequest(product, userQuestion, memoryUuid);
      
      // Real-time streaming handler
      const handleStreamingChunk = (accumulatedText, isComplete) => {
        devLog('🎬 UI streaming update received:', {
          textLength: accumulatedText.length,
          isComplete,
          textPreview: accumulatedText.substring(0, 100) + (accumulatedText.length > 100 ? '...' : ''),
          botMessageId,
          timestamp: new Date().toISOString()
        });
        
        setConversations(prev => prev.map(msg => 
          msg.id === botMessageId
            ? { ...msg, message: accumulatedText, isStreaming: !isComplete, success: true }
            : msg
        ));
        
        // Auto-scroll as content streams in
        if (isComplete || accumulatedText.length % 100 === 0) {
          requestAnimationFrame(scrollToBottom);
        }
        
        devLog('✅ UI state updated for streaming chunk');
      };
      
      let data;
      try {
        // Try streaming first
        devLog('🌊 Attempting streaming API call');
        devLog('📋 About to call fetchBotResponseStreaming with:', {
          requestBody,
          hasStreamingHandler: typeof handleStreamingChunk === 'function'
        });
        
        data = await fetchBotResponseStreaming(requestBody, handleStreamingChunk);
        
        devLog('✅ Streaming API call completed:', {
          hasData: Boolean(data),
          dataStructure: data ? Object.keys(data) : [],
          predictionsCount: data?.predictions?.length || 0,
          fullData: data
        });
      } catch (streamingError) {
        devLog('⚠️ Streaming failed, falling back to regular API:', {
          errorMessage: streamingError.message,
          errorName: streamingError.name,
          errorStack: streamingError.stack
        });
        // Fallback to regular API if streaming fails
        data = await fetchBotResponse(requestBody);
        
        // For fallback, display response immediately
        if (data.predictions?.[0]) {
          const responseMessage = data.predictions[0].response || data.predictions[0].content || 'The AI service responded but no content was received.';
          setConversations(prev => prev.map(msg => 
            msg.id === botMessageId
              ? { ...msg, message: responseMessage, isStreaming: false, success: true }
              : msg
          ));
        }
      }
      
      // Extract memoryUuid from response if we don't have one
      if (!memoryUuid && data.predictions?.[0]?.memoryUuid) {
        updateMemoryUuid(data.predictions[0].memoryUuid);
        devLog('New memory UUID acquired for user session:', data.predictions[0].memoryUuid);
      }
      
      setLoading(false);
      
    } catch (error) {
      // Use centralized error handling
      logError(error, {
        componentName: 'LW_Agent_Conversational',
        context: 'Question submission',
        question: userQuestion
      });

      const friendlyError = getUserFriendlyError(error);

      // Simple error handling with user session isolation
      if (error.message?.includes('400') && memoryUuid) {
        updateMemoryUuid(null); // Clear potentially expired UUID for this user
        const productId = product?.id || product?.unique_id || product?.product_id;
        clearRequestCache(productId);
        devLog('Cleared expired memory UUID for user session');
      }

      setConversations(prev => prev.map(msg =>
        msg.id === botMessageId ? { ...msg, message: friendlyError.message, isStreaming: false, success: false } : msg
      ));
      setError(null);
      setLoading(false);
    }
  }, [question, loading, memoryUuid, product, updateMemoryUuid, scrollToBottom]);

  const handleSuggestionClick = useCallback(async (suggestionText) => {
    if (loading) return;
    
    setShowSuggestions(false);
    
    const userMessageId = Date.now();
    const botMessageId = userMessageId + 10;
    
    // Batch state updates
    setConversations(prev => [
      ...prev, 
      { id: userMessageId, type: 'user', message: suggestionText, timestamp: new Date() },
      { id: botMessageId, type: 'bot', message: '', timestamp: new Date(), success: true, isStreaming: false }
    ]);
    setLoading(true);
    setError(null);
    
    try {
      const requestBody = createConversationRequest(product, suggestionText, memoryUuid);
      
      // Real-time streaming handler for suggestions
      const handleStreamingChunk = (accumulatedText, isComplete) => {
        setConversations(prev => prev.map(msg => 
          msg.id === botMessageId
            ? { ...msg, message: accumulatedText, isStreaming: !isComplete, success: true }
            : msg
        ));
        
        // Auto-scroll as content streams in
        if (isComplete || accumulatedText.length % 100 === 0) {
          requestAnimationFrame(scrollToBottom);
        }
      };
      
      let data;
      try {
        // Try streaming first
        devLog('🌊 Attempting streaming API call for suggestion');
        data = await fetchBotResponseStreaming(requestBody, handleStreamingChunk);
      } catch (streamingError) {
        devLog('⚠️ Streaming failed for suggestion, falling back to regular API:', streamingError.message);
        // Fallback to regular API if streaming fails
        data = await fetchBotResponse(requestBody);
        
        // For fallback, display response immediately
        if (data.predictions?.[0]) {
          const responseMessage = data.predictions[0].response || data.predictions[0].content || 'The AI service responded but no content was received.';
          setConversations(prev => prev.map(msg => 
            msg.id === botMessageId
              ? { ...msg, message: responseMessage, isStreaming: false, success: true }
              : msg
          ));
        }
      }
      
      // Extract memoryUuid from response if we don't have one
      if (!memoryUuid && data.predictions?.[0]?.memoryUuid) {
        updateMemoryUuid(data.predictions[0].memoryUuid);
        devLog('New memory UUID acquired from suggestion for user session:', data.predictions[0].memoryUuid);
      }
      
      setLoading(false);
      
    } catch (error) {
      // Use centralized error handling
      logError(error, {
        componentName: 'LW_Agent_Conversational',
        context: 'Suggestion click',
        suggestion: suggestionText
      });

      const friendlyError = getUserFriendlyError(error);

      // Simple error handling with user session isolation
      if (error.message?.includes('400') && memoryUuid) {
        updateMemoryUuid(null); // Clear potentially expired UUID for this user
        const productId = product?.id || product?.unique_id || product?.product_id;
        clearRequestCache(productId);
        devLog('Cleared expired memory UUID for user session');
      }

      setConversations(prev => prev.map(msg =>
        msg.id === botMessageId ? { ...msg, message: friendlyError.message, isStreaming: false, success: false } : msg
      ));
      setError(null);
      setLoading(false);
    }
  }, [loading, memoryUuid, product, updateMemoryUuid, scrollToBottom]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      handleQuestionSubmit();
    }
  }, [handleQuestionSubmit]);

  const handleCopyToClipboard = useCallback(async (text, messageId) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setCopiedMessageId(messageId);
      setShowCopySnackbar(true);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  // Simplified memory clear function with user session isolation
  const handleClearMemory = useCallback(() => {
    updateMemoryUuid(null);
    setConversations([]);
    setShowSuggestions(true);
    
    // Clear request cache for this product
    const productId = product?.id || product?.unique_id || product?.product_id;
    clearRequestCache(productId);
    
    devLog('Memory and conversation history cleared for user session');
  }, [product, updateMemoryUuid]);

  const handleFeedback = useCallback((messageId, feedback) => {
    // You can implement feedback tracking here
    devLog(`Feedback for message ${messageId}: ${feedback}`);
  }, []);

  // Memoized message bubble component for better performance
  const MessageBubble = memo(({ message }) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'bot' && !message.success;
    const isStreaming = message.isStreaming;
    
    // Memoized styles
    const userStyles = useMemo(() => ({
      maxWidth: '90%', 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: 1
    }), []);
    
    const botStyles = useMemo(() => ({
      maxWidth: '90%', 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1
    }), []);
    
    const paperStyles = useMemo(() => ({
      px: 1, 
      py: 0.5, 
      backgroundColor: '#f3f4f6', 
      color: '#374151', 
      borderRadius: 2, 
      maxWidth: '100%', 
      minWidth: '80px', 
      border: '1px solid #e5e7eb', 
      boxShadow: 'none'
    }), []);
    
    const typographyStyles = useMemo(() => ({
      lineHeight: 1.4, 
      whiteSpace: 'pre-wrap', 
      wordBreak: 'break-word', 
      fontSize: '0.85rem'
    }), []);
    
    return (
      <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5, alignItems: 'flex-start', gap: 1 }}>
        {!isUser && (
          <Avatar sx={{ width: 28, height: 28, bgcolor: '#53717C', fontSize: '0.75rem' }}>
            <img src={aiAnswerIcon} alt="AI" style={{ width: '16px', height: '16px' }} />
          </Avatar>
        )}
        {isUser ? (
          <Box sx={userStyles}>
            <Paper elevation={0} sx={paperStyles}>
              <Typography variant="body2" sx={typographyStyles}>
                {message.message}
              </Typography>
            </Paper>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#B68C5C', fontSize: '0.75rem' }}>
              <img src={userIcon} alt="User" style={{ width: '16px', height: '16px' }} />
            </Avatar>
          </Box>
        ) : (
          <Box sx={{ maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={botStyles}>
              {message.message === '' && loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={12} sx={{ color: '#53717C' }} />
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    Thinking...
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ ...typographyStyles, color: '#374151' }}>
                  {isError ? 'Sorry, something went wrong. Please try again.' : message.message}
                  {isStreaming && (
                    <Box component="span" sx={{ display: 'inline-block', width: '8px', height: '16px', backgroundColor: '#374151', marginLeft: '2px', animation: 'blink 1s infinite', verticalAlign: 'text-bottom' }} />
                  )}
                </Typography>
              )}
            </Box>
            {!isError && message.message && !isStreaming && (
              <Box sx={{ display: 'flex', gap: 0.5, ml: 0, opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}>
                <IconButton
                  size="small"
                  onClick={() => handleCopyToClipboard(message.message, message.id)}
                  sx={{ 
                    color: copiedMessageId === message.id ? '#22c55e' : '#6b7280',
                    fontSize: '0.7rem',
                    width: '20px',
                    height: '20px',
                    '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.1)' }
                  }}
                  title={copiedMessageId === message.id ? 'Copied!' : 'Copy response'}
                >
                  <ContentCopyIcon sx={{ fontSize: '12px' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleFeedback(message.id, 'positive')}
                  sx={{ 
                    color: '#6b7280', 
                    fontSize: '0.7rem',
                    width: '20px',
                    height: '20px',
                    '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#22c55e' }
                  }}
                  title="Good response"
                >
                  <ThumbUpIcon sx={{ fontSize: '12px' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleFeedback(message.id, 'negative')}
                  sx={{ 
                    color: '#6b7280', 
                    fontSize: '0.7rem',
                    width: '20px',
                    height: '20px',
                    '&:hover': { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#ef4444' }
                  }}
                  title="Poor response"
                >
                  <ThumbDownIcon sx={{ fontSize: '12px' }} />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  });
  
  MessageBubble.displayName = 'MessageBubble';

  // Memoized container styles
  const containerStyles = useMemo(() => ({
    height: '100%',
    minHeight: '600px',
    maxHeight: '600px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 2,
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  }), []);

  const chatContainerStyles = useMemo(() => ({
    flex: 1, 
    overflowY: 'auto', 
    p: 2, 
    display: 'flex', 
    flexDirection: 'column', 
    backgroundColor: '#fff'
  }), []);

  const headerStyles = useMemo(() => ({
    py: 0.5, 
    px: 1, 
    borderBottom: '1px solid #e2e8f0', 
    backgroundColor: '#53717C', 
    flexShrink: 0
  }), []);

  const inputBoxStyles = useMemo(() => ({
    p: 2, 
    backgroundColor: '#fff', 
    borderTop: '1px solid #e2e8f0',
    position: 'sticky',
    bottom: 0,
    zIndex: 1
  }), []);

  const placeholderText = 'Type your question here...';

  return (
    <>
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
      <Box sx={containerStyles}>
        {!hideHeader && (
          <Box sx={headerStyles}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#53717C' }}>
                <img src={headerIcon} alt="Product Q&A Agent" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>
                  Product Q&A Agent
                </Typography>
                {process.env.NODE_ENV === 'development' && memoryUuid && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
                    Memory: {memoryUuid.substring(0, 8)}...
                  </Typography>
                )}
              </Box>
              {conversations.length > 0 && (
                <IconButton
                  onClick={handleClearMemory}
                  size="small"
                  sx={{ 
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  title="Clear memory and conversation"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
        )}
        <Box ref={chatContainerRef} sx={chatContainerStyles}>
          {conversations.length === 0 && !loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 300 }}>
                I'm here to help you learn more about this product. Ask me anything!
              </Typography>
              
              {showSuggestions && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                    Try asking:
                  </Typography>
                  {suggestionQuestions.map((suggestion, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        px: 1, 
                        py: 0.5, 
                        backgroundColor: '#f3f4f6', 
                        color: '#374151', 
                        borderRadius: 2, 
                        maxWidth: '400px', 
                        minWidth: '200px', 
                        border: '1px solid #e5e7eb', 
                        boxShadow: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#e5e7eb',
                          borderColor: '#d1d5db'
                        }
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{
                          lineHeight: 1.4, 
                          whiteSpace: 'pre-wrap', 
                          wordBreak: 'break-word', 
                          fontSize: '0.85rem'
                        }}
                      >
                        {suggestion}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {conversations.map((message, idx) => (
            <React.Fragment key={message.id}>
              <MessageBubble message={message} />
              {message.type === 'bot' && idx < conversations.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <div ref={messagesEndRef} />
        </Box>
        <Box sx={inputBoxStyles}>
          <TextField
            fullWidth
            size="small"
            placeholder={placeholderText}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={handleQuestionSubmit}
                    disabled={!question.trim() || loading}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: '20px',
                backgroundColor: '#f8fafc'
              }
            }}
          />
        </Box>
        <Snackbar
          open={showCopySnackbar}
          autoHideDuration={2000}
          onClose={() => setShowCopySnackbar(false)}
          message="Response copied to clipboard"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Box>
    </>
  );
};

export default memo(LW_Agent_Conversational);