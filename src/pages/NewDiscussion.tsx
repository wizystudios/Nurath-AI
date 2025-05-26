
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
      const { data, error } = await supabase
        .from('discussions')
        .insert({
          title: title.trim(),
          content: content.trim(),
          user_id: sessionData.session.user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("✨ Discussion created successfully!");
      navigate("/community");
    } catch (error) {
      console.error("Error creating discussion:", error);
      toast.error("Failed to create discussion. Please try again.");
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
            <CardTitle className="text-xl">🚀 Start a New Discussion</CardTitle>
            <p className="text-muted-foreground">
              Share your thoughts, ask questions, or help others in the community!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Discussion Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What would you like to discuss? 🤔"
                required
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/200 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea 
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, questions, or insights... Be specific and helpful! 💡"
                className="min-h-[200px]"
                required
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {content.length}/2000 characters
              </p>
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
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? "✨ Creating..." : "🚀 Post Discussion"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewDiscussion;
