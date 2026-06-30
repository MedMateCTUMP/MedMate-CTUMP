export interface Subject {
  id: string;
  name: string;
  color: string;
  targetHours: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  title: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  location?: string;
  notes?: string;
  status: 'planned' | 'done';
  syncedToGoogle: boolean;
}

export interface ScreenTime {
  id: string;
  appName: string;
  minutes: number;
  date: string; // YYYY-MM-DD
}

export interface AppLimit {
  id: string;
  appName: string;
  limitMinutes: number;
}

export interface PointLog {
  id: string;
  reason: string;
  points: number;
  timestamp: string; // ISO string
}

export interface UserProfile {
  email: string;
  points: number;
  streak: number;
  lastActiveDate?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
