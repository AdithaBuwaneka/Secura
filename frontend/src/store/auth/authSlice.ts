import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthState } from '@/types';

// API base URL - use port 8000 to match backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

interface LoginData {
  email: string;
  password: string;
}

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // 2. Get ID token
      const idToken = await userCredential.user.getIdToken();
      
      // 3. Create user profile in backend
      const requestBody = {
        email: data.email,
        full_name: data.fullName,
        phone_number: data.phoneNumber || null
      };
      
      console.log('Sending to create-profile:', requestBody);
      console.log('ID Token:', idToken ? 'present' : 'missing');
      console.log('API URL:', API_URL);
      
      const response = await fetch(`${API_URL}/api/auth/create-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Create-profile error response:', errorData);
        console.log('Response status:', response.status);
        
        // Since Firebase user is already created, we should still consider this successful
        // The profile creation might have failed due to validation but user exists
        console.log('Profile creation failed but Firebase user exists - treating as partial success');
        
        // Return the Firebase user data even if profile creation failed
        return {
          firebaseUser: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            emailVerified: userCredential.user.emailVerified
          },
          userProfile: {
            message: "User created successfully, profile setup may be incomplete",
            uid: userCredential.user.uid,
            email: userCredential.user.email
          },
          idToken
        };
      }
      
      const userProfile = await response.json();
      
      return {
        firebaseUser: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          emailVerified: userCredential.user.emailVerified
        },
        userProfile,
        idToken
      };
    } catch (error) {
      console.log('Auth slice registration error:', error);
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else if (typeof error === 'string') {
        return rejectWithValue(error);
      } else if (error && typeof error === 'object') {
        return rejectWithValue(error.message || error.detail || 'Registration failed. Please try again.');
      } else {
        return rejectWithValue('Registration failed. Please try again.');
      }
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      // 2. Get ID token
      const idToken = await userCredential.user.getIdToken();
      
      // 3. Get user profile from backend
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }
      
      const userProfile = await response.json();
      
      return {
        firebaseUser: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          emailVerified: userCredential.user.emailVerified
        },
        userProfile,
        idToken
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      return null;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (idToken: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Token verification failed');
    }
  }
);

// Initial state
const initialState: AuthState & { 
  loading: boolean; 
  error: string | null;
  isAuthenticated: boolean;
} = {
  user: null,
  userProfile: null,
  loading: false,
  idToken: null,
  error: null,
  isAuthenticated: false
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFirebaseUser: (state, action: PayloadAction<FirebaseUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setIdToken: (state, action: PayloadAction<string | null>) => {
      state.idToken = action.payload;
    },
    setUserProfile: (state, action: PayloadAction<any>) => {
      state.userProfile = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.userProfile = null;
      state.idToken = null;
      state.isAuthenticated = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.firebaseUser;
        state.userProfile = action.payload.userProfile;
        state.idToken = action.payload.idToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.firebaseUser;
        state.userProfile = action.payload.userProfile;
        state.idToken = action.payload.idToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.userProfile = null;
        state.idToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  }
});

export const { clearError, setFirebaseUser, setIdToken, setUserProfile, clearAuth } = authSlice.actions;
export default authSlice.reducer;