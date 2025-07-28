import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface Incident {
  id: string;
  title: string;
  description: string;
  incident_type: 'malware' | 'phishing' | 'data_breach' | 'unauthorized_access' | 'social_engineering' | 'physical_security' | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  assigned_to?: string;
  location?: {
    address: string;
  };
  created_at: string;
  updated_at: string;
  ai_category?: string;
  ai_confidence?: number;
  attachments?: string[];
  additional_context?: Record<string, unknown>;
}

interface IncidentState {
  incidents: Incident[];
  userIncidents: Incident[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    pending: number;
    investigating: number;
    resolved: number;
  };
}

const initialState: IncidentState = {
  incidents: [],
  userIncidents: [],
  loading: false,
  error: null,
  stats: {
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0
  }
};

// Async thunks
export const fetchUserIncidents = createAsyncThunk<
  Incident[],
  void,
  { rejectValue: string }
>(
  'incidents/fetchUserIncidents',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const idToken = state.auth.idToken;
      
      if (!idToken) {
        console.log('No idToken available for fetchUserIncidents');
        throw new Error('No authentication token');
      }

      console.log('Fetching incidents with token:', idToken ? 'present' : 'missing');

      const response = await fetch(`${API_URL}/api/incidents/`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Incidents response status:', response.status);

      if (response.status === 401) {
        console.log('Authentication failed for incidents endpoint');
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        const error = await response.json();
        console.log('Incidents error:', error);
        throw new Error(error.detail || 'Failed to fetch incidents');
      }

      const data: Incident[] = await response.json();
      console.log('Incidents data:', data);
      return data || [];
    } catch (error) {
      console.error('fetchUserIncidents error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch incidents');
    }
  }
);

interface CreateIncidentData {
  title: string;
  description: string;
  incident_type: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { address: string } | null;
  additional_context: Record<string, unknown>;
  attachments: string[];
}

export const createIncident = createAsyncThunk(
  'incidents/createIncident',
  async (incidentData: CreateIncidentData, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const idToken = state.auth.idToken;
      
      if (!idToken) {
        throw new Error('No authentication token');
      }

      console.log('Creating incident with data:', incidentData);

      const response = await fetch(`${API_URL}/api/incidents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incidentData)
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to create incident`;
        try {
          const error = await response.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch {
          // If can't parse JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result: Incident = await response.json();
      console.log('Incident created successfully:', result);
      return result;
    } catch (error) {
      console.error('Redux createIncident error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create incident';
      return rejectWithValue(errorMessage);
    }
  }
);

const incidentSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addIncident: (state, action: PayloadAction<Incident>) => {
      state.userIncidents.unshift(action.payload);
      state.stats.total += 1;
      state.stats.pending += 1;
    },
    updateIncidentStats: (state) => {
      const incidents = state.userIncidents;
      state.stats = {
        total: incidents.length,
        pending: incidents.filter(i => i.status === 'pending').length,
        investigating: incidents.filter(i => i.status === 'investigating').length,
        resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length
      };
    }
  },
  extraReducers: (builder) => {
    // Fetch user incidents
    builder
      .addCase(fetchUserIncidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.userIncidents = action.payload;
        // Update stats
        const incidents = action.payload;
        state.stats = {
          total: incidents.length,
          pending: incidents.filter((i: Incident) => i.status === 'pending').length,
          investigating: incidents.filter((i: Incident) => i.status === 'investigating').length,
          resolved: incidents.filter((i: Incident) => i.status === 'resolved' || i.status === 'closed').length
        };
      })
      .addCase(fetchUserIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
    
    // Create incident
    builder
      .addCase(createIncident.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIncident.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new incident to the list
        if (action.payload) {
          state.userIncidents.unshift(action.payload);
          state.stats.total += 1;
          state.stats.pending += 1;
        }
      })
      .addCase(createIncident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, addIncident, updateIncidentStats } = incidentSlice.actions;
export default incidentSlice.reducer;