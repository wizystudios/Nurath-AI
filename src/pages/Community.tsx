
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Heart, Plus, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Discussion {
  id: string;
  title: string;
  content: string;
  user_id: string;
  likes: number;
  replies: number;
  created_at: string;
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

const Community = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // New discussion form
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    checkUser();
    loadDiscussions();
    
    // Set up real-time subscription for discussions
    const discussionsSubscription = supabase
      .channel('discussions_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'discussions'
      }, () => {
        loadDiscussions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(discussionsSubscription);
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
      toast.error("Failed to load discussions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadReplies = async (discussionId: string) => {
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error("Failed to load replies");
    }
  };

  const createDiscussion = async () => {
    if (!user) {
      toast.error("Please sign in to create discussions");
      navigate("/auth");
      return;
    }

    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    try {
      const { error } = await supabase
        .from('discussions')
        .insert({
          title: newTitle.trim(),
          content: newContent.trim(),
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Discussion created! 🎉");
      setNewTitle("");
      setNewContent("");
      setShowNewDiscussion(false);
      loadDiscussions();
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error("Failed to create discussion");
    }
  };

  const addReply = async () => {
    if (!user) {
      toast.error("Please sign in to reply");
      navigate("/auth");
      return;
    }

    if (!newReply.trim() || !selectedDiscussion) return;

    try {
      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: selectedDiscussion.id,
          content: newReply.trim(),
          user_id: user.id
        });

      if (error) throw error;

      // Update reply count
      await supabase
        .from('discussions')
        .update({ replies: selectedDiscussion.replies + 1 })
        .eq('id', selectedDiscussion.id);

      setNewReply("");
      loadReplies(selectedDiscussion.id);
      loadDiscussions(); // Refresh to update reply count
      toast.success("Reply added! 💬");
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error("Failed to add reply");
    }
  };

  const likeDiscussion = async (discussionId: string) => {
    if (!user) {
      toast.error("Please sign in to like discussions");
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('discussion_likes')
        .select('id')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id);

        // Decrease like count
        const discussion = discussions.find(d => d.id === discussionId);
        if (discussion) {
          await supabase
            .from('discussions')
            .update({ likes: Math.max(0, discussion.likes - 1) })
            .eq('id', discussionId);
        }
      } else {
        // Like
        await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });

        // Increase like count
        const discussion = discussions.find(d => d.id === discussionId);
        if (discussion) {
          await supabase
            .from('discussions')
            .update({ likes: discussion.likes + 1 })
            .eq('id', discussionId);
        }
      }

      loadDiscussions();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    }
  };

  const openDiscussion = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    loadReplies(discussion.id);
  };

  const getUserDisplayName = (userId: string) => {
    // For now, just show user ID. Later we can implement proper user profiles
    return `User ${userId.slice(0, 8)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading community discussions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
            🌟 Community Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connect, share, and learn together with the Nurath.AI community!
          </p>
        </div>
        
        <Button
          onClick={() => setShowNewDiscussion(!showNewDiscussion)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* New Discussion Form */}
      {showNewDiscussion && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>✨ Start a New Discussion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="💭 What's your discussion about?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="💬 Share your thoughts, questions, or insights..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={createDiscussion}
                disabled={!newTitle.trim() || !newContent.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                🚀 Create Discussion
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewDiscussion(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discussions List */}
        <div className="lg:col-span-2 space-y-4">
          {discussions.length > 0 ? (
            discussions.map((discussion) => (
              <Card 
                key={discussion.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => openDiscussion(discussion)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                        {discussion.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {discussion.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {getUserDisplayName(discussion.user_id)[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{getUserDisplayName(discussion.user_id)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{discussion.likes}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{discussion.replies}</span>
                        </div>
                        
                        <span>
                          {new Date(discussion.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        likeDiscussion(discussion.id);
                      }}
                      className="ml-4"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
                <p className="text-gray-500 mb-4">
                  Be the first to start a conversation in our community!
                </p>
                <Button
                  onClick={() => setShowNewDiscussion(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  🚀 Start First Discussion
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Discussion Detail / Chat */}
        <div className="lg:col-span-1">
          {selectedDiscussion ? (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">{selectedDiscussion.title}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedDiscussion.content}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {getUserDisplayName(reply.user_id)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {getUserDisplayName(reply.user_id)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(reply.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="💬 Add a reply..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addReply();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={addReply}
                    disabled={!newReply.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Select a Discussion</h3>
                <p className="text-gray-500">
                  Click on any discussion to join the conversation!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
