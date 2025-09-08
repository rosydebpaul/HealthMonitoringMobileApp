import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Activity, User, Scale, Ruler, Mail } from 'lucide-react-native';

export default function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, updateUserProfile } = useAuth();

  useEffect(() => {
    // Pre-fill email if available
    if (user?.email) {
      setEmail(user.email);
    }
    
    // Pre-fill existing profile data if available
    fetchExistingProfile();
  }, [user]);

  const fetchExistingProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        if (profile.name && profile.name !== 'User' && profile.name !== 'New User') {
          setName(profile.name);
        }
        if (profile.age) setAge(profile.age.toString());
        if (profile.height) setHeight(profile.height.toString());
        if (profile.weight) setWeight(profile.weight.toString());
      }
    } catch (error) {
      console.error('Error fetching existing profile:', error);
    }
  };

  const handleCompleteProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!age || parseInt(age) < 1 || parseInt(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return;
    }

    if (!height || parseFloat(height) < 50 || parseFloat(height) > 250) {
      Alert.alert('Error', 'Please enter a valid height in cm (50-250)');
      return;
    }

    if (!weight || parseFloat(weight) < 20 || parseFloat(weight) > 300) {
      Alert.alert('Error', 'Please enter a valid weight in kg (20-300)');
      return;
    }

    // Email validation only if provided
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    }

    if (!user) {
      Alert.alert('Error', 'User session not found');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        age: parseInt(age),
        height: parseFloat(height),
        weight: parseFloat(weight),
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#14b8a6', '#0d9488']} style={styles.header}>
        <View style={styles.logoContainer}>
          <Activity color="white" size={40} />
          <Text style={styles.logoText}>HealthMonitor</Text>
        </View>
        <Text style={styles.welcomeText}>Complete Your Profile</Text>
        <Text style={styles.subtitleText}>
          Help us personalize your health monitoring experience
        </Text>
      </LinearGradient>

      <ScrollView style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <User color="#14b8a6" size={20} />
            <Text style={styles.label}>Full Name</Text>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Mail color="#14b8a6" size={20} />
            <Text style={styles.label}>Email Address</Text>
          </View>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Age</Text>
            </View>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.unitText}>years</Text>
          </View>

          <View style={[styles.inputContainer, styles.halfWidth]}>
            <View style={styles.labelContainer}>
              <Ruler color="#14b8a6" size={20} />
              <Text style={styles.label}>Height</Text>
            </View>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="170"
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>cm</Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Scale color="#14b8a6" size={20} />
            <Text style={styles.label}>Weight</Text>
          </View>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="70"
            keyboardType="numeric"
          />
          <Text style={styles.unitText}>kg</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCompleteProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving Profile...' : 'Complete Setup'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This information helps us provide personalized health insights and recommendations
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
  halfWidth: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
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
  unitText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
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
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});