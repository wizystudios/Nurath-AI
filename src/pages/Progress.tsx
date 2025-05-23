
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ProgressTracker: React.FC = () => {
  // Mock data for progress tracking
  const progressData = {
    htmlCss: 75,
    javascript: 60,
    react: 30,
    python: 45
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Learning Progress</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>HTML & CSS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressData.htmlCss} className="h-2" />
              <p className="text-sm text-right">{progressData.htmlCss}% Complete</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>JavaScript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressData.javascript} className="h-2" />
              <p className="text-sm text-right">{progressData.javascript}% Complete</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>React</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressData.react} className="h-2" />
              <p className="text-sm text-right">{progressData.react}% Complete</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Python</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressData.python} className="h-2" />
              <p className="text-sm text-right">{progressData.python}% Complete</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Learning Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Complete the React Components tutorial to improve your React skills</li>
              <li>Try the JavaScript DOM manipulation exercises</li>
              <li>Review Python basics before moving to advanced topics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressTracker;
