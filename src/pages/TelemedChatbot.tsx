import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Heart,
  Send,
  User,
  Building2,
  Stethoscope,
  Pill,
  FlaskConical,
  Calendar,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  Bot,
  Mic,
  LogIn,
} from 'lucide-react';
import { Doctor, Organization } from '@/types/telemed';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  type: 'text' | 'doctors' | 'hospitals' | 'booking';
  data?: any;
}

const QUICK_ACTIONS = [
  { label: 'Find a Doctor', icon: Stethoscope, command: '/doctor' },
  { label: 'Hospitals', icon: Building2, command: '/hospital' },
  { label: 'Pharmacies', icon: Pill, command: '/pharmacy' },
  { label: 'Lab Tests', icon: FlaskConical, command: '/lab' },
];

const TelemedChatbot = () => {
  const navigate = useNavigate();
  const { user } = useTelemedAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'bot',
      content: "Hello! 👋 Welcome to the Telemed Health Management System. I can help you find doctors, hospitals, pharmacies, and lab tests. How can I assist you today?",
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const searchDoctors = async (query: string) => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, organization:organizations(*)')
      .eq('is_approved', true)
      .or(`full_name.ilike.%${query}%,specialty.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(5);

    return data || [];
  };

  const searchOrganizations = async (type: 'hospital' | 'pharmacy' | 'lab' | 'polyclinic', query?: string) => {
    let queryBuilder = supabase
      .from('organizations')
      .select('*')
      .eq('is_approved', true)
      .eq('is_suspended', false)
      .eq('type', type);

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,location.ilike.%${query}%`);
    }

    const { data } = await queryBuilder.limit(5);
    return data || [];
  };

  const processMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase();

    // Handle commands
    if (lowerMessage.startsWith('/doctor') || lowerMessage.includes('doctor') || lowerMessage.includes('specialist')) {
      const query = message.replace('/doctor', '').trim() || 'all';
      const doctors = await searchDoctors(query === 'all' ? '' : query);
      
      if (doctors.length === 0) {
        return { content: "I couldn't find any doctors matching your criteria. Try a different specialty or location.", type: 'text' };
      }
      
      return {
        content: `I found ${doctors.length} doctor(s) for you:`,
        type: 'doctors',
        data: doctors,
      };
    }

    if (lowerMessage.startsWith('/hospital') || lowerMessage.includes('hospital')) {
      const query = message.replace('/hospital', '').trim();
      const hospitals = await searchOrganizations('hospital', query);
      
      if (hospitals.length === 0) {
        return { content: "No hospitals found. Please try a different search.", type: 'text' };
      }
      
      return {
        content: `Here are the hospitals I found:`,
        type: 'hospitals',
        data: hospitals,
      };
    }

    if (lowerMessage.startsWith('/pharmacy') || lowerMessage.includes('pharmacy') || lowerMessage.includes('medicine')) {
      const pharmacies = await searchOrganizations('pharmacy');
      
      if (pharmacies.length === 0) {
        return { content: "No pharmacies registered yet.", type: 'text' };
      }
      
      return {
        content: `Available pharmacies:`,
        type: 'hospitals',
        data: pharmacies,
      };
    }

    if (lowerMessage.startsWith('/lab') || lowerMessage.includes('lab') || lowerMessage.includes('test')) {
      const labs = await searchOrganizations('lab');
      
      if (labs.length === 0) {
        return { content: "No labs registered yet.", type: 'text' };
      }
      
      return {
        content: `Available labs:`,
        type: 'hospitals',
        data: labs,
      };
    }

    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return {
        content: "To book an appointment, please first search for a doctor using '/doctor [specialty]' and then click the 'Book' button next to your preferred doctor.",
        type: 'text',
      };
    }

    if (lowerMessage.includes('help') || lowerMessage === '/help') {
      return {
        content: `Here's how I can help you:

**Commands:**
• /doctor [specialty] - Find doctors by specialty
• /hospital [location] - Find hospitals
• /pharmacy - Find pharmacies
• /lab - Find lab testing facilities
• /help - Show this help message

**Examples:**
• "Find a dentist near me"
• "Which pharmacy has Amoxicillin?"
• "Book appointment with Dr. Fatma"`,
        type: 'text',
      };
    }

    // Default response
    return {
      content: "I can help you find doctors, hospitals, pharmacies, and lab tests. Try typing '/doctor' to find a doctor or '/hospital' to find hospitals. Type '/help' for all commands.",
      type: 'text',
    };
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await processMessage(input);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response.content,
        type: response.type as any,
        data: response.data,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      toast.error('Failed to process your request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookDoctor = (doctor: Doctor) => {
    navigate(`/telemed/book/${doctor.id}`);
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'doctors' && message.data) {
      return (
        <div className="space-y-3">
          <p className="text-sm">{message.content}</p>
          {message.data.map((doctor: Doctor) => (
            <Card key={doctor.id} className="bg-white/50 dark:bg-slate-700/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{doctor.full_name}</h4>
                    <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                    {doctor.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {doctor.location}
                      </div>
                    )}
                    {doctor.consultation_fee && (
                      <p className="text-xs font-medium text-sky-600 mt-1">
                        TZS {doctor.consultation_fee.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={doctor.is_online ? 'default' : 'secondary'} className="text-xs">
                      {doctor.is_online ? 'Online' : 'Offline'}
                    </Badge>
                    <Button size="sm" className="text-xs h-7" onClick={() => handleBookDoctor(doctor)}>
                      <Calendar className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (message.type === 'hospitals' && message.data) {
      return (
        <div className="space-y-3">
          <p className="text-sm">{message.content}</p>
          {message.data.map((org: Organization) => (
            <Card key={org.id} className="bg-white/50 dark:bg-slate-700/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{org.name}</h4>
                    <Badge variant="outline" className="text-xs mt-1">{org.type}</Badge>
                    {org.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {org.location}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {org.phone && (
                      <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                        <a href={`tel:${org.phone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Telemed Health</h1>
                <p className="text-xs text-muted-foreground">Healthcare Chatbot</p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/telemed/auth')}>
            <LogIn className="h-4 w-4 mr-2" />
            Staff Login
          </Button>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.command}
              variant="outline"
              size="sm"
              className="whitespace-nowrap bg-white/50 dark:bg-slate-800/50"
              onClick={() => {
                setInput(action.command);
                handleSend();
              }}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 container mx-auto px-4 pb-4">
        <Card className="h-[calc(100vh-220px)] flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.role === 'user'
                        ? 'bg-sky-500 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-slate-700 rounded-bl-none'
                    }`}
                  >
                    {renderMessage(message)}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl rounded-bl-none p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message or command..."
                className="flex-1 bg-white dark:bg-slate-700"
                disabled={isLoading}
              />
              <Button type="button" variant="outline" size="icon">
                <Mic className="h-4 w-4" />
              </Button>
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TelemedChatbot;
