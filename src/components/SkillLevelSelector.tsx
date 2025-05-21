
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { type SkillLevel } from "@/pages/Index";

interface SkillLevelSelectorProps {
  currentLevel: SkillLevel;
  onLevelChange: (level: SkillLevel) => void;
}

const SkillLevelSelector: React.FC<SkillLevelSelectorProps> = ({
  currentLevel,
  onLevelChange,
}) => {
  // Define skill levels with their display names and descriptions
  const skillLevels: Record<SkillLevel, { name: string; description: string }> = {
    beginner: {
      name: "Beginner",
      description: "New to programming and technology",
    },
    intermediate: {
      name: "Intermediate",
      description: "Familiar with basic concepts",
    },
    advanced: {
      name: "Advanced",
      description: "Experienced developer",
    },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">
          {skillLevels[currentLevel].name}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(skillLevels).map(([key, { name, description }]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onLevelChange(key as SkillLevel)}
            className={`cursor-pointer ${currentLevel === key ? 'bg-accent' : ''}`}
          >
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SkillLevelSelector;
