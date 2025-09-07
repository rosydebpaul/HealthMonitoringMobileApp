import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChartContainer from '@/components/ChartContainer';
import { useHealthData } from '@/hooks/useHealthData';

export default function AnalyticsScreen() {
  const { recentMetrics } = useHealthData();

  const heartRateData = recentMetrics.filter(m => m.type === 'heart_rate');
  const stepsData = recentMetrics.filter(m => m.type === 'steps');
  const caloriesData = recentMetrics.filter(m => m.type === 'calories');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Analytics</Text>
        <Text style={styles.subtitle}>Track your progress over time</Text>
      </View>

      <ScrollView style={styles.content}>
        <ChartContainer
          title="Heart Rate Trend"
          data={heartRateData}
          color="rgba(239, 68, 68, 1)"
          yAxisSuffix=" BPM"
        />

        <ChartContainer
          title="Daily Steps"
          data={stepsData}
          color="rgba(20, 184, 166, 1)"
          yAxisSuffix=" steps"
        />

        <ChartContainer
          title="Calories Burned"
          data={caloriesData}
          color="rgba(249, 115, 22, 1)"
          yAxisSuffix=" kcal"
        />
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
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 8,
  },
});