import React, { createContext, useState, useContext } from 'react';

// Create a context for the FAQ visibility state
const FaqContext = createContext();

// Provider component for the FAQ context
export const FaqProvider = ({ children }) => {
  const [isFaqVisible, setIsFaqVisible] = useState(false);

  const toggleFaqVisibility = () => {
    setIsFaqVisible(prevState => !prevState);
  };

  return (
    <FaqContext.Provider value={{ isFaqVisible, toggleFaqVisibility }}>
      {children}
    </FaqContext.Provider>
  );
};

// Custom hook to consume the FAQ context
export const useFaq = () => {
  const context = useContext(FaqContext);
  if (context === undefined) {
    throw new Error('useFaq must be used within an FaqProvider');
  }
  return context;
};
