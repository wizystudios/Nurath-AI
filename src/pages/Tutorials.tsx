
import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, Play, ArrowRight } from "lucide-react";

const Tutorials = () => {
  const beginnerTutorials = [
    {
      title: "Introduction to HTML",
      description: "Learn the basics of HTML markup language",
      duration: "1 hour",
      level: "Beginner"
    },
    {
      title: "CSS Fundamentals",
      description: "Understanding CSS styling and layouts",
      duration: "1.5 hours",
      level: "Beginner"
    },
    {
      title: "JavaScript Basics",
      description: "Get started with JavaScript programming",
      duration: "2 hours",
      level: "Beginner"
    }
  ];
  
  const intermediateTutorials = [
    {
      title: "Responsive Web Design",
      description: "Create websites that work on all devices",
      duration: "2.5 hours",
      level: "Intermediate"
    },
    {
      title: "React Fundamentals",
      description: "Build interactive UIs with React",
      duration: "3 hours",
      level: "Intermediate"
    }
  ];
  
  const advancedTutorials = [
    {
      title: "Full Stack Development",
      description: "Combine frontend and backend technologies",
      duration: "4 hours",
      level: "Advanced"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tutorials & Learning Resources</h1>
            <p className="text-muted-foreground mt-2">
              Expand your knowledge with our curated learning materials
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="beginner" className="mb-8">
          <TabsList className="w-full max-w-md mb-4">
            <TabsTrigger value="beginner" className="flex-1">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate" className="flex-1">Intermediate</TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="beginner">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {beginnerTutorials.map((tutorial, index) => (
                <TutorialCard key={index} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="intermediate">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {intermediateTutorials.map((tutorial, index) => (
                <TutorialCard key={index} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {advancedTutorials.map((tutorial, index) => (
                <TutorialCard key={index} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Popular Learning Paths</CardTitle>
            <CardDescription>
              Structured courses to help you achieve your goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Front-End Developer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Master HTML, CSS, JavaScript and React</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">
                    Explore Path
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Full Stack Developer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Learn both frontend and backend technologies</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">
                    Explore Path
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

interface TutorialProps {
  tutorial: {
    title: string;
    description: string;
    duration: string;
    level: string;
  };
}

const TutorialCard = ({ tutorial }: TutorialProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="bg-muted h-40 flex items-center justify-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/50" />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tutorial.title}</CardTitle>
        </div>
        <CardDescription>{tutorial.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Code className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{tutorial.level}</span>
          </div>
          <div className="flex items-center">
            <Play className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{tutorial.duration}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Start Learning
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Tutorials;
