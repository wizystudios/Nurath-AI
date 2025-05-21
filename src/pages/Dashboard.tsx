
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { BookOpen, Code, BarChart2, Users, MessageCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        setUserName(data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || "User");
      } else {
        navigate("/auth");
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
          <Button className="mt-4 md:mt-0" onClick={() => navigate("/")}>
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

        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>
              Your recent activity and recommended materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground">
                You haven't started any courses yet. Explore our tutorials to begin your learning journey.
              </p>
              <Button onClick={() => navigate("/tutorials")}>
                <BookOpen className="mr-2 h-4 w-4" />
                Explore Tutorials
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
