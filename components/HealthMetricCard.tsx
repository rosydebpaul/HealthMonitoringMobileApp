import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Activity, Footprints, Flame, Moon } from 'lucide-react-native';

interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  type: 'heart_rate' | 'blood_pressure' | 'steps' | 'calories' | 'sleep';
  status?: 'normal' | 'warning' | 'critical';
}

export default function HealthMetricCard({
  title,
  value,
  unit,
  type,
  status = 'normal',
}: HealthMetricCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'heart_rate':
        return <Heart color="#ef4444" size={24} />;
      case 'blood_pressure':
        return <Activity color="#8b5cf6" size={24} />;
      case 'steps':
        return <Footprints color="#14b8a6" size={24} />;
      case 'calories':
        return <Flame color="#f97316" size={24} />;
      case 'sleep':
        return <Moon color="#6366f1" size={24} />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'heart_rate':
        return ['#fef2f2', '#fee2e2'];
      case 'blood_pressure':
        return ['#faf5ff', '#f3e8ff'];
      case 'steps':
        return ['#f0fdfa', '#ccfbf1'];
      case 'calories':
        return ['#fff7ed', '#fed7aa'];
      case 'sleep':
        return ['#eef2ff', '#e0e7ff'];
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'normal':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
    }
  };

  return (
    <LinearGradient colors={getGradient()} style={styles.card}>
      <View style={styles.header}>
        {getIcon()}
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    flex: 1,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  unit: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 4,
  },
});