
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Plus, Send, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import KNTechLogo from "@/components/KNTechLogo";

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: Date;
  likes: number;
  replies: number;
  isLiked?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  user: User;
  createdAt: Date;
}

const Community = () => {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    fetchCommunityData();
    
    // Set up real-time subscription for chat messages
    const messageSubscription = supabase
      .channel('community_chat')
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
          handleNewMessage)
      .subscribe();
      
    // Set up real-time subscription for discussions
    const discussionSubscription = supabase
      .channel('community_discussions')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'discussions' }, 
          () => fetchDiscussions())
      .subscribe();
      
    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(discussionSubscription);
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchCommunityData = async () => {
    setLoading(true);
    await Promise.all([fetchDiscussions(), fetchMessages()]);
    setLoading(false);
  };

  const fetchDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          profiles!discussions_user_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedDiscussions: Discussion[] = data?.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        author: {
          id: item.user_id,
          name: item.profiles?.full_name || "Anonymous User",
          avatarUrl: item.profiles?.avatar_url
        },
        createdAt: new Date(item.created_at),
        likes: item.likes || 0,
        replies: item.replies || 0
      })) || [];

      setDiscussions(formattedDiscussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      toast.error("Failed to load discussions");
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!chat_messages_user_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedMessages: ChatMessage[] = data?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        user: {
          id: msg.user_id,
          name: msg.profiles?.full_name || "Anonymous User",
          avatarUrl: msg.profiles?.avatar_url
        },
        createdAt: new Date(msg.created_at)
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load chat messages");
    }
  };

  const handleNewMessage = async (payload: any) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', payload.new.user_id)
      .single();

    const newMessage: ChatMessage = {
      id: payload.new.id,
      content: payload.new.content,
      user: {
        id: payload.new.user_id,
        name: profileData?.full_name || "Anonymous User",
        avatarUrl: profileData?.avatar_url
      },
      createdAt: new Date(payload.new.created_at)
    };

    setMessages(prev => [newMessage, ...prev]);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    if (!user) {
      toast.error("You must be logged in to send messages");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: messageInput.trim(),
          user_id: user.id,
          role: 'user'
        });

      if (error) throw error;
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleLikeDiscussion = async (discussionId: string) => {
    if (!user) {
      toast.error("You must be logged in to like discussions");
      navigate("/auth");
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

        await supabase.rpc('decrement_discussion_likes', { discussion_id: discussionId });
        toast.success("Removed like");
      } else {
        // Like
        await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });

        await supabase.rpc('increment_discussion_likes', { discussion_id: discussionId });
        toast.success("❤️ Liked!");
      }

      fetchDiscussions(); // Refresh discussions
    } catch (error) {
      console.error("Error handling like:", error);
      toast.error("Failed to update like");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">🌟 Community Hub</h1>
        <p className="text-muted-foreground">Connect, learn, and grow together with fellow developers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Discussions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">💬 Recent Discussions</h2>
            <Button onClick={() => navigate("/community/new-discussion")}>
              <Plus className="h-4 w-4 mr-2" /> New Discussion
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : discussions.length > 0 ? (
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <Card key={discussion.id} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold line-clamp-2">{discussion.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={discussion.author.avatarUrl} />
                        <AvatarFallback>{getInitials(discussion.author.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{discussion.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(discussion.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {discussion.content}
                    </p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeDiscussion(discussion.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {discussion.likes}
                      </Button>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {discussion.replies}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No discussions yet. Be the first to start a conversation! 🚀
              </p>
              <Button onClick={() => navigate("/community/new-discussion")}>
                Start a Discussion
              </Button>
            </Card>
          )}
        </div>

        {/* Right Column: Live Chat */}
        <div>
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                💬 Live Chat
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Real-time community chat</p>
            </CardHeader>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
              {loading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="ml-2 space-y-1">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {message.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm bg-muted p-2 rounded-lg mt-1 break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    💬 No messages yet. Say hello!
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={user ? "Type your message..." : "Login to chat..."}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={!user}
                  maxLength={500}
                />
                <Button 
                  onClick={sendMessage} 
                  size="icon"
                  disabled={!user || !messageInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!user && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  <Button variant="link" size="sm" onClick={() => navigate("/auth")}>
                    Login
                  </Button> to join the conversation
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="pt-8 border-t text-center">
        <div className="flex items-center justify-center mb-2">
          <KNTechLogo size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">
          © 2025 Nurath.AI by KN Technology (Tanzania)
        </p>
      </div>
    </div>
  );
};

export default Community;
