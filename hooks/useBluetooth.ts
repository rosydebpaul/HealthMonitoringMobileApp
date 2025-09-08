import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';

export interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  services?: string[];
}

export interface RealTimeData {
  heartRate?: number;
  steps?: number;
  batteryLevel?: number;
  timestamp: string;
}

export interface BluetoothState {
  isScanning: boolean;
  discoveredDevices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  realTimeData: RealTimeData | null;
  bluetoothState: string;
  error: string | null;
}

// Standard BLE service UUIDs for health devices
const HEART_RATE_SERVICE_UUID = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_CHARACTERISTIC_UUID = '00002A37-0000-1000-8000-00805F9B34FB';
const BATTERY_SERVICE_UUID = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL_CHARACTERISTIC_UUID = '00002A19-0000-1000-8000-00805F9B34FB';

export function useBluetooth() {
  const bleManagerRef = useRef<BleManager | null>(null);
  const [state, setState] = useState<BluetoothState>({
    isScanning: false,
    discoveredDevices: [],
    connectedDevice: null,
    realTimeData: null,
    bluetoothState: 'Unknown',
    error: null,
  });

  // Initialize BLE Manager
  useEffect(() => {
    // Check if we have a valid user before initializing Bluetooth
    if (!user) {
      setState(prev => ({ 
        ...prev, 
        bluetoothState: 'NotSupported',
        error: 'Please log in to use Bluetooth features.'
      }));
      return;
    }

    // Only initialize BLE Manager on native platforms
    if (Platform.OS !== 'web') {
      try {
        bleManagerRef.current = new BleManager();
        
        const manager = bleManagerRef.current;

        // Monitor Bluetooth state
        const subscription = manager.onStateChange((state) => {
          setState(prev => ({ ...prev, bluetoothState: state }));
          
          if (state === 'PoweredOff') {
            setState(prev => ({ 
              ...prev, 
              error: 'Bluetooth is turned off. Please enable Bluetooth to connect to devices.',
              isScanning: false,
              discoveredDevices: [],
              connectedDevice: null,
            }));
          }
        }, true);

        return () => {
          subscription.remove();
          manager.destroy();
        };
      } catch (error) {
        console.error('Error initializing BLE Manager:', error);
        setState(prev => ({ 
          ...prev, 
          bluetoothState: 'NotSupported',
          error: 'Failed to initialize Bluetooth. This feature may not be available on this device.'
        }));
      }
    } else {
      // Set web-specific state
      setState(prev => ({ 
        ...prev, 
        bluetoothState: 'NotSupported',
        error: 'Bluetooth functionality is not available on web. Please use the mobile app for device connectivity.'
      }));
    }
  }, [user]);

  // Request Android permissions
  const requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  // Start scanning for BLE devices
  const startScanning = async () => {
    const manager = bleManagerRef.current;
    if (!manager || Platform.OS === 'web') {
      setState(prev => ({ 
        ...prev, 
        error: 'Bluetooth scanning is only available on mobile devices.' 
      }));
      return;
    }

    // Check permissions on Android
    if (Platform.OS === 'android') {
      const hasPermissions = await requestAndroidPermissions();
      if (!hasPermissions) {
        setState(prev => ({ 
          ...prev, 
          error: 'Bluetooth permissions are required to scan for devices.' 
        }));
        return;
      }
    }

    // Check if Bluetooth is powered on
    const bluetoothState = await manager.state();
    if (bluetoothState !== 'PoweredOn') {
      setState(prev => ({ 
        ...prev, 
        error: 'Please turn on Bluetooth to scan for devices.' 
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isScanning: true, 
      discoveredDevices: [], 
      error: null 
    }));

    // Start scanning for devices with health services
    manager.startDeviceScan(
      [HEART_RATE_SERVICE_UUID, BATTERY_SERVICE_UUID], 
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setState(prev => ({ 
            ...prev, 
            isScanning: false, 
            error: 'Failed to scan for devices: ' + error.message 
          }));
          return;
        }

        if (device && device.name) {
          setState(prev => {
            const existingDevice = prev.discoveredDevices.find(d => d.id === device.id);
            if (existingDevice) return prev;

            const newDevice: BluetoothDevice = {
              id: device.id,
              name: device.name || 'Unknown Device',
              rssi: device.rssi || -100,
              isConnected: false,
              services: device.serviceUUIDs || [],
            };

            return {
              ...prev,
              discoveredDevices: [...prev.discoveredDevices, newDevice],
            };
          });
        }
      }
    );

    // Stop scanning after 10 seconds
    setTimeout(() => {
      stopScanning();
    }, 10000);
  };

  // Stop scanning for devices
  const stopScanning = () => {
    const manager = bleManagerRef.current;
    if (!manager || Platform.OS === 'web') return;

    manager.stopDeviceScan();
    setState(prev => ({ ...prev, isScanning: false }));
  };

  // Connect to a specific device
  const connectToDevice = async (deviceId: string) => {
    const manager = bleManagerRef.current;
    if (!manager || Platform.OS === 'web') {
      setState(prev => ({ 
        ...prev, 
        error: 'Device connection is only available on mobile devices.' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Connect to device
      const device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      // Update state with connected device
      setState(prev => ({
        ...prev,
        connectedDevice: {
          id: device.id,
          name: device.name || 'Unknown Device',
          rssi: 0,
          isConnected: true,
        },
        discoveredDevices: prev.discoveredDevices.map(d =>
          d.id === deviceId ? { ...d, isConnected: true } : d
        ),
      }));

      // Start monitoring characteristics
      await startMonitoring(device);

    } catch (error: any) {
      console.error('Connection error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to device: ' + error.message 
      }));
    }
  };

  // Start monitoring device characteristics
  const startMonitoring = async (device: Device) => {
    try {
      // Monitor heart rate if available
      try {
        await device.monitorCharacteristicForService(
          HEART_RATE_SERVICE_UUID,
          HEART_RATE_CHARACTERISTIC_UUID,
          (error, characteristic) => {
            if (error) {
              console.log('Heart rate monitoring error:', error);
              return;
            }

            if (characteristic?.value) {
              const heartRate = parseHeartRateValue(characteristic.value);
              setState(prev => ({
                ...prev,
                realTimeData: {
                  ...prev.realTimeData,
                  heartRate,
                  timestamp: new Date().toISOString(),
                },
              }));
            }
          }
        );
      } catch (error) {
        console.log('Heart rate service not available');
      }

      // Monitor battery level if available
      try {
        const batteryCharacteristic = await device.readCharacteristicForService(
          BATTERY_SERVICE_UUID,
          BATTERY_LEVEL_CHARACTERISTIC_UUID
        );

        if (batteryCharacteristic?.value) {
          const batteryLevel = parseBatteryLevel(batteryCharacteristic.value);
          setState(prev => ({
            ...prev,
            realTimeData: {
              ...prev.realTimeData,
              batteryLevel,
              timestamp: new Date().toISOString(),
            },
          }));
        }
      } catch (error) {
        console.log('Battery service not available');
      }

    } catch (error) {
      console.error('Monitoring error:', error);
    }
  };

  // Disconnect from device
  const disconnectDevice = async () => {
    const manager = bleManagerRef.current;
    if (!manager || !state.connectedDevice || Platform.OS === 'web') {
      setState(prev => ({ 
        ...prev, 
        error: 'Device disconnection is only available on mobile devices.' 
      }));
      return;
    }

    try {
      await manager.cancelDeviceConnection(state.connectedDevice.id);
      
      setState(prev => ({
        ...prev,
        connectedDevice: null,
        realTimeData: null,
        discoveredDevices: prev.discoveredDevices.map(d =>
          d.id === prev.connectedDevice?.id ? { ...d, isConnected: false } : d
        ),
      }));
    } catch (error: any) {
      console.error('Disconnection error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to disconnect: ' + error.message 
      }));
    }
  };

  // Parse heart rate value from BLE characteristic
  const parseHeartRateValue = (base64Value: string): number => {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      // Heart rate measurement format (16-bit or 8-bit)
      if (buffer.length >= 2) {
        // Check if 16-bit format
        const flags = buffer[0];
        if (flags & 0x01) {
          // 16-bit heart rate value
          return buffer.readUInt16LE(1);
        } else {
          // 8-bit heart rate value
          return buffer[1];
        }
      }
      return 0;
    } catch (error) {
      console.error('Error parsing heart rate:', error);
      return 0;
    }
  };

  // Parse battery level from BLE characteristic
  const parseBatteryLevel = (base64Value: string): number => {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      return buffer.length > 0 ? buffer[0] : 0;
    } catch (error) {
      console.error('Error parsing battery level:', error);
      return 0;
    }
  };

  // Clear error
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Simulate real-time data for demo purposes
  const simulateRealTimeData = () => {
    const heartRate = 60 + Math.floor(Math.random() * 40); // 60-100 BPM
    const steps = Math.floor(Math.random() * 1000) + 5000; // 5000-6000 steps
    const batteryLevel = 70 + Math.floor(Math.random() * 30); // 70-100%

    setState(prev => ({
      ...prev,
      realTimeData: {
        heartRate,
        steps,
        batteryLevel,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  return {
    // State
    isScanning: state.isScanning,
    discoveredDevices: state.discoveredDevices,
    connectedDevice: state.connectedDevice,
    realTimeData: state.realTimeData,
    bluetoothState: state.bluetoothState,
    error: state.error,

    // Actions
    startScanning,
    stopScanning,
    connectToDevice,
    disconnectDevice,
    clearError,
    simulateRealTimeData, // For demo purposes
  };
}