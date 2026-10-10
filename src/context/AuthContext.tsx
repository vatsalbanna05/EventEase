import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: {
    fullName: string;
    email: string;
    password?: string;
    role: UserRole;
    studentId?: string;
    department?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, UserProfile> = {
  organizer: {
    id: 'user-organizer-1',
    full_name: 'Prof. Rajesh Mehta',
    email: 'organizer@atmiya.edu',
    role: 'organizer',
    department: 'Computer Science & Engineering',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  volunteer: {
    id: 'user-volunteer-1',
    full_name: 'Aarav Shah',
    email: 'volunteer@atmiya.edu',
    role: 'volunteer',
    student_id: 'AU2023-CS-108',
    department: 'Information Technology',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  participant: {
    id: 'user-participant-rahul',
    full_name: 'Rahul Patel',
    email: 'rahul.patel@atmiya.edu',
    role: 'participant',
    student_id: 'AU2024-CS-042',
    department: 'Computer Science',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  admin: {
    id: 'user-admin-1',
    full_name: 'Dean Academic Affairs',
    email: 'dean@atmiya.edu',
    role: 'admin',
    department: 'University Administration',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  }
};

const ACTIVE_USER_STORAGE_KEY = 'eventease_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured());

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile as UserProfile);
              setIsDemoMode(false);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase session check failed, falling back to local user:', err);
        }
      }

      // Local storage restore for instant hackathon demonstration
      try {
        const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          // Default start as Organizer for rich initial dashboard exploration
          setUser(DEMO_USERS.organizer);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(DEMO_USERS.organizer));
        }
      } catch {
        setUser(DEMO_USERS.organizer);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen to Supabase auth changes if active
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as UserProfile);
            setIsDemoMode(false);
          }
        } else {
          // Keep saved local demo user if no Supabase session
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured() && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            setUser(profile as UserProfile);
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(profile));
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (err: any) {
        console.warn('Supabase signin failed:', err);
      }
    }

    // Local / Demo Sign In
    const matchedRole = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    const activeProfile: UserProfile = matchedRole || {
      id: 'user-' + Date.now(),
      full_name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      email: cleanEmail,
      role: 'participant',
      created_at: new Date().toISOString(),
    };

    setUser(activeProfile);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(activeProfile));
    setIsLoading(false);
    return { success: true };
  };

  const signUp = async (data: {
    fullName: string;
    email: string;
    password?: string;
    role: UserRole;
    studentId?: string;
    department?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = data.email.trim().toLowerCase();

    // Security Rule: Public signup cannot self-assign 'admin'
    const safeRole: UserRole = data.role === 'admin' ? 'organizer' : data.role;

    if (isSupabaseConfigured() && data.password) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName.trim(),
              role: safeRole,
              student_id: data.studentId?.trim(),
              department: data.department?.trim(),
            }
          }
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (authData.user) {
          const newProfile: UserProfile = {
            id: authData.user.id,
            full_name: data.fullName.trim(),
            email: cleanEmail,
            role: safeRole,
            student_id: data.studentId?.trim(),
            department: data.department?.trim(),
            created_at: new Date().toISOString()
          };
          setUser(newProfile);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(newProfile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase signup fallback:', err);
      }
    }

    // Local Registration
    const newProfile: UserProfile = {
      id: 'user-' + Date.now(),
      full_name: data.fullName.trim(),
      email: cleanEmail,
      role: safeRole,
      student_id: data.studentId?.trim(),
      department: data.department?.trim(),
      created_at: new Date().toISOString()
    };

    setUser(newProfile);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(newProfile));
    setIsLoading(false);
    return { success: true };
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signout:', err);
      }
    }
    setUser(null);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  };

  const switchDemoRole = useCallback((newRole: UserRole) => {
    const selected = DEMO_USERS[newRole];
    if (selected) {
      setUser(selected);
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(selected));
    }
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      } catch (err) {
        console.warn('Supabase profile update:', err);
      }
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'participant',
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        switchDemoRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
