import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import HealthMetricCard from '@/components/HealthMetricCard';
import { useHealthData } from '@/hooks/useHealthData';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { dashboardData, loading, refreshData } = useHealthData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#14b8a6', '#0d9488']}
        style={styles.header}
      >
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>{getName()}</Text>
        <Text style={styles.subtitle}>Here's your health overview</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.metricsGrid}>
          <View style={styles.row}>
            <HealthMetricCard
              title="Heart Rate"
              value={dashboardData.currentHeartRate || '--'}
              unit="BPM"
              type="heart_rate"
              status="normal"
            />
            <HealthMetricCard
              title="Daily Steps"
              value={dashboardData.dailySteps || 0}
              unit="steps"
              type="steps"
              status="normal"
            />
          </View>

          <View style={styles.row}>
            <HealthMetricCard
              title="Blood Pressure"
              value={
                dashboardData.currentBloodPressure
                  ? `${dashboardData.currentBloodPressure.systolic}/${dashboardData.currentBloodPressure.diastolic}`
                  : '--/--'
              }
              unit="mmHg"
              type="blood_pressure"
              status="normal"
            />
            <HealthMetricCard
              title="Calories"
              value={dashboardData.caloriesBurned || 0}
              unit="kcal"
              type="calories"
              status="normal"
            />
          </View>

          <View style={styles.row}>
            <HealthMetricCard
              title="Sleep"
              value={dashboardData.sleepHours || '--'}
              unit="hours"
              type="sleep"
              status="normal"
            />
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Sync your devices</Text>
            <Text style={styles.actionDescription}>
              Make sure your smartwatch is connected to get the latest data
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f9fafb',
  },
  metricsGrid: {
    padding: 16,
    paddingTop: 24,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickActions: {
    padding: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});