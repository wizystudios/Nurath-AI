
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Sparkles, Code, Globe, Database, Heart, Star } from "lucide-react";
import Logo from "@/components/Logo";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        throw error;
      }

      toast.success("Account created successfully! 🎉 Welcome to Nurath.AI!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Welcome back! 🚀");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Interactive Learning",
      description: "Learn coding through AI-powered conversations",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multiple Languages",
      description: "HTML, CSS, JavaScript, Python, Java & more",
      gradient: "from-green-500 to-teal-600"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Real Projects",
      description: "Build actual applications as you learn",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Personalized",
      description: "Tailored learning path just for you",
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Features */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Logo size="md" showText={false} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Nurath.AI ✨
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by NK Technology Tanzania
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  🚀 Learn Coding with AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Join thousands of students learning programming through personalized AI assistance
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-3`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span>10,000+ Students</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span>Made in Tanzania 🇹🇿</span>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome! 👋
                </CardTitle>
                <CardDescription className="text-sm">
                  Start your coding journey today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <Button
                      onClick={handleSignIn}
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isLoading ? "Signing in..." : "🚀 Sign In"}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <Button
                      onClick={handleSignUp}
                      disabled={isLoading}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isLoading ? "Creating account..." : "✨ Create Account"}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    ← Continue as Guest (3 free prompts)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
