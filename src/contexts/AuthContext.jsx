import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows
      console.error("Error fetching profile:", error);
      toast({
        variant: "destructive",
        title: "Erreur de profil",
        description: "Impossible de récupérer les informations de l'utilisateur.",
      });
      return null;
    }
    
    // The role from the JWT is the most reliable source
    const userRole = sessionUser.user_metadata?.user_role || profile?.role;
    
    return { ...profile, role: userRole };
  }, [toast]);

  const handleAuthStateChange = useCallback(async (event, session) => {
    setLoading(true);
    setSession(session);

    if (session?.user) {
      const profile = await fetchUserProfile(session.user);
      if (profile) {
        setUser({ ...session.user, ...profile });
      } else {
        // This case can happen right after sign up, before the trigger has run.
        // We'll rely on the next auth state change.
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [fetchUserProfile]);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchUserProfile(data.session.user).then(profile => {
          if (profile) {
            setUser({ ...data.session.user, ...profile });
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthStateChange(event, session);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [handleAuthStateChange, fetchUserProfile]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: "Email ou mot de passe incorrect.",
      });
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signUp = async (email, password, firstName, lastName, role = 'client') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role // Pass role here to be picked up by the trigger
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Échec de l'inscription",
        description: error.message,
      });
      return { success: false, error: error.message };
    }
    
    toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre e-mail pour confirmer votre compte.",
    });
    return { success: true, user: data.user };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
      console.error("Supabase signOut error:", error.message);
      toast({
        variant: "destructive",
        title: "Erreur de déconnexion",
        description: error.message,
      });
    }
    // Force clear local state regardless of Supabase error
    setSession(null);
    setUser(null);
  };

  const value = {
    session,
    user,
    loading,
    login,
    logout,
    signUp,
    isAuthenticated: !!session && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};