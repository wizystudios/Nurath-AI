import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Brain, Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await handlePostAuthRedirect(user.id);
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handlePostAuthRedirect = async (userId: string) => {
    // Check if user has a telemed role and redirect accordingly
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData) {
      if (roleData.role === 'super_admin') { navigate('/telemed/admin'); return; }
      if (roleData.role === 'org_admin' && roleData.organization_id) {
        const { data: org } = await supabase.from('organizations').select('type').eq('id', roleData.organization_id).single();
        if (org?.type === 'pharmacy') { navigate('/telemed/pharmacy'); return; }
        if (org?.type === 'lab') { navigate('/telemed/lab'); return; }
        navigate('/telemed/organization'); return;
      }
      if (roleData.role === 'doctor') { navigate('/telemed/doctor'); return; }
    }

    // Regular user — go to the requested page
    navigate(redirectTo);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });
      if (error) {
        toast.error(error.message.includes('Invalid login') ? "Invalid email or password." : error.message);
        return;
      }
      if (data.user) {
        toast.success("Welcome back!");
        await handlePostAuthRedirect(data.user.id);
      }
    } catch { toast.error("An unexpected error occurred."); } finally { setIsLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (signupForm.password !== signupForm.confirmPassword) { toast.error("Passwords do not match"); setIsLoading(false); return; }
    if (signupForm.password.length < 6) { toast.error("Password must be at least 6 characters"); setIsLoading(false); return; }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: signupForm.fullName } }
      });
      if (error) { toast.error(error.message.includes('already registered') ? "Account exists. Please login." : error.message); return; }
      if (data.user) { toast.success("Account created! Welcome to Nurath.AI!"); navigate(redirectTo); }
    } catch { toast.error("An unexpected error occurred."); } finally { setIsLoading(false); }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Nurath.AI</h1>
          <p className="text-muted-foreground">Your AI Assistant & Health Platform</p>
        </div>

        <Card className="border-border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="rounded-xl">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="Enter your email" value={loginForm.email} onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} required className="rounded-xl pr-10" />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription>Join Nurath.AI</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" placeholder="Enter your full name" value={signupForm.fullName} onChange={(e) => setSignupForm({...signupForm, fullName: e.target.value})} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={signupForm.email} onChange={(e) => setSignupForm({...signupForm, email: e.target.value})} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={signupForm.password} onChange={(e) => setSignupForm({...signupForm, password: e.target.value})} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <Input id="signup-confirm" type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={signupForm.confirmPassword} onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})} required className="rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground rounded-xl">
            ← Continue without account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
