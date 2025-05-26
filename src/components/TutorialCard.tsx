import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  category: string;
  content: string;
}

interface TutorialCardProps {
  tutorial: Tutorial;
  progress?: number;
  hasQuiz?: boolean;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial, progress = 0, hasQuiz = false }) => {
  const navigate = useNavigate();

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'html': return 'bg-orange-500';
      case 'css': return 'bg-blue-500';
      case 'javascript': return 'bg-yellow-500';
      case 'python': return 'bg-green-500';
      case 'mysql': return 'bg-purple-500';
      case 'java': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStartTutorial = () => {
    navigate(`/tutorials/${tutorial.id}`);
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
          <div className="flex gap-1">
            {hasQuiz && (
              <span aria-label="Has Quiz">
                <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`${getLevelColor(tutorial.level)} text-white`}>
            {tutorial.level}
          </Badge>
          <Badge className={`${getCategoryColor(tutorial.category)} text-white`}>
            {tutorial.category.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {tutorial.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{tutorial.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Interactive</span>
          </div>
        </div>

        {progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleStartTutorial} 
          className="w-full"
          variant={progress > 0 ? "outline" : "default"}
        >
          {progress > 0 ? "Continue Learning" : "Start Tutorial"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TutorialCard;
