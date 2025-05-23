
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Clock, Zap } from "lucide-react";

const ProgressOverview = () => {
  const progressData = [
    {
      language: "HTML & CSS",
      progress: 75,
      level: "Intermediate",
      timeSpent: "24 hours",
      projects: 5,
      color: "bg-orange-500"
    },
    {
      language: "JavaScript",
      progress: 60,
      level: "Beginner",
      timeSpent: "18 hours",
      projects: 3,
      color: "bg-yellow-500"
    },
    {
      language: "React",
      progress: 30,
      level: "Beginner",
      timeSpent: "8 hours",
      projects: 1,
      color: "bg-blue-500"
    },
    {
      language: "Python",
      progress: 45,
      level: "Beginner",
      timeSpent: "15 hours",
      projects: 2,
      color: "bg-green-500"
    }
  ];

  const achievements = [
    { icon: Trophy, title: "First Steps", description: "Completed your first tutorial" },
    { icon: Target, title: "Goal Achiever", description: "Completed 5 lessons in a week" },
    { icon: Clock, title: "Consistency", description: "7-day learning streak" },
    { icon: Zap, title: "Quick Learner", description: "Completed HTML basics in record time" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {progressData.map((item, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.language}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {item.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.progress}% Complete</span>
                  <span className="text-muted-foreground">{item.timeSpent}</span>
                </div>
                <Progress value={item.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.projects} projects</span>
                  <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>Your learning milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-primary/10">
                  <achievement.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressOverview;
