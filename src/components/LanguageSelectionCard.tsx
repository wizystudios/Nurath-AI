
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkillLevel } from "@/pages/Index";

interface LanguageSelectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  level: string;
  onSelect: () => void;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const LanguageSelectionCard: React.FC<LanguageSelectionCardProps> = ({
  title,
  description,
  icon,
  level,
  onSelect,
  difficulty
}) => {
  // Badge colors based on difficulty
  const badgeStyles = {
    beginner: "bg-green-100 text-green-800 hover:bg-green-200",
    intermediate: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    advanced: "bg-purple-100 text-purple-800 hover:bg-purple-200"
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <Badge className={badgeStyles[difficulty]}>{difficulty}</Badge>
        </div>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{level}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex gap-4 items-center mb-2">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
            {icon}
          </div>
          <p className="text-sm">{description}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
          onClick={onSelect}
        >
          Start Learning
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LanguageSelectionCard;
