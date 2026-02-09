import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AuthOverlay from '../components/auth/AuthOverlay';

// Sample users for demo purposes
const DEMO_USERS = [
  { id: 'user1', name: 'Sarah Johnson', email: 'sarah.johnson@acme.com', company: 'Acme Corp', role: 'Procurement Manager' },
  { id: 'user2', name: 'Michael Chen', email: 'michael.chen@techstart.io', company: 'TechStart', role: 'Office Manager' },
  { id: 'user3', name: 'Emily Rodriguez', email: 'emily.r@designstudio.com', company: 'Design Studio', role: 'Interior Designer' },
  { id: 'user4', name: 'James Wilson', email: 'jwilson@hospitalitygroup.com', company: 'Hospitality Group', role: 'Purchasing Director' },
];

const OVERLAY_DURATION = 3000; // 3 seconds
const HALFWAY_POINT = OVERLAY_DURATION / 2; // 1.5 seconds
const STORAGE_KEY = 'lucidHome_currentUser';

// Helper to get initial user from localStorage
const getInitialUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const userId = JSON.parse(stored);
      return DEMO_USERS.find(u => u.id === userId) || null;
    }
  } catch (e) {
    console.error('Failed to load user from localStorage:', e);
  }
  return null;
};

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getInitialUser);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayState, setOverlayState] = useState({ isSigningIn: true, userName: '', secondaryMessage: '' });

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.id));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save user to localStorage:', e);
    }
  }, [currentUser]);

  const signIn = useCallback((userId) => {
    const user = DEMO_USERS.find(u => u.id === userId);
    if (user) {
      // Show overlay with welcome message
      setOverlayState({ isSigningIn: true, userName: user.name, secondaryMessage: '' });
      setShowOverlay(true);

      // At halfway point: show secondary message and update the user (UI changes)
      setTimeout(() => {
        setOverlayState(prev => ({ ...prev, secondaryMessage: 'Updating your experience' }));
        setCurrentUser(user);
      }, HALFWAY_POINT);

      // Hide overlay after full duration
      setTimeout(() => {
        setShowOverlay(false);
        setOverlayState(prev => ({ ...prev, secondaryMessage: '' }));
      }, OVERLAY_DURATION);
    }
  }, []);

  const signOut = useCallback(() => {
    // Show overlay with logging out message
    setOverlayState({ isSigningIn: false, userName: '', secondaryMessage: '' });
    setShowOverlay(true);

    // At halfway point: show secondary message and clear the user (UI changes)
    setTimeout(() => {
      setOverlayState(prev => ({ ...prev, secondaryMessage: 'Updating your experience' }));
      setCurrentUser(null);
    }, HALFWAY_POINT);

    // Hide overlay after full duration
    setTimeout(() => {
      setShowOverlay(false);
      setOverlayState(prev => ({ ...prev, secondaryMessage: '' }));
    }, OVERLAY_DURATION);
  }, []);

  const value = {
    currentUser,
    isSignedIn: !!currentUser,
    signIn,
    signOut,
    availableUsers: DEMO_USERS,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
      <AuthOverlay
        show={showOverlay}
        isSigningIn={overlayState.isSigningIn}
        userName={overlayState.userName}
        secondaryMessage={overlayState.secondaryMessage}
      />
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
