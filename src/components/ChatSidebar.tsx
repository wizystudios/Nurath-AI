import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Plus, 
  AlignLeft, 
  X, 
  Clock, 
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import Logo from "./Logo";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchConversations() {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session?.user) {
          const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (error) throw error;
          setConversations(data || []);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);
  
  const handleNewChat = () => {
    navigate('/');
    onClose();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, "MMM d");
    }
    
    // Otherwise show date with year
    return format(date, "MMM d, yyyy");
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 left-0 w-72 bg-background/95 backdrop-blur-sm z-50 border-r shadow-lg flex flex-col transition-transform">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-3">
        <Button onClick={handleNewChat} className="w-full flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant="ghost"
              className="w-full justify-start mb-1 text-left h-auto py-3 px-3"
              onClick={() => {
                navigate(`/?conversation=${conversation.id}`);
                onClose();
              }}
            >
              <div className="flex items-start gap-3 w-full overflow-hidden">
                <MessageCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{conversation.title}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(conversation.created_at)}
                  </span>
                </div>
              </div>
            </Button>
          ))
        ) : (
          <div className="text-center p-4 text-muted-foreground text-sm">
            No conversation history yet
          </div>
        )}
      </div>
      
      <div className="p-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-center">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(), "MMMM yyyy")}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
