import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { TelemedRole, UserRole } from '@/types/telemed';

export function useTelemedAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
      } else {
        setUserRole(data as UserRole | null);
      }
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: TelemedRole): boolean => {
    return userRole?.role === role;
  };

  const isSuperAdmin = (): boolean => hasRole('super_admin');
  const isOrgAdmin = (): boolean => hasRole('org_admin');
  const isDoctor = (): boolean => hasRole('doctor');
  const isPatient = (): boolean => hasRole('patient');

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  return {
    user,
    session,
    userRole,
    loading,
    hasRole,
    isSuperAdmin,
    isOrgAdmin,
    isDoctor,
    isPatient,
    signOut,
    refreshRole: () => user && fetchUserRole(user.id),
  };
}
