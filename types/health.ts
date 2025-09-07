export interface HealthMetric {
  id: string;
  userId: string;
  type: 'heart_rate' | 'blood_pressure' | 'steps' | 'calories' | 'sleep';
  value: number;
  systolic?: number;
  diastolic?: number;
  timestamp: string;
  deviceId?: string;
}

export interface SmartWatch {
  id: string;
  name: string;
  model: string;
  batteryLevel: number;
  isConnected: boolean;
  lastSync: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  height?: number;
  weight?: number;
  createdAt: string;
}

export interface DashboardData {
  currentHeartRate?: number;
  currentBloodPressure?: { systolic: number; diastolic: number };
  dailySteps?: number;
  caloriesBurned?: number;
  sleepHours?: number;
}