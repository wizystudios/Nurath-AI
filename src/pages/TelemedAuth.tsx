import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';

const TelemedAuth = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useTelemedAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && userRole) {
      redirectBasedOnRole(userRole.role, userRole.organization_id);
    }
  }, [user, userRole, loading]);

  const redirectBasedOnRole = async (role: string, orgId?: string | null) => {
    if (role === 'super_admin') {
      navigate('/telemed/admin');
    } else if (role === 'org_admin' && orgId) {
      // Check org type to redirect to correct dashboard
      const { data } = await supabase.from('organizations').select('type').eq('id', orgId).single();
      if (data?.type === 'pharmacy') navigate('/telemed/pharmacy');
      else if (data?.type === 'lab') navigate('/telemed/lab');
      else navigate('/telemed/organization');
    } else if (role === 'doctor') {
      navigate('/telemed/doctor');
    } else {
      navigate('/telemed');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success('Login successful!');
        // Role check will happen in useEffect
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestContinue = () => {
    navigate('/telemed');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
            Telemed Health System
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Healthcare Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Staff Login</TabsTrigger>
              <TabsTrigger value="guest">Patient Access</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white dark:bg-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white dark:bg-slate-700"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Staff accounts are created by Super Admin only
              </p>
            </TabsContent>

            <TabsContent value="guest" className="space-y-4">
              <div className="text-center space-y-4 py-4">
                <p className="text-muted-foreground">
                  Continue as a patient to access our healthcare chatbot,
                  search for doctors, hospitals, and book appointments.
                </p>
                <Button
                  onClick={handleGuestContinue}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  Continue as Patient
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can optionally create an account later to track your appointments
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Main App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelemedAuth;
