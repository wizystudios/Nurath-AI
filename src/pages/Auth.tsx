
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Mail, Key, User, LogIn, Sparkles, Globe, Code } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name || email.split('@')[0],
              skill_level: 'beginner'
            }
          }
        });
        
        if (error) throw error;
        toast.success("Account created! Please check your email for verification.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back to Nurath.AI!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <MessageCircle className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Nurath.AI
            </h1>
            <p className="text-xs text-muted-foreground">Coding with Nurath.AI - Coding Assistance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <select className="bg-transparent border-none text-sm outline-none">
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Auth Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <MessageCircle className="h-12 w-12 text-purple-600" />
                    <Code className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {isSignUp ? "Start Your Coding Journey" : "Welcome Back"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isSignUp 
                    ? "Join thousands learning to code with AI assistance" 
                    : "Continue your programming adventure"
                  }
                </p>
              </div>
              
              <Tabs value={isSignUp ? "register" : "login"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger 
                    value="login" 
                    onClick={() => setIsSignUp(false)}
                    className="text-sm"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    onClick={() => setIsSignUp(true)}
                    className="text-sm"
                  >
                    Get Started
                  </TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="name" 
                          type="text"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 border-0 bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-0 bg-gray-50 dark:bg-gray-800"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 border-0 bg-gray-50 dark:bg-gray-800"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isSignUp ? "Creating account..." : "Signing in..."}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isSignUp ? (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Start Learning
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            Sign In
                          </>
                        )}
                      </div>
                    )}
                  </Button>
                </form>
                
                {/* Toggle Text */}
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  {isSignUp ? (
                    <p>
                      Already have an account?{' '}
                      <button 
                        onClick={() => setIsSignUp(false)}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Sign in here
                      </button>
                    </p>
                  ) : (
                    <p>
                      New to Nurath.AI?{' '}
                      <button 
                        onClick={() => setIsSignUp(true)}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Get started for free
                      </button>
                    </p>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Right Side - Information */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-purple-600 to-indigo-800 text-white">
          <div className="max-w-lg text-center">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/0a707bd0-45d7-4fc6-a580-ef28382ccd8e.png" 
                alt="NK Technology" 
                className="h-20 w-auto mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold mb-4">
                Learn Programming with AI
              </h2>
              <p className="text-xl text-purple-100 mb-6">
                Your personal AI mentor for coding from zero to pro
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2 mt-1">
                  <Code className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Personalized AI Coding Mentor</h3>
                  <p className="text-sm text-purple-100">Get step-by-step guidance tailored to your learning pace</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2 mt-1">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Interactive Coding Practice</h3>
                  <p className="text-sm text-purple-100">Learn by doing with real-time AI feedback and corrections</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2 mt-1">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Bilingual Support</h3>
                  <p className="text-sm text-purple-100">Learn in English or Swahili - whatever works best for you</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-purple-200">
                Built for Tanzania, designed for the world
              </p>
              <div className="flex justify-center items-center gap-4 mt-4 text-xs text-purple-300">
                <span>🌟 4.9/5 rating</span>
                <span>•</span>
                <span>👥 10,000+ learners</span>
                <span>•</span>
                <span>🇹🇿 Made in Tanzania</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
