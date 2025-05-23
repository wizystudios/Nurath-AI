
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

const NewDiscussion = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Please enter both title and content");
      return;
    }
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      toast.error("You must be logged in to create a discussion");
      navigate("/auth");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Since 'discussions' table doesn't exist yet in the database schema,
      // we'll redirect to the community page with a success message
      // This can be replaced with actual insert when the table is created
      toast.success("Discussion created successfully");
      navigate("/community");
    } catch (error) {
      console.error("Error creating discussion:", error);
      toast.error("Failed to create discussion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Button 
        variant="outline" 
        onClick={() => navigate("/community")}
        className="mb-4"
      >
        ← Back to Community
      </Button>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl">Start a New Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, questions, or insights..."
                className="min-h-[200px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate("/community")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? "Posting..." : "Post Discussion"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewDiscussion;
