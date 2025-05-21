
import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Send, Clock, User, Heart, MessageCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Community = () => {
  const { theme } = useTheme();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community Hub</h1>
            <p className="text-muted-foreground mt-2">
              Connect with other learners and mentors
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="discussions" className="w-full mb-8">
          <TabsList className="w-full max-w-md mb-4">
            <TabsTrigger value="discussions" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex-1">
              <Users className="mr-2 h-4 w-4" />
              Mentors
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              <Clock className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>
          
          {/* Discussions Tab */}
          <TabsContent value="discussions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Discussions</CardTitle>
                <CardDescription>
                  Join conversations or start a new topic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DiscussionPost 
                  author="Maria Johnson"
                  authorRole="React Developer"
                  avatar="/placeholder.svg"
                  time="2 hours ago"
                  title="Best practice for React state management?"
                  content="I'm building a medium-sized React application and I'm wondering what's the current best approach for state management. Should I use Redux, Context API, or something else?"
                  likes={12}
                  comments={5}
                />
                
                <DiscussionPost 
                  author="Ahmed Hassan"
                  authorRole="Full Stack Developer"
                  avatar="/placeholder.svg"
                  time="5 hours ago"
                  title="Resources for learning TypeScript"
                  content="Can anyone recommend good resources for learning TypeScript? I'm comfortable with JavaScript but want to add type safety to my projects."
                  likes={8}
                  comments={7}
                />
                
                <DiscussionPost 
                  author="Grace Mwangi"
                  authorRole="UI/UX Designer"
                  avatar="/placeholder.svg"
                  time="1 day ago"
                  title="Favorite CSS framework in 2025?"
                  content="What CSS frameworks are you all using in 2025? Still using Tailwind or moved to something else?"
                  likes={15}
                  comments={20}
                />
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start a New Discussion
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Mentors Tab */}
          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <CardTitle>Available Mentors</CardTitle>
                <CardDescription>
                  Connect with experienced developers who can guide your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  <MentorCard 
                    name="David Ngugi"
                    expertise="Web Development"
                    languages={["JavaScript", "React", "Node.js"]}
                    avatar="/placeholder.svg"
                  />
                  
                  <MentorCard 
                    name="Sarah Kimani"
                    expertise="UI/UX Design"
                    languages={["Figma", "Adobe XD", "CSS"]}
                    avatar="/placeholder.svg"
                  />
                  
                  <MentorCard 
                    name="Michael Omondi"
                    expertise="Mobile Development"
                    languages={["React Native", "Flutter", "Swift"]}
                    avatar="/placeholder.svg"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Join virtual meetups, webinars, and coding sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <EventCard 
                  title="Web Development Workshop"
                  date="May 25, 2025"
                  time="2:00 PM EAT"
                  description="Learn to build responsive websites with HTML, CSS, and JavaScript in this hands-on workshop."
                />
                
                <EventCard 
                  title="AI in Coding: Live Q&A"
                  date="May 28, 2025"
                  time="6:00 PM EAT"
                  description="Join our experts to discuss how AI is changing the coding landscape and how you can leverage it in your projects."
                />
                
                <EventCard 
                  title="Hackathon: Build for Tanzania"
                  date="June 10-12, 2025"
                  time="All day"
                  description="A three-day virtual hackathon focused on building solutions for local challenges in Tanzania."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Community Chat */}
        <Card>
          <CardHeader>
            <CardTitle>Live Community Chat</CardTitle>
            <CardDescription>
              Ask questions and get help in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto border rounded-md p-4 mb-4">
              <ChatMessage 
                author="System"
                content="Welcome to the Nurath.AI community chat!"
                time="Just now"
                isSystem
              />
              <ChatMessage 
                author="Sam Jones"
                avatar="/placeholder.svg"
                content="Hey everyone! Has anyone worked with the Web Audio API before? Need some help."
                time="5 min ago"
              />
              <ChatMessage 
                author="Jane Smith"
                avatar="/placeholder.svg"
                content="@Sam I've used it for a music visualization project. What do you need help with?"
                time="3 min ago"
              />
              <ChatMessage 
                author="Sam Jones"
                avatar="/placeholder.svg"
                content="Thanks Jane! I'm trying to analyze frequency data but getting weird results."
                time="2 min ago"
              />
            </div>
            <div className="flex gap-2">
              <Input placeholder="Type your message..." className="flex-1" />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

interface DiscussionPostProps {
  author: string;
  authorRole: string;
  avatar: string;
  time: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
}

const DiscussionPost = ({ 
  author,
  authorRole,
  avatar,
  time,
  title,
  content,
  likes,
  comments
}: DiscussionPostProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={author} />
            <AvatarFallback>{author[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{author}</div>
            <div className="text-xs text-muted-foreground">{authorRole}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{time}</div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
      
      <div className="flex gap-4 pt-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Heart className="mr-1 h-4 w-4" />
          {likes}
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <MessageCircle className="mr-1 h-4 w-4" />
          {comments}
        </Button>
      </div>
      
      <div className="border-t pt-4"></div>
    </div>
  );
};

interface MentorCardProps {
  name: string;
  expertise: string;
  languages: string[];
  avatar: string;
}

const MentorCard = ({
  name,
  expertise,
  languages,
  avatar
}: MentorCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center mb-4">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{expertise}</p>
        </div>
        
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {languages.map((lang, index) => (
            <span 
              key={index} 
              className="bg-secondary text-secondary-foreground text-xs py-1 px-2 rounded-full"
            >
              {lang}
            </span>
          ))}
        </div>
        
        <Button variant="outline" size="sm" className="w-full">
          <MessageCircle className="mr-2 h-4 w-4" />
          Contact
        </Button>
      </CardContent>
    </Card>
  );
};

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  description: string;
}

const EventCard = ({
  title,
  date,
  time,
  description
}: EventCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
            {date}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <div className="text-sm flex items-center">
            <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{time}</span>
          </div>
          <Button size="sm">Register</Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface ChatMessageProps {
  author: string;
  content: string;
  time: string;
  avatar?: string;
  isSystem?: boolean;
}

const ChatMessage = ({
  author,
  content,
  time,
  avatar,
  isSystem = false
}: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 mb-4 ${isSystem ? 'items-center' : 'items-start'}`}>
      {isSystem ? (
        <div className="bg-primary/20 text-primary p-1 rounded-full">
          <MessageCircle className="h-4 w-4" />
        </div>
      ) : (
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatar} alt={author} />
          <AvatarFallback>{author[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{author}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className={`text-sm ${isSystem ? 'text-muted-foreground italic' : ''}`}>
          {content}
        </p>
      </div>
    </div>
  );
};

export default Community;
