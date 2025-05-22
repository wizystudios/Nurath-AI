
import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Award, BarChart2, CheckCircle, BookMarked, Calendar, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface Tutorial {
  id: string;
  title: string;
  level: string;
}

interface UserProgress {
  id: string;
  tutorial_id: string;
  progress: number;
  completed: boolean;
  last_accessed: string;
  tutorial: Tutorial;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  earned_at?: string;
}

const ProgressTracker = () => {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedCourses: 0,
    skillsLearned: 0,
    hoursLearned: 0,
    badgesEarned: 0
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session?.user?.id) {
          return;
        }
        
        const userId = sessionData.session.user.id;
        
        // Fetch user progress with tutorial details
        const { data: progressData } = await supabase
          .from('user_progress')
          .select(`
            *,
            tutorial:tutorials(*)
          `)
          .eq('user_id', userId)
          .order('last_accessed', { ascending: false });
          
        if (progressData) {
          setUserProgress(progressData as UserProgress[]);
          
          // Calculate stats
          const completedCourses = progressData.filter(p => p.completed).length;
          
          // Each tutorial counts as a skill
          const skillsLearned = completedCourses;
          
          // Estimate hours based on completed tutorials and progress
          let hoursEstimate = 0;
          progressData.forEach(progress => {
            const tutorial = progress.tutorial as Tutorial;
            // Extract numeric part of duration (e.g., "2 hours" -> 2)
            const hours = parseFloat(tutorial.tutorial.duration.split(' ')[0]);
            // Completed tutorials count fully, in-progress ones count proportionally
            hoursEstimate += progress.completed ? hours : (hours * progress.progress / 100);
          });
          
          setStats({
            completedCourses,
            skillsLearned,
            hoursLearned: Math.round(hoursEstimate),
            badgesEarned: 0 // Will be updated when achievements are fetched
          });
        }
        
        // Fetch user achievements
        const { data: userAchievementsData } = await supabase
          .from('user_achievements')
          .select(`
            achievement_id,
            earned_at
          `)
          .eq('user_id', userId);
          
        if (userAchievementsData) {
          // Create a map of achievement IDs to earned dates
          const userAchievementMap: Record<string, string> = {};
          userAchievementsData.forEach(item => {
            userAchievementMap[item.achievement_id] = item.earned_at;
          });
          
          // Fetch all achievements
          const { data: achievementsData } = await supabase
            .from('achievements')
            .select('*');
            
          if (achievementsData) {
            // Mark achievements as earned if they exist in the user's earned achievements
            const processedAchievements = achievementsData.map(achievement => ({
              ...achievement,
              earned_at: userAchievementMap[achievement.id]
            }));
            
            setAchievements(processedAchievements);
            
            // Update badges count
            setStats(prev => ({
              ...prev,
              badgesEarned: Object.keys(userAchievementMap).length
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, []);

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
          <ProgressCard title="Tutorials Completed" value={stats.completedCourses.toString()} icon={BookOpen} />
          <ProgressCard title="Skills Learned" value={stats.skillsLearned.toString()} icon={CheckCircle} />
          <ProgressCard title="Hours Learned" value={stats.hoursLearned.toString()} icon={BarChart2} />
          <ProgressCard title="Badges Earned" value={stats.badgesEarned.toString()} icon={Award} />
        </div>

        {/* Course Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Learning Progress</CardTitle>
            <CardDescription>Track your progress in active courses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              // Loading state
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="space-y-2 animate-pulse">
                  <div className="flex justify-between">
                    <div className="h-5 bg-muted rounded w-1/3"></div>
                    <div className="h-5 bg-muted rounded w-1/6"></div>
                  </div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              ))
            ) : userProgress.length > 0 ? (
              userProgress
                .filter(p => p.progress > 0)
                .slice(0, 5)
                .map(progress => (
                  <CourseProgressItem 
                    key={progress.id}
                    title={(progress.tutorial as any).title} 
                    progress={progress.progress} 
                    status={progress.completed ? "Completed" : progress.progress >= 50 ? "In Progress" : "Just Started"}
                    completedLessons={Math.round(progress.progress / 10)}
                    totalLessons={10}
                  />
                ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  You haven't started any tutorials yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Calendar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Learning Activity</CardTitle>
            <CardDescription>Your daily learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userProgress.slice(0, 5).map(progress => (
                <div key={progress.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="p-2 rounded-full bg-primary/10">
                    {progress.completed ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <BookMarked className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-sm">{(progress.tutorial as any).title}</h3>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
                        {progress.completed ? "Completed" : `${progress.progress}%`}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(progress.last_accessed).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {userProgress.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No activity recorded yet.</p>
                </div>
              )}
            </div>
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
              {loading ? (
                // Loading state
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="h-24 bg-muted"></div>
                    <div className="p-4">
                      <div className="h-5 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  </Card>
                ))
              ) : achievements.length > 0 ? (
                achievements.map(achievement => (
                  <BadgeCard
                    key={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    dateEarned={achievement.earned_at}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-4">
                  <p className="text-muted-foreground">
                    Complete tutorials to earn achievements and badges!
                  </p>
                </div>
              )}
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
  dateEarned?: string;
}

const BadgeCard = ({ title, description, dateEarned }: BadgeCardProps) => {
  const isEarned = !!dateEarned;
  
  return (
    <Card className={`overflow-hidden ${!isEarned ? 'opacity-50' : ''}`}>
      <div className={`${isEarned ? 'bg-primary' : 'bg-muted'} h-24 flex items-center justify-center`}>
        <Award className={`h-12 w-12 ${isEarned ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
        {isEarned ? (
          <p className="text-xs text-muted-foreground mt-2">Earned on {new Date(dateEarned).toLocaleDateString()}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-2 flex items-center">
            <Target className="mr-1 h-3 w-3" />
            Not yet earned
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
