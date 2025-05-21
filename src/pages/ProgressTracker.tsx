
import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, BarChart2, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ProgressTracker = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Learning Progress</h1>
            <p className="text-muted-foreground mt-2">
              Track your achievements and learning journey
            </p>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <ProgressCard title="Courses Completed" value="2" icon={BookOpen} />
          <ProgressCard title="Skills Learned" value="5" icon={CheckCircle} />
          <ProgressCard title="Hours Learned" value="12" icon={BarChart2} />
          <ProgressCard title="Badges Earned" value="3" icon={Award} />
        </div>

        {/* Course Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Learning Progress</CardTitle>
            <CardDescription>Track your progress in active courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CourseProgressItem 
              title="HTML & CSS Fundamentals" 
              progress={75} 
              status="In Progress"
              completedLessons={6}
              totalLessons={8}
            />
            <CourseProgressItem 
              title="JavaScript Basics" 
              progress={45} 
              status="In Progress"
              completedLessons={5}
              totalLessons={12}
            />
            <CourseProgressItem 
              title="Introduction to React" 
              progress={10} 
              status="Just Started"
              completedLessons={1}
              totalLessons={10}
            />
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements & Badges</CardTitle>
            <CardDescription>Rewards earned through your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <BadgeCard
                title="HTML Master"
                description="Completed the HTML fundamentals course"
                dateEarned="May 12, 2025"
              />
              <BadgeCard
                title="CSS Stylist"
                description="Created your first styled web page"
                dateEarned="May 15, 2025"
              />
              <BadgeCard
                title="Quick Learner"
                description="Completed 5 lessons in a single day"
                dateEarned="May 16, 2025"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

interface ProgressCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

const ProgressCard = ({ title, value, icon: Icon }: ProgressCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

interface CourseProgressItemProps {
  title: string;
  progress: number;
  status: string;
  completedLessons: number;
  totalLessons: number;
}

const CourseProgressItem = ({ 
  title,
  progress,
  status,
  completedLessons,
  totalLessons
}: CourseProgressItemProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {completedLessons}/{totalLessons} lessons
        </div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

interface BadgeCardProps {
  title: string;
  description: string;
  dateEarned: string;
}

const BadgeCard = ({ title, description, dateEarned }: BadgeCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary h-24 flex items-center justify-center">
        <Award className="h-12 w-12 text-primary-foreground" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-2">Earned on {dateEarned}</p>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
