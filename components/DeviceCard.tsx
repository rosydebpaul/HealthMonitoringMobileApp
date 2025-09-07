import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Watch, Wifi, WifiOff, Battery } from 'lucide-react-native';
import { SmartWatch } from '@/types/health';

interface DeviceCardProps {
  device: SmartWatch;
  onConnect: (deviceId: string) => void;
  onDisconnect: (deviceId: string) => void;
}

export default function DeviceCard({ device, onConnect, onDisconnect }: DeviceCardProps) {
  const getBatteryColor = (level: number) => {
    if (level > 50) return '#10b981';
    if (level > 20) return '#f59e0b';
    return '#ef4444';
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
          <Watch color="#14b8a6" size={24} />
          <View style={styles.textContainer}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceModel}>{device.model}</Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          {device.isConnected ? (
            <Wifi color="#10b981" size={20} />
          ) : (
            <WifiOff color="#ef4444" size={20} />
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.batteryContainer}>
          <Battery color={getBatteryColor(device.batteryLevel)} size={16} />
          <Text style={[styles.batteryText, { color: getBatteryColor(device.batteryLevel) }]}>
            {device.batteryLevel}%
          </Text>
        </View>
        
        <Text style={styles.lastSync}>
          Last sync: {formatLastSync(device.lastSync)}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          device.isConnected ? styles.disconnectButton : styles.connectButton,
        ]}
        onPress={() => 
          device.isConnected 
            ? onDisconnect(device.id) 
            : onConnect(device.id)
        }
      >
        <Text style={[
          styles.buttonText,
          device.isConnected ? styles.disconnectButtonText : styles.connectButtonText,
        ]}>
          {device.isConnected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 8,
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
    marginBottom: 16,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  deviceModel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  lastSync: {
    fontSize: 12,
    color: '#9ca3af',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#14b8a6',
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectButtonText: {
    color: 'white',
  },
  disconnectButtonText: {
    color: '#ef4444',
  },
});