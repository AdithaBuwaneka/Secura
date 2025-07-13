export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'security_team' | 'executive' | 'admin';
  department?: string;
  phone_number?: string;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface Incident {
  id: string;
  incident_type: 'malware' | 'phishing' | 'data_breach' | 'unauthorized_access' | 'social_engineering' | 'physical_security';
  subject: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  reporter_id: string;
  assigned_to?: string;
  ai_category?: string;
  ai_confidence?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  files: string[];
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
}

export interface Message {
  id: string;
  incident_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  created_at: Date;
  is_encrypted: boolean;
}