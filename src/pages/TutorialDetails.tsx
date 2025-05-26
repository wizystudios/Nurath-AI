
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, CheckCircle, Play } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import QuizComponent from "@/components/QuizComponent";
import MessageRenderer from "@/components/MessageRenderer";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  level: string;
  category: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
}

const TutorialDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchTutorialData();
      checkUser();
    }
  }, [id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchTutorialData = async () => {
    try {
      setLoading(true);
      
      // Fetch tutorial
      const { data: tutorialData, error: tutorialError } = await supabase
        .from('tutorials')
        .select('*')
        .eq('id', id)
        .single();

      if (tutorialError) throw tutorialError;
      setTutorial(tutorialData);

      // Fetch quiz for this tutorial
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions(*)
        `)
        .eq('tutorial_id', id)
        .single();

      if (!quizError && quizData) {
        setQuiz({
          ...quizData,
          questions: quizData.quiz_questions.sort((a: any, b: any) => a.order_index - b.order_index)
        });
      }

      // Check user progress if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('tutorial_id', id)
          .single();

        if (progressData) {
          setProgress(progressData.progress || 0);
          setIsCompleted(progressData.completed || false);
        }

        // Check if quiz was completed
        if (quizData) {
          const { data: quizAttempts } = await supabase
            .from('user_quiz_attempts')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('quiz_id', quizData.id);

          setQuizCompleted(quizAttempts && quizAttempts.length > 0);
        }
      }
    } catch (error) {
      console.error('Error fetching tutorial:', error);
      toast.error("Failed to load tutorial");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newProgress: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          tutorial_id: id,
          progress: newProgress,
          completed: newProgress >= 100,
          last_accessed: new Date().toISOString()
        });

      if (error) throw error;
      
      setProgress(newProgress);
      if (newProgress >= 100) {
        setIsCompleted(true);
        toast.success("🎉 Tutorial completed!");
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleCompleteLesson = () => {
    updateProgress(100);
  };

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    setQuizCompleted(true);
    const percentage = Math.round((score / totalQuestions) * 100);
    toast.success(`Quiz completed! You scored ${percentage}%`);
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="container mx-auto py-6 max-w-4xl text-center">
        <h1 className="text-2xl font-bold mb-4">Tutorial not found</h1>
        <Button onClick={() => navigate('/tutorials')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutorials
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/tutorials')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutorials
        </Button>
      </div>

      {/* Tutorial Info */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl mb-2">{tutorial.title}</CardTitle>
              <p className="text-muted-foreground">{tutorial.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getLevelColor(tutorial.level)} text-white`}>
                {tutorial.level}
              </Badge>
              <Badge variant="outline">{tutorial.category.toUpperCase()}</Badge>
              <Badge variant="outline">{tutorial.duration}</Badge>
              {quiz && <Badge className="bg-yellow-500 text-white"><Trophy className="h-3 w-3 mr-1" />Has Quiz</Badge>}
            </div>
          </div>
          
          {user && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Tutorial Content</TabsTrigger>
          <TabsTrigger value="quiz" disabled={!quiz}>
            Quiz {quizCompleted && <CheckCircle className="h-4 w-4 ml-1 text-green-500" />}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-gray max-w-none dark:prose-invert">
                <MessageRenderer content={tutorial.content} />
              </div>
              
              {user && !isCompleted && (
                <div className="mt-8 pt-6 border-t">
                  <Button onClick={handleCompleteLesson} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                </div>
              )}
              
              {isCompleted && (
                <div className="mt-8 pt-6 border-t text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Tutorial Completed!</span>
                  </div>
                  {quiz && !quizCompleted && (
                    <Button onClick={() => setShowQuiz(true)}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Take the Quiz
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quiz">
          {quiz ? (
            <QuizComponent 
              quiz={quiz} 
              onComplete={handleQuizComplete}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No quiz available for this tutorial.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorialDetails;
