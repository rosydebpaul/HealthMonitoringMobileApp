import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  age?: number;
  height?: number;
  weight?: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sendPhoneOTP: (phone: string) => Promise<void>;
  verifyPhoneOTP: (phone: string, otp: string) => Promise<void>;
  checkIfProfileComplete: (userId: string) => Promise<boolean>;
  updateUserProfile: (userId: string, profileData: { name?: string; age?: number; height?: number; weight?: number; email?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendPhoneOTP = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) throw error;
  };

  const verifyPhoneOTP = async (phone: string, otp: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    if (error) throw error;
  };

  const checkIfProfileComplete = async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking profile for user:', userId);
      // Check if user profile exists and has required fields
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile check error:', error);
        return false;
      }

      console.log('Profile data:', profile);
      
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      const hasEmail = user?.email && user.email.trim() !== '';
      
      // Check if all required fields are present
      const isComplete = profile && 
        profile.name && 
        profile.name.trim() !== '' && 
        profile.name !== 'New User' &&
        profile.name !== 'User' &&
        profile.age && 
        profile.height && 
        profile.weight &&
        hasEmail;

      console.log('Profile complete:', isComplete);
      return !!isComplete;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  };

  const updateUserProfile = async (
    userId: string, 
    profileData: { name?: string; age?: number; height?: number; weight?: number; email?: string }
  ) => {
    try {
      // Update email in auth.users if provided
      if (profileData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        if (emailError) throw emailError;
      }

      // Update or insert user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          name: profileData.name,
          age: profileData.age,
          height: profileData.height,
          weight: profileData.weight,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        sendPhoneOTP,
        verifyPhoneOTP,
        checkIfProfileComplete,
        updateUserProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};