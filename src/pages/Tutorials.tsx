
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import TutorialCard from "@/components/TutorialCard";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  category: string;
  content: string;
}

const Tutorials = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<{ [key: string]: number }>({});
  const [quizAvailability, setQuizAvailability] = useState<{ [key: string]: boolean }>({});

  const levels = ["beginner", "intermediate", "advanced"];
  const categories = ["html", "css", "javascript", "python", "mysql", "java"];

  useEffect(() => {
    fetchTutorials();
    fetchUserProgress();
    fetchQuizAvailability();
  }, []);

  useEffect(() => {
    filterTutorials();
  }, [searchTerm, selectedLevel, selectedCategory, tutorials]);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutorials(data || []);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      toast.error("Failed to load tutorials");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('tutorial_id, progress')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const progressMap: { [key: string]: number } = {};
      data?.forEach(item => {
        progressMap[item.tutorial_id] = item.progress || 0;
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchQuizAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('tutorial_id');

      if (error) throw error;

      const quizMap: { [key: string]: boolean } = {};
      data?.forEach(item => {
        quizMap[item.tutorial_id] = true;
      });
      setQuizAvailability(quizMap);
    } catch (error) {
      console.error('Error fetching quiz availability:', error);
    }
  };

  const filterTutorials = () => {
    let filtered = tutorials;

    if (searchTerm) {
      filtered = filtered.filter(tutorial =>
        tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(tutorial => tutorial.level === selectedLevel);
    }

    if (selectedCategory) {
      filtered = filtered.filter(tutorial => tutorial.category === selectedCategory);
    }

    setFilteredTutorials(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLevel(null);
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">📚 Programming Tutorials</h1>
        <p className="text-muted-foreground">
          Master programming with our comprehensive, step-by-step courses
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tutorials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Level Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Level:</span>
            {levels.map(level => (
              <Badge
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              >
                {level}
              </Badge>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Category:</span>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer uppercase"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {(selectedLevel || selectedCategory || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredTutorials.length} of {tutorials.length} tutorials
      </div>

      {/* Tutorial Grid */}
      {filteredTutorials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              progress={userProgress[tutorial.id] || 0}
              hasQuiz={quizAvailability[tutorial.id] || false}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
            No tutorials found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Tutorials;
