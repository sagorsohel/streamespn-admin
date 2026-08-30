import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Load initial auth state from localStorage
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState: AuthState = {
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
};

// Async thunk for logging in
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data?.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { user, token };
      }
      return rejectWithValue(response.data?.message || 'Login failed');
    } catch (err: any) {
      // Fallback for demo credentials if backend service is unreachable or not yet initialized
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        if (credentials.email === 'admin@gmail.com' && credentials.password === 'sohoj@sohoj') {
          const demoUser: User = {
            id: 1,
            name: 'System Admin',
            email: 'admin@gmail.com',
            role: 'admin',
          };
          const demoToken = 'demo_jwt_token_admin_streamespn';
          localStorage.setItem('token', demoToken);
          localStorage.setItem('user', JSON.stringify(demoUser));
          return { user: demoUser, token: demoToken };
        }
        return rejectWithValue('Backend server offline. Make sure http://localhost:5000 is running.');
      }
      return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setDemoAuth: (state) => {
      const demoUser: User = {
        id: 1,
        name: 'System Admin',
        email: 'admin@gmail.com',
        role: 'admin',
      };
      const demoToken = 'demo_jwt_token_admin_streamespn';
      state.user = demoUser;
      state.token = demoToken;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('token', demoToken);
      localStorage.setItem('user', JSON.stringify(demoUser));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Authentication failed';
      });
  },
});

export const { logout, clearError, setDemoAuth } = authSlice.actions;
export default authSlice.reducer;
