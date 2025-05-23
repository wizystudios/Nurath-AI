
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Mail, Key, User, LogIn, Sparkles, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import TanzaniaFlag from "@/components/TanzaniaFlag";

const Auth = () => {
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
        <div className="flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Nurath.AI
            </h1>
            <p className="text-xs text-muted-foreground">Your AI Programming Mentor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>English</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center p-4 pt-8">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <MessageCircle className="h-16 w-16 text-purple-600" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Nurath.AI</span>
            </h1>
            <p className="text-muted-foreground mb-4">
              Your personal AI mentor for learning programming from zero to pro
            </p>
            <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
              <TanzaniaFlag />
              <span>Built for Tanzania, designed for the world</span>
            </div>
          </div>

          {/* Auth Card */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">
                {isSignUp ? "Start Your Coding Journey" : "Welcome Back"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignUp 
                  ? "Join thousands learning to code with AI assistance" 
                  : "Continue your programming adventure"
                }
              </p>
            </CardHeader>
            
            <Tabs value={isSignUp ? "register" : "login"} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mx-6 mb-4">
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
              
              <CardContent>
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
                          className="pl-10"
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
                        className="pl-10"
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
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  {isSignUp && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">
                      <p className="text-purple-700 dark:text-purple-300">
                        🚀 <strong>What you'll get:</strong>
                      </p>
                      <ul className="text-purple-600 dark:text-purple-400 text-xs mt-1 space-y-1">
                        <li>• Personalized AI programming mentor</li>
                        <li>• Step-by-step lessons from beginner to pro</li>
                        <li>• Support in English and Swahili</li>
                        <li>• Real-world projects and code practice</li>
                      </ul>
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" disabled={loading}>
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
                
                {/* Help Text */}
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
              </CardContent>
            </Tabs>
          </Card>
          
          {/* Trust Indicators */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Trusted by aspiring developers</p>
            <div className="flex justify-center items-center gap-4 text-xs text-muted-foreground">
              <span>🌟 4.9/5 rating</span>
              <span>•</span>
              <span>👥 10,000+ learners</span>
              <span>•</span>
              <span>🇹🇿 Made in Tanzania</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
