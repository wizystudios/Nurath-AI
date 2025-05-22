
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Discussion, ChatMessage } from "@/types/community";
import NKTechLogo from "@/components/NKTechLogo";

const Community = () => {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");

  // Fetch discussions and messages when component mounts
  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        // Fetch discussions
        const { data: discussionsData, error: discussionsError } = await supabase
          .from('discussions')
          .select(`
            id, 
            title,
            content,
            created_at,
            likes,
            replies,
            profiles(id, full_name, role, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (discussionsError) throw discussionsError;
        
        // Fetch chat messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            content,
            created_at,
            profiles(id, full_name, role, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (messagesError) throw messagesError;
        
        // Format the discussions data
        const formattedDiscussions: Discussion[] = discussionsData?.map((disc: any) => ({
          id: disc.id,
          title: disc.title,
          content: disc.content,
          author: {
            id: disc.profiles?.id || "",
            name: disc.profiles?.full_name || "Unknown User",
            role: disc.profiles?.role || "Community Member",
            avatarUrl: disc.profiles?.avatar_url
          },
          createdAt: new Date(disc.created_at),
          likes: disc.likes || 0,
          replies: disc.replies || 0
        })) || [];
        
        // Format the messages data
        const formattedMessages: ChatMessage[] = messagesData?.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          user: {
            id: msg.profiles?.id || "",
            name: msg.profiles?.full_name || "Unknown User",
            role: msg.profiles?.role || "Community Member",
            avatarUrl: msg.profiles?.avatar_url
          },
          createdAt: new Date(msg.created_at)
        })) || [];
        
        setDiscussions(formattedDiscussions);
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching community data:", error);
        toast.error("Failed to load community data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
    
    // Set up real-time subscription for chat messages
    const messageSubscription = supabase
      .channel('community_chat')
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'chat_messages' }, 
          handleNewMessage)
      .subscribe();
      
    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, []);
  
  // Handle new chat messages from the real-time subscription
  const handleNewMessage = async (payload: any) => {
    // Fetch user profile for the new message
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('id', payload.new.user_id)
      .single();
      
    const newMessage: ChatMessage = {
      id: payload.new.id,
      content: payload.new.content,
      user: {
        id: payload.new.user_id,
        name: profileData?.full_name || "Unknown User",
        role: profileData?.role || "Community Member",
        avatarUrl: profileData?.avatar_url
      },
      createdAt: new Date(payload.new.created_at)
    };
    
    setMessages(prev => [newMessage, ...prev]);
  };
  
  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
  };
  
  // Send a new chat message
  const sendMessage = async () => {
    if (!messageInput.trim()) return;
    
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      toast.error("You must be logged in to send messages");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: messageInput,
          user_id: sessionData.session.user.id
        });
        
      if (error) throw error;
      
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  // Create a new discussion
  const createNewDiscussion = () => {
    navigate("/community/new-discussion");
  };
  
  // Get initials from name for avatar fallback
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
        <h1 className="text-3xl font-bold">Community Hub</h1>
        <p className="text-muted-foreground">Connect with other learners and mentors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Discussions */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <Button onClick={createNewDiscussion}>
              <Plus className="h-4 w-4 mr-2" /> New Discussion
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Join conversations or start a new topic</p>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex items-center mt-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="ml-3">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : discussions.length > 0 ? (
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <Card key={discussion.id} className="transition-all hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold">{discussion.title}</CardTitle>
                    <div className="flex items-center mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={discussion.author.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(discussion.author.name)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-sm font-medium">{discussion.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {discussion.author.role} · {formatRelativeTime(discussion.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{discussion.content}</p>
                    <div className="flex items-center mt-4 space-x-6">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{discussion.likes}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>{discussion.replies}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No discussions yet. Be the first to start a conversation!</p>
              <Button onClick={createNewDiscussion}>Start a Discussion</Button>
            </Card>
          )}
        </div>
        
        {/* Right Column: Chat */}
        <div>
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Live Community Chat</CardTitle>
              <p className="text-sm text-muted-foreground">Ask questions and get help in real-time</p>
            </CardHeader>
            <div className="flex-1 overflow-y-auto px-4 space-y-4">
              {loading ? (
                <div className="space-y-4 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="ml-2 space-y-1">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(message.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{message.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 bg-muted p-2 rounded-md">{message.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    No messages yet. Be the first to say hello!
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} variant="default" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="p-4 mt-8 border-t text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center mb-2">
          <NKTechLogo size="sm" />
        </div>
        <p>© 2025 Nurath.AI by NK Technology (Tanzania)</p>
      </div>
    </div>
  );
};

export default Community;
