
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  correct_answer: string;
  options: string[];
  explanation: string;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, totalQuestions: number) => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    
    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setShowResults(true);

    // Save quiz attempt to database
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await supabase
          .from('user_quiz_attempts')
          .insert({
            user_id: session.session.user.id,
            quiz_id: quiz.id,
            score: correctAnswers,
            total_questions: quiz.questions.length,
            answers: userAnswers
          });
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }

    setIsSubmitting(false);
    onComplete(correctAnswers, quiz.questions.length);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const getScoreColor = () => {
    const percentage = (score / quiz.questions.length) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = () => {
    const percentage = (score / quiz.questions.length) * 100;
    if (percentage >= 90) return "🎉 Excellent work!";
    if (percentage >= 80) return "👏 Great job!";
    if (percentage >= 70) return "👍 Good work!";
    if (percentage >= 60) return "📚 Keep practicing!";
    return "💪 Don't give up, try again!";
  };

  if (showResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <p className="text-muted-foreground">{getScoreMessage()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor()}`}>
              {score}/{quiz.questions.length}
            </div>
            <p className="text-muted-foreground">
              {Math.round((score / quiz.questions.length) * 100)}% Correct
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Review Your Answers:</h3>
            {quiz.questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="font-medium">{question.question_text}</p>
                  </div>
                  <div className="ml-7 space-y-1 text-sm">
                    <p>Your answer: <span className={isCorrect ? "text-green-600" : "text-red-600"}>{userAnswer}</span></p>
                    {!isCorrect && (
                      <p>Correct answer: <span className="text-green-600">{question.correct_answer}</span></p>
                    )}
                    <p className="text-muted-foreground italic">{question.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={resetQuiz} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{quiz.title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          
          {currentQuestion.question_type === 'multiple_choice' && (
            <RadioGroup
              value={userAnswers[currentQuestionIndex] || ""}
              onValueChange={handleAnswerSelect}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <RadioGroup
              value={userAnswers[currentQuestionIndex] || ""}
              onValueChange={handleAnswerSelect}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}
        </div>

        <div className="flex justify-between">
          <Button 
            onClick={handlePrevious} 
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!userAnswers[currentQuestionIndex] || isSubmitting}
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? 
              (isSubmitting ? "Submitting..." : "Finish Quiz") : 
              "Next"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComponent;
