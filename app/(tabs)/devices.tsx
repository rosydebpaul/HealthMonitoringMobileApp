import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, CircleAlert as AlertCircle, Bluetooth, BluetoothOff } from 'lucide-react-native';
import DeviceCard from '@/components/DeviceCard';
import { SmartWatch, HealthMetric } from '@/types/health';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useHealthData } from '@/hooks/useHealthData';
import { useAuth } from '@/contexts/AuthContext';

export default function DevicesScreen() {
  const { user } = useAuth();
  const { addHealthMetric } = useHealthData();

  // Early return if no user
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Connected Devices</Text>
          <Text style={styles.subtitle}>Please log in to manage your devices</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    isScanning,
    discoveredDevices,
    connectedDevice,
    realTimeData,
    bluetoothState,
    error,
    startScanning,
    stopScanning,
    connectToDevice,
    disconnectDevice,
    clearError,
    simulateRealTimeData,
  } = useBluetooth();

  const handleConnect = async (deviceId: string) => {
    await connectToDevice(deviceId);
  };

  const handleDisconnect = async (deviceId: string) => {
    await disconnectDevice();
  };

  const handleStartScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const handleSimulateData = () => {
    simulateRealTimeData();
  };

  // Convert BluetoothDevice to SmartWatch for DeviceCard
  const convertToSmartWatch = (device: any, isConnected: boolean = false): SmartWatch => ({
    id: device.id,
    name: device.name,
    model: 'BLE Device',
    batteryLevel: realTimeData?.batteryLevel || 0,
    isConnected,
    lastSync: realTimeData?.timestamp || new Date().toISOString(),
  });

  // Save real-time data to database
  const saveRealTimeData = async () => {
    if (!user || !realTimeData) return;

    try {
      if (realTimeData.heartRate) {
        await addHealthMetric({
          userId: user.id,
          type: 'heart_rate',
          value: realTimeData.heartRate,
          timestamp: realTimeData.timestamp,
          deviceId: connectedDevice?.id,
        });
      }

      if (realTimeData.steps) {
        await addHealthMetric({
          userId: user.id,
          type: 'steps',
          value: realTimeData.steps,
          timestamp: realTimeData.timestamp,
          deviceId: connectedDevice?.id,
        });
      }
    } catch (error) {
      console.error('Error saving real-time data:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connected Devices</Text>
        <Text style={styles.subtitle}>Manage your health monitoring devices</Text>
        
        <View style={styles.bluetoothStatus}>
          {bluetoothState === 'PoweredOn' ? (
            <Bluetooth color="#10b981" size={20} />
          ) : (
            <BluetoothOff color="#ef4444" size={20} />
          )}
          <Text style={[
            styles.bluetoothStatusText,
            { color: bluetoothState === 'PoweredOn' ? '#10b981' : '#ef4444' }
          ]}>
            Bluetooth {bluetoothState}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle color="#ef4444" size={20} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {connectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Device</Text>
            <DeviceCard
              device={convertToSmartWatch(connectedDevice, true)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            
            {realTimeData && (
              <View style={styles.realTimeCard}>
                <Text style={styles.realTimeTitle}>Real-time Data</Text>
                <View style={styles.realTimeGrid}>
                  {realTimeData.heartRate && (
                    <View style={styles.realTimeItem}>
                      <Text style={styles.realTimeLabel}>Heart Rate</Text>
                      <Text style={styles.realTimeValue}>{realTimeData.heartRate} BPM</Text>
                    </View>
                  )}
                  {realTimeData.steps && (
                    <View style={styles.realTimeItem}>
                      <Text style={styles.realTimeLabel}>Steps</Text>
                      <Text style={styles.realTimeValue}>{realTimeData.steps}</Text>
                    </View>
                  )}
                  {realTimeData.batteryLevel && (
                    <View style={styles.realTimeItem}>
                      <Text style={styles.realTimeLabel}>Battery</Text>
                      <Text style={styles.realTimeValue}>{realTimeData.batteryLevel}%</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={saveRealTimeData}>
                  <Text style={styles.saveButtonText}>Save to Health Records</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {discoveredDevices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Discovered Devices ({discoveredDevices.length})
            </Text>
            {discoveredDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={convertToSmartWatch(device, false)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.scanButton,
            isScanning && styles.scanButtonActive
          ]} 
          onPress={handleStartScanning}
        >
          {isScanning ? (
            <Search color="white" size={24} />
          ) : (
            <Plus color="#14b8a6" size={24} />
          )}
          <Text style={[
            styles.scanButtonText,
            isScanning && styles.scanButtonTextActive
          ]}>
            {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoButton} onPress={handleSimulateData}>
          <Text style={styles.demoButtonText}>Simulate Real-time Data (Demo)</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Device Compatibility</Text>
          <Text style={styles.infoText}>
            This app supports BLE devices with standard health services including heart rate monitors, 
            fitness trackers, and smartwatches. Make sure your device is in pairing mode before scanning.
          </Text>
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
    backgroundColor: 'white',
  },
  bluetoothStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  bluetoothStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginLeft: 12,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  realTimeCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  realTimeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 12,
  },
  realTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  realTimeItem: {
    width: '48%',
    marginBottom: 12,
  },
  realTimeLabel: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
  },
  realTimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#14b8a6',
    borderStyle: 'dashed',
  },
  scanButtonActive: {
    backgroundColor: '#14b8a6',
    borderStyle: 'solid',
  },
  scanButtonText: {
    fontSize: 16,
    color: '#14b8a6',
    fontWeight: '600',
    marginLeft: 8,
  },
  scanButtonTextActive: {
    color: 'white',
  },
  demoButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});