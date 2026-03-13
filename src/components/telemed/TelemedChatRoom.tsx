import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Send, User, Bot, MessageSquare, Loader2, Video, ArrowLeft, Plus,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { TelemedChat, TelemedMessage } from '@/types/telemed';
import VideoCall from './VideoCall';

interface TelemedChatRoomProps {
  doctorId?: string;
  patientId?: string;
  patientName?: string;
  userRole: 'doctor' | 'patient';
  initialChatId?: string;
}

const TelemedChatRoom: React.FC<TelemedChatRoomProps> = ({
  doctorId, patientId, patientName, userRole, initialChatId,
}) => {
  const [chats, setChats] = useState<TelemedChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<TelemedChat | null>(null);
  const [messages, setMessages] = useState<TelemedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null;
  }, [selectedChat]);

  const fetchChats = async () => {
    setLoading(true);
    let query = supabase.from('telemed_chats').select('*, doctor:doctors(*)');
    if (userRole === 'doctor' && doctorId) query = query.eq('doctor_id', doctorId);
    else if (userRole === 'patient' && patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query.order('updated_at', { ascending: false });

    if (!error) {
      const chatList = (data as TelemedChat[]) || [];
      setChats(chatList);
      if (chatList.length > 0) {
        const preferredChat = initialChatId
          ? chatList.find((c) => c.id === initialChatId) : chatList[0];
        if (preferredChat) { setSelectedChat(preferredChat); fetchMessages(preferredChat.id); }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
    const channel = supabase
      .channel('telemed-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'telemed_messages' },
        (payload) => {
          const newMsg = payload.new as TelemedMessage;
          if (selectedChatIdRef.current && newMsg.chat_id === selectedChatIdRef.current) {
            setMessages((prev) => [...prev, newMsg]);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [doctorId, patientId, initialChatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => { scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight; }, 100);
    }
  }, [messages]);

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('telemed_messages').select('*').eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages((data as TelemedMessage[]) || []);
  };

  const selectChat = (chat: TelemedChat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
    setShowChatList(false);
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
    if (error) toast.error('Failed to send message');
    else {
      setNewMessage('');
      await supabase.from('telemed_chats').update({ updated_at: new Date().toISOString() }).eq('id', selectedChat.id);
    }
    setSending(false);
  };

  const createNewChat = async () => {
    if (!doctorId) { toast.error('Please select a doctor first'); return; }
    const { data, error } = await supabase.from('telemed_chats').insert({
      doctor_id: doctorId, patient_id: patientId || null,
      patient_name: patientName || 'Anonymous Patient', status: 'active',
    }).select().single();
    if (error) toast.error('Failed to create chat');
    else {
      setChats((prev) => [data as TelemedChat, ...prev]);
      setSelectedChat(data as TelemedChat);
      setMessages([]);
      setShowChatList(false);
      toast.success('Chat started!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chatPartnerName = selectedChat
    ? (userRole === 'doctor' ? selectedChat.patient_name : selectedChat.doctor?.full_name || 'Doctor')
    : '';

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px] bg-background rounded-xl border border-border/50 overflow-hidden">
      {/* Chat Header — single row like AI chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <Sheet open={showChatList} onOpenChange={setShowChatList}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MessageSquare className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base">Conversations</SheetTitle>
                {userRole === 'patient' && (
                  <Button size="sm" variant="outline" onClick={createNewChat}>
                    <Plus className="h-4 w-4 mr-1" /> New
                  </Button>
                )}
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)]">
              {chats.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No conversations yet</p>
              ) : chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`px-4 py-3 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => selectChat(chat)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {userRole === 'doctor' ? chat.patient_name : chat.doctor?.full_name || 'Doctor'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={chat.status === 'active' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {chat.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {selectedChat ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{chatPartnerName}</p>
              <p className="text-xs text-muted-foreground">
                {userRole === 'doctor' ? 'Patient' : selectedChat.doctor?.specialty || ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex-1">Select a conversation</p>
        )}

        {selectedChat && (
          <VideoCall
            chatId={selectedChat.id}
            userId={userRole === 'doctor' ? (doctorId || '') : (patientId || '')}
            userName={userRole === 'doctor' ? 'Doctor' : (patientName || 'Patient')}
            userRole={userRole}
            onEnd={() => {}}
          />
        )}
      </div>

      {/* Messages — single column, matching AI chat */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {!selectedChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {chats.length === 0 ? 'No conversations yet' : 'Tap the chat icon to select a conversation'}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {messages.map((msg) => {
              const isMe = msg.sender_role === userRole;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                      {msg.sender_role === 'bot' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input — matching AI chat input style */}
      {selectedChat && (
        <div className="px-4 py-3 border-t border-border/50">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-end gap-2 max-w-3xl mx-auto">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 rounded-2xl bg-muted/30 border-muted"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" className="rounded-full shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TelemedChatRoom;
