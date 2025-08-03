import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
  activeModal: string | null;
  searchQuery: string;
  selectedFilters: {
    [key: string]: any;
  };
  pageTitle: string;
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
  loading: {
    global: false,
  },
  activeModal: null,
  searchQuery: '',
  selectedFilters: {},
  pageTitle: 'Academic Publications Management',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      localStorage.setItem('sidebarOpen', state.sidebarOpen.toString());
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      localStorage.setItem('sidebarOpen', action.payload.toString());
    },

    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      
      // Apply theme to document
      const root = document.documentElement;
      if (action.payload === 'dark') {
        root.classList.add('dark');
      } else if (action.payload === 'light') {
        root.classList.remove('dark');
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    },

    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },

    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },

    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },

    setActiveModal: (state, action: PayloadAction<string | null>) => {
      state.activeModal = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setFilters: (state, action: PayloadAction<{ key: string; value: any }>) => {
      const { key, value } = action.payload;
      state.selectedFilters[key] = value;
    },

    clearFilters: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(key => {
        delete state.selectedFilters[key];
      });
    },

    clearAllFilters: (state) => {
      state.selectedFilters = {};
    },

    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} | Academic Publications Management`;
    },

    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; href?: string }>>) => {
      state.breadcrumbs = action.payload;
    },

    addBreadcrumb: (state, action: PayloadAction<{ label: string; href?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },

    removeBreadcrumb: (state, action: PayloadAction<number>) => {
      state.breadcrumbs.splice(action.payload, 1);
    },

    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    restoreUIState: (state) => {
      // Restore sidebar state
      const storedSidebarOpen = localStorage.getItem('sidebarOpen');
      if (storedSidebarOpen !== null) {
        state.sidebarOpen = storedSidebarOpen === 'true';
      }

      // Restore theme
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
      if (storedTheme) {
        state.theme = storedTheme;
        uiSlice.caseReducers.setTheme(state, { payload: storedTheme, type: 'ui/setTheme' });
      }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setGlobalLoading,
  setLoading,
  clearLoading,
  setActiveModal,
  setSearchQuery,
  setFilters,
  clearFilters,
  clearAllFilters,
  setPageTitle,
  setBreadcrumbs,
  addBreadcrumb,
  removeBreadcrumb,
  clearBreadcrumbs,
  restoreUIState,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.loading.global;
export const selectLoading = (key: string) => (state: { ui: UIState }) => 
  state.ui.loading[key] || false;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;
export const selectSearchQuery = (state: { ui: UIState }) => state.ui.searchQuery;
export const selectFilters = (state: { ui: UIState }) => state.ui.selectedFilters;
export const selectFilter = (key: string) => (state: { ui: UIState }) => 
  state.ui.selectedFilters[key];
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;