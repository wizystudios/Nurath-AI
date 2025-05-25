import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { 
  BookOpen, 
  Code, 
  BarChart2, 
  Users, 
  MessageCircle, 
  ArrowRight, 
  Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  category: string;
}

interface UserProgress {
  id: string;
  tutorial_id: string;
  progress: number;
  completed: boolean;
  tutorial: Tutorial;
}

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const navigate = useNavigate();
  const [skillLevel, setSkillLevel] = useState<string>("beginner");

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (data.session) {
          setSession(data.session);
          
          // Fetch profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileData) {
            setUserName(profileData.full_name || data.session.user.email?.split('@')[0] || "User");
            setSkillLevel(profileData.skill_level || "beginner");
          } else {
            setUserName(data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || "User");
          }
          
          // Fetch tutorials
          const { data: tutorialsData } = await supabase
            .from('tutorials')
            .select('*')
            .order('created_at', { ascending: true });
            
          if (tutorialsData) {
            setTutorials(tutorialsData);
          }
          
          // Fetch user progress with tutorial details
          const { data: progressData } = await supabase
            .from('user_progress')
            .select(`
              *,
              tutorial:tutorials(*)
            `)
            .eq('user_id', data.session.user.id);
            
          if (progressData) {
            setUserProgress(progressData as UserProgress[]);
          }
          
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSession(session);
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User");
        } else {
          navigate("/auth");
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (userProgress.length === 0) return 0;
    
    const completedItems = userProgress.filter(item => item.completed).length;
    return Math.round((completedItems / userProgress.length) * 100);
  };

  // Get recommended tutorials based on skill level
  const getRecommendedTutorials = () => {
    return tutorials.filter(tutorial => tutorial.level === skillLevel).slice(0, 3);
  };

  // Get in-progress tutorials
  const getInProgressTutorials = () => {
    return userProgress
      .filter(progress => !progress.completed && progress.progress > 0)
      .slice(0, 2);
  };

  const cardData = [
    {
      title: "Learn Coding",
      description: "Access tutorials for HTML, CSS, JavaScript and more",
      icon: BookOpen,
      link: "/tutorials"
    },
    {
      title: "Practice Coding",
      description: "Interactive coding environment to test your skills",
      icon: Code,
      link: "/editor"
    },
    {
      title: "Track Progress",
      description: "See your learning journey and achievements",
      icon: BarChart2,
      link: "/progress"
    },
    {
      title: "Join Community",
      description: "Connect with other learners and mentors",
      icon: Users,
      link: "/community"
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm text-muted-foreground">Loading dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
            <p className="text-muted-foreground mt-2">
              Here's an overview of your learning journey and resources.
            </p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => navigate("/chat")}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat with Nurath
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {cardData.map((card, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="group-hover:translate-x-1 transition-transform"
                  onClick={() => navigate(card.link)}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Learning Progress */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Progress</CardTitle>
              <CardDescription>
                Overall completion of your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{calculateOverallProgress()}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
                
                {getInProgressTutorials().length > 0 ? (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-semibold">In Progress</h3>
                    {getInProgressTutorials().map((item) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{item.tutorial.title}</span>
                          <span className="text-xs text-muted-foreground">{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 mt-4 border rounded-md bg-muted/40">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        You haven't started any tutorials yet.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => navigate("/tutorials")}
                      >
                        Browse Tutorials
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
              <CardDescription>
                Based on your skill level and interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getRecommendedTutorials().length > 0 ? (
                <div className="space-y-4">
                  {getRecommendedTutorials().map((tutorial) => (
                    <div 
                      key={tutorial.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => navigate(`/tutorials?id=${tutorial.id}`)}
                    >
                      <div className="p-2 rounded-md bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{tutorial.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {tutorial.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-md">
                            {tutorial.level}
                          </span>
                          <span className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tutorial.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => navigate("/tutorials")}
                  >
                    View All Tutorials
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center p-4 border rounded-md bg-muted/40">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No tutorials available for your skill level.
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate("/tutorials")}
                    >
                      Browse All Tutorials
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent learning activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {userProgress.length > 0 ? (
                userProgress.slice(0, 3).map((progress) => (
                  <div key={progress.id} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {progress.completed ? (
                          <BarChart2 className="h-4 w-4" />
                        ) : (
                          <Code className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{progress.tutorial.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {progress.completed ? "Completed" : `${progress.progress}% completed`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/tutorials?id=${progress.tutorial_id}`)}
                    >
                      {progress.completed ? "Review" : "Continue"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  You haven't started any courses yet. Explore our tutorials to begin your learning journey.
                </p>
              )}
              
              {userProgress.length === 0 && (
                <Button onClick={() => navigate("/tutorials")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explore Tutorials
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
