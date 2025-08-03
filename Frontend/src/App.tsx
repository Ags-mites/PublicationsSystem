import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store';
import { useAppDispatch } from './store';
import { restoreFromStorage } from './store/slices/authSlice';
import { restoreUIState } from './store/slices/uiSlice';
import AppRouter from './router';
import ErrorBoundary from './components/common/ErrorBoundary';

// Component to initialize app state
const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Restore auth state from localStorage
    dispatch(restoreFromStorage());
    
    // Restore UI state from localStorage
    dispatch(restoreUIState());
  }, [dispatch]);

  return <AppRouter />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppInitializer />
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          duration={5000}
        />
      </Provider>
    </ErrorBoundary>
  );
};

export default App;