import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { sendPhoneOTP, verifyPhoneOTP, checkIfProfileComplete } = useAuth();

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add +91
    if (!cleaned.startsWith('+')) {
      cleaned = '+91' + cleaned;
    } else {
      // If it starts with +91, keep it as is
      // If it starts with + but not +91, keep the user's country code
      if (cleaned.startsWith('+91')) {
        // Ensure no duplicate +91
        cleaned = '+91' + cleaned.substring(3).replace(/^\+?91/, '');
      }
    }
    
    // Limit to reasonable phone number length (+91 + 10 digits = 13 characters)
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    return cleaned;
  };

  const getCleanPhoneNumber = (formattedPhone: string) => {
    // Already clean, just return as is for E.164 format
    return formattedPhone;
  };

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    const cleanPhone = getCleanPhoneNumber(phone);
    if (cleanPhone.length < 13) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOTP(cleanPhone);
      setIsOTPSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    const cleanPhone = getCleanPhoneNumber(phone);
    setLoading(true);
    try {
      await verifyPhoneOTP(cleanPhone, otp);
      
      // Check if user profile is complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isProfileComplete = await checkIfProfileComplete(user.id);
        console.log('Profile complete check:', isProfileComplete);
        if (isProfileComplete) {
          router.replace('/(tabs)');
        } else {
          console.log('Redirecting to complete profile');
          router.replace('/(auth)/complete-profile');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const cleanPhone = getCleanPhoneNumber(phone);
    setLoading(true);
    try {
      await sendPhoneOTP(cleanPhone);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setIsOTPSent(false);
    setOtp('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#14b8a6', '#0d9488']} style={styles.header}>
        <View style={styles.logoContainer}>
          <Activity color="white" size={40} />
          <Text style={styles.logoText}>HealthMonitor</Text>
        </View>
        <Text style={styles.welcomeText}>
          {isOTPSent ? 'Verify Your Phone' : 'Welcome!'}
        </Text>
        <Text style={styles.subtitleText}>
          {isOTPSent 
            ? 'Enter the 6-digit code sent to your phone'
            : 'Sign in or create account with your phone number'
          }
        </Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {!isOTPSent ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
                autoCorrect={false}
                maxLength={13}
              />
              <Text style={styles.helperText}>
                Enter your 10-digit mobile number
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft color="#6b7280" size={20} />
              <Text style={styles.backButtonText}>Change phone number</Text>
            </TouchableOpacity>

            <View style={styles.otpContainer}>
              <Text style={styles.phoneDisplay}>{phone}</Text>
              <Text style={styles.otpDescription}>
                Enter the 6-digit verification code sent to your phone
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 40,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
    marginLeft: 8,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  phoneDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14b8a6',
    marginBottom: 8,
  },
  otpDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 16,
    color: '#14b8a6',
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});