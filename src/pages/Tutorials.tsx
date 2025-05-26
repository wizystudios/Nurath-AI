
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, Play, ArrowRight, Search, Clock, Tag, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { comprehensiveTutorials } from "@/data/tutorialContent";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  level: string;
  category: string;
}

interface UserProgress {
  tutorial_id: string;
  progress: number;
  completed: boolean;
}

const Tutorials = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  
  // Get the tutorial ID from the URL if provided
  const tutorialId = searchParams.get('id');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use comprehensive tutorial content
        const tutorialsData = comprehensiveTutorials.map(tutorial => ({
          ...tutorial,
          level: tutorial.level === 'non-developer' ? 'beginner' : tutorial.level
        }));
        
        setTutorials(tutorialsData);
        setFilteredTutorials(tutorialsData);
        
        // Fetch the user's progress if logged in
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user?.id) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', sessionData.session.user.id);
            
          if (progressError) throw progressError;
          
          // Convert to a map for easy lookup
          const progressMap: Record<string, UserProgress> = {};
          
          if (progressData) {
            progressData.forEach(item => {
              progressMap[item.tutorial_id] = {
                tutorial_id: item.tutorial_id,
                progress: item.progress,
                completed: item.completed
              };
            });
          }
          
          setUserProgress(progressMap);
        }
        
        // If tutorial ID is provided in URL, load that tutorial
        if (tutorialId) {
          const tutorial = tutorialsData.find(t => t.id === tutorialId);
          if (tutorial) {
            setSelectedTutorial(tutorial);
          }
        }
      } catch (error) {
        console.error("Error fetching tutorials:", error);
        toast.error("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tutorialId]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterTutorials(query, selectedLanguage);
  };
  
  const handleLanguageFilter = (language: string) => {
    setSelectedLanguage(language);
    filterTutorials(searchQuery, language);
  };
  
  const filterTutorials = (query: string, language: string) => {
    let filtered = tutorials;
    
    // Filter by language/category
    if (language !== "all") {
      filtered = filtered.filter(tutorial => tutorial.category.toLowerCase() === language.toLowerCase());
    }
    
    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(tutorial => {
        return (
          tutorial.title.toLowerCase().includes(lowerQuery) ||
          tutorial.description.toLowerCase().includes(lowerQuery) ||
          tutorial.category.toLowerCase().includes(lowerQuery) ||
          tutorial.level.toLowerCase().includes(lowerQuery)
        );
      });
    }
    
    setFilteredTutorials(filtered);
  };
  
  const startTutorial = async (tutorial: Tutorial) => {
    try {
      // Check for existing progress
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user?.id) {
        toast.error("Please log in to track your progress");
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      // Check if progress entry already exists
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('tutorial_id', tutorial.id)
        .single();
        
      if (!existingProgress) {
        // Create new progress entry
        await supabase
          .from('user_progress')
          .insert([
            {
              user_id: userId,
              tutorial_id: tutorial.id,
              progress: 0,
              completed: false
            }
          ]);
          
        // Update local state
        setUserProgress({
          ...userProgress,
          [tutorial.id]: {
            tutorial_id: tutorial.id,
            progress: 0,
            completed: false
          }
        });
      }
      
      // Set as selected tutorial
      setSelectedTutorial(tutorial);
      
      // Update URL with tutorial ID
      setSearchParams({ id: tutorial.id });
    } catch (error) {
      console.error("Error starting tutorial:", error);
      toast.error("Failed to start tutorial");
    }
  };
  
  const updateProgress = async (tutorialId: string, progress: number) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.user?.id) {
        return;
      }
      
      const userId = sessionData.session.user.id;
      
      // Update progress in database
      await supabase
        .from('user_progress')
        .update({
          progress,
          completed: progress === 100,
          last_accessed: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('tutorial_id', tutorialId);
        
      // Update local state
      setUserProgress({
        ...userProgress,
        [tutorialId]: {
          tutorial_id: tutorialId,
          progress,
          completed: progress === 100
        }
      });
      
      if (progress === 100) {
        toast.success("Tutorial completed! Great job!");
      } else {
        toast.success("Progress updated!");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };
  
  const closeSelectedTutorial = () => {
    setSelectedTutorial(null);
    setSearchParams({});
  };
  
  // Group tutorials by programming language
  const getTutorialsByLanguage = () => {
    const languages = ["javascript", "python", "java", "html/css", "react"];
    const languageGroups: Record<string, Tutorial[]> = {};
    
    languages.forEach(lang => {
      languageGroups[lang] = tutorials.filter(tutorial => 
        tutorial.category.toLowerCase() === lang.toLowerCase()
      );
    });
    
    return languageGroups;
  };
  
  const startLearningPath = (language: string) => {
    setSelectedLanguage(language);
    handleLanguageFilter(language);
    toast.success(`Starting ${language.toUpperCase()} learning path!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programming Tutorials</h1>
          <p className="text-muted-foreground mt-2">
            Learn programming languages step-by-step with AI guidance
          </p>
        </div>
      </div>
      
      {selectedTutorial ? (
        // Tutorial detail view
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline"
              onClick={closeSelectedTutorial}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Tutorials
            </Button>
            
            {userProgress[selectedTutorial.id] && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Progress: {userProgress[selectedTutorial.id].progress}%
                </span>
                <Progress 
                  value={userProgress[selectedTutorial.id].progress} 
                  className="w-32 h-2"
                />
              </div>
            )}
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedTutorial.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{selectedTutorial.level}</Badge>
                    <Badge variant="outline" className="capitalize">{selectedTutorial.category}</Badge>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="text-xs">{selectedTutorial.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="text-base mt-2">
                {selectedTutorial.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-full">
              <div className="p-6 border rounded-md bg-gray-50 dark:bg-gray-900">
                <div 
                  className="tutorial-content"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedTutorial.content
                      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto"><code>$2</code></pre>')
                      .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>')
                      .replace(/\n/g, '<br>')
                      .replace(/#{6}\s(.+)/g, '<h6 class="text-sm font-semibold mt-4 mb-2">$1</h6>')
                      .replace(/#{5}\s(.+)/g, '<h5 class="text-base font-semibold mt-4 mb-2">$1</h5>')
                      .replace(/#{4}\s(.+)/g, '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>')
                      .replace(/#{3}\s(.+)/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
                      .replace(/#{2}\s(.+)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                      .replace(/#{1}\s(.+)/g, '<h1 class="text-3xl font-bold mt-8 mb-6">$1</h1>')
                  }}
                />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div>
                {!userProgress[selectedTutorial.id]?.completed ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => updateProgress(selectedTutorial.id, Math.min((userProgress[selectedTutorial.id]?.progress || 0) + 25, 100))}
                    >
                      Mark Progress (+25%)
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateProgress(selectedTutorial.id, 100)}
                    >
                      Mark as Complete
                    </Button>
                  </div>
                ) : (
                  <Badge variant="default" className="bg-green-500">
                    <Trophy className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      ) : (
        // Tutorial list view organized by programming language
        <>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutorials..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          <Tabs value={selectedLanguage} onValueChange={handleLanguageFilter} className="mb-8">
            <TabsList className="w-full max-w-2xl mb-4">
              <TabsTrigger value="all">All Languages</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="java">Java</TabsTrigger>
              <TabsTrigger value="html/css">HTML/CSS</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {/* Learning Paths Section */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Programming Learning Paths</CardTitle>
                  <CardDescription>
                    Choose a programming language to start your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(getTutorialsByLanguage()).map(([language, tutorials]) => (
                      tutorials.length > 0 && (
                        <Card key={language} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="capitalize text-lg">{language}</CardTitle>
                              <Code className="h-5 w-5 text-primary" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                              {tutorials.length} tutorial{tutorials.length > 1 ? 's' : ''} available
                            </p>
                            <ul className="space-y-1 text-sm">
                              {tutorials.slice(0, 3).map(tutorial => (
                                <li key={tutorial.id} className="flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-primary"></div>
                                  {tutorial.title}
                                </li>
                              ))}
                              {tutorials.length > 3 && (
                                <li className="text-muted-foreground">
                                  +{tutorials.length - 3} more...
                                </li>
                              )}
                            </ul>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => startLearningPath(language)}
                            >
                              Start Learning Path
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Tutorials Grid */}
              <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  Array(6).fill(0).map((_, index) => (
                    <Card key={index} className="overflow-hidden animate-pulse">
                      <div className="bg-muted h-40"></div>
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full mt-2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-4 bg-muted rounded w-1/4"></div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="h-10 bg-muted rounded w-full"></div>
                      </CardFooter>
                    </Card>
                  ))
                ) : filteredTutorials.length > 0 ? (
                  filteredTutorials.map((tutorial) => (
                    <TutorialCard 
                      key={tutorial.id} 
                      tutorial={tutorial} 
                      progress={userProgress[tutorial.id]}
                      onStart={() => startTutorial(tutorial)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8">
                    <p className="text-muted-foreground">No tutorials found matching your criteria</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Individual language tabs */}
            {["javascript", "python", "java", "html/css", "react"].map((language) => (
              <TabsContent key={language} value={language}>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold capitalize mb-2">{language} Tutorials</h2>
                  <p className="text-muted-foreground">
                    Master {language} programming with step-by-step tutorials
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredTutorials.map((tutorial) => (
                    <TutorialCard 
                      key={tutorial.id} 
                      tutorial={tutorial} 
                      progress={userProgress[tutorial.id]}
                      onStart={() => startTutorial(tutorial)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
};

interface TutorialCardProps {
  tutorial: Tutorial;
  progress?: UserProgress;
  onStart: () => void;
}

const TutorialCard = ({ tutorial, progress, onStart }: TutorialCardProps) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-orange-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'javascript': 'bg-yellow-500',
      'python': 'bg-blue-500',
      'java': 'bg-red-600',
      'html/css': 'bg-orange-500',
      'react': 'bg-cyan-500',
    };
    return colors[category.toLowerCase()] || 'bg-purple-500';
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
      <div className={`${getCategoryColor(tutorial.category)} h-32 flex items-center justify-center relative`}>
        <Code className="h-12 w-12 text-white" />
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 bg-white/20 text-white border-white/30"
        >
          {tutorial.level}
        </Badge>
        <Badge 
          variant="secondary" 
          className="absolute top-2 left-2 bg-black/20 text-white border-white/30 capitalize"
        >
          {tutorial.category}
        </Badge>
      </div>
      <CardHeader className="pb-2 flex-1">
        <CardTitle className="text-lg">{tutorial.title}</CardTitle>
        <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{tutorial.duration}</span>
          </div>
        </div>
        
        {progress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{progress.completed ? "Completed" : `${progress.progress}% complete`}</span>
              <span>{progress.progress}/100</span>
            </div>
            <Progress value={progress.progress} className="h-1" />
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t mt-auto pt-4">
        <Button 
          className="w-full" 
          variant={progress?.completed ? "outline" : "default"}
          onClick={onStart}
        >
          {!progress ? (
            <>
              Start Learning
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : progress.progress > 0 && !progress.completed ? (
            <>
              Continue
              <Play className="ml-2 h-4 w-4" />
            </>
          ) : progress.completed ? (
            <>
              Review
              <BookOpen className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Start Learning
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Tutorials;
