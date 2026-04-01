import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Brain, Loader2, ArrowLeft } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await handlePostAuthRedirect(user.id);
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handlePostAuthRedirect = async (userId: string) => {
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
    navigate(redirectTo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) { toast.error("Passwords do not match"); setIsLoading(false); return; }
        if (password.length < 6) { toast.error("Password must be at least 6 characters"); setIsLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } }
        });
        if (error) { toast.error(error.message.includes('already registered') ? "Account exists. Please login." : error.message); return; }
        if (data.user) { toast.success("Welcome to Nurath.AI!"); navigate(redirectTo); }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message.includes('Invalid login') ? "Invalid email or password." : error.message); return; }
        if (data.user) { toast.success("Welcome back!"); await handlePostAuthRedirect(data.user.id); }
      }
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4">
            <Brain className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Nurath.AI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignup ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {/* Form — no card, no border, no background */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <Input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 rounded-2xl bg-muted/50 border-0 px-4"
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-2xl bg-muted/50 border-0 px-4"
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-2xl bg-muted/50 border-0 px-4 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isSignup && (
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 rounded-2xl bg-muted/50 border-0 px-4"
            />
          )}

          <Button type="submit" className="w-full h-12 rounded-2xl text-base font-medium" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignup ? "Create Account" : "Sign In"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
