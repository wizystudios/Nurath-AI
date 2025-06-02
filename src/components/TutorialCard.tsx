
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, BookOpen, Play } from "lucide-react";

interface TutorialCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  category: string;
  progress?: number;
  onStart: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({
  title,
  description,
  duration,
  level,
  category,
  progress = 0,
  onStart
}) => {
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'javascript':
        return '⚡';
      case 'python':
        return '🐍';
      case 'react':
        return '⚛️';
      default:
        return '📚';
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {getCategoryIcon(category)}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                {title}
              </CardTitle>
              <Badge 
                className={`mt-1 ${getLevelColor(level)}`}
              >
                {level}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {description}
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span>{progress}% complete</span>
            </div>
          </div>
          
          {progress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          <Button 
            onClick={onStart}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <Play className="w-4 h-4 mr-2" />
            {progress > 0 ? 'Continue Learning' : 'Start Tutorial'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TutorialCard;
