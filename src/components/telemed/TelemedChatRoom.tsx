import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, User, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { TelemedChat, TelemedMessage } from '@/types/telemed';

interface TelemedChatRoomProps {
  doctorId?: string;
  patientId?: string;
  patientName?: string;
  userRole: 'doctor' | 'patient';
}

const TelemedChatRoom: React.FC<TelemedChatRoomProps> = ({
  doctorId,
  patientId,
  patientName,
  userRole,
}) => {
  const [chats, setChats] = useState<TelemedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<TelemedChat | null>(null);
  const [messages, setMessages] = useState<TelemedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('telemed-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemed_messages',
        },
        (payload) => {
          const newMsg = payload.new as TelemedMessage;
          if (selectedChat && newMsg.chat_id === selectedChat.id) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, patientId, selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChats = async () => {
    setLoading(true);
    let query = supabase.from('telemed_chats').select('*, doctor:doctors(*)');

    if (userRole === 'doctor' && doctorId) {
      query = query.eq('doctor_id', doctorId);
    } else if (userRole === 'patient' && patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
    } else {
      setChats((data as TelemedChat[]) || []);
    }
    setLoading(false);
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from('telemed_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages((data as TelemedMessage[]) || []);
    }
  };

  const selectChat = (chat: TelemedChat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    const { error } = await supabase.from('telemed_messages').insert({
      chat_id: selectedChat.id,
      sender_id: userRole === 'doctor' ? doctorId : patientId,
      sender_name: userRole === 'doctor' ? 'Doctor' : patientName || 'Patient',
      sender_role: userRole,
      content: newMessage,
      message_type: 'text',
    });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      // Update chat timestamp
      await supabase
        .from('telemed_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedChat.id);
    }
    setSending(false);
  };

  const createNewChat = async () => {
    if (!doctorId) {
      toast.error('Please select a doctor first');
      return;
    }

    const { data, error } = await supabase
      .from('telemed_chats')
      .insert({
        doctor_id: doctorId,
        patient_id: patientId || null,
        patient_name: patientName || 'Anonymous Patient',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create chat');
    } else {
      setChats((prev) => [data as TelemedChat, ...prev]);
      setSelectedChat(data as TelemedChat);
      setMessages([]);
      toast.success('Chat started!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[500px]">
      {/* Chat List */}
      <Card className="md:col-span-1">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Conversations</CardTitle>
            {userRole === 'patient' && (
              <Button size="sm" variant="outline" onClick={createNewChat}>
                New Chat
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No conversations yet
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => selectChat(chat)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {userRole === 'doctor' ? chat.patient_name : chat.doctor?.full_name || 'Doctor'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={chat.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {chat.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="md:col-span-2">
        {selectedChat ? (
          <>
            <CardHeader className="py-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <CardTitle className="text-sm">
                    {userRole === 'doctor' ? selectedChat.patient_name : selectedChat.doctor?.full_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {userRole === 'doctor' ? 'Patient' : selectedChat.doctor?.specialty}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[400px]">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          msg.sender_role === userRole ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.sender_role !== userRole && (
                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            {msg.sender_role === 'bot' ? (
                              <Bot className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                            msg.sender_role === userRole
                              ? 'bg-sky-500 text-white rounded-br-none'
                              : 'bg-gray-100 dark:bg-gray-700 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_role === userRole ? 'text-sky-100' : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="p-3 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TelemedChatRoom;
