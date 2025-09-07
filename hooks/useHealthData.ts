import { useState, useEffect } from 'react';
import { healthDataService } from '@/lib/supabase';
import { HealthMetric, DashboardData } from '@/types/health';
import { useAuth } from '@/contexts/AuthContext';

export function useHealthData() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [recentMetrics, setRecentMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const metrics = await healthDataService.getRecentMetrics(user.id);
      
      // Process metrics into dashboard data
      const heartRateMetrics = metrics.filter(m => m.type === 'heart_rate');
      const bpMetrics = metrics.filter(m => m.type === 'blood_pressure');
      const stepMetrics = metrics.filter(m => m.type === 'steps');
      const calorieMetrics = metrics.filter(m => m.type === 'calories');
      const sleepMetrics = metrics.filter(m => m.type === 'sleep');

      setDashboardData({
        currentHeartRate: heartRateMetrics[0]?.value,
        currentBloodPressure: bpMetrics[0] ? {
          systolic: bpMetrics[0].systolic || 0,
          diastolic: bpMetrics[0].diastolic || 0
        } : undefined,
        dailySteps: stepMetrics.reduce((sum, m) => sum + m.value, 0),
        caloriesBurned: calorieMetrics.reduce((sum, m) => sum + m.value, 0),
        sleepHours: sleepMetrics[0]?.value,
      });

      setRecentMetrics(metrics);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHealthMetric = async (metric: Omit<HealthMetric, 'id'>) => {
    if (!user) return;

    try {
      await healthDataService.addHealthMetric({
        ...metric,
        userId: user.id,
      });
      
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Error adding health metric:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Set up periodic refresh for real-time data
      const interval = setInterval(fetchDashboardData, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    dashboardData,
    recentMetrics,
    loading,
    addHealthMetric,
    refreshData: fetchDashboardData,
  };
}