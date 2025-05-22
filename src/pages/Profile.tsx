
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import LanguageSelector from "@/components/LanguageSelector"; // Fixed import
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Save, 
  User as UserIcon, 
  Bell, 
  Shield, 
  Upload,
  Camera,
  Trash2
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  useEffect(() => {
    async function getUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }
        
        setUser(user);
        setEmail(user.email || "");
        
        // Fetch profile data from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setFullName(profileData.full_name || user.user_metadata?.full_name || "");
          setSkillLevel(profileData.skill_level || "beginner");
          setAvatarUrl(profileData.avatar_url || null);
        } else {
          setFullName(user.user_metadata?.full_name || "");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getUserProfile();
  }, [navigate]);
  
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        }
      });
      
      if (authError) throw authError;
      
      // Handle avatar upload if there's a new file
      let newAvatarUrl = avatarUrl;
      
      if (avatarFile) {
        // Upload the file to storage
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile);
          
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        newAvatarUrl = publicUrlData.publicUrl;
      }
      
      // Update profile data in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          skill_level: skillLevel,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
        
      if (profileError) throw profileError;
      
      toast.success("Profile updated successfully!");
      
      // Clear avatar file after upload
      setAvatarFile(null);
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image is too large (max 2MB)");
        return;
      }
      
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container flex items-center justify-center min-h-screen">
          <span>Loading profile...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account and preferences
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full max-w-md mb-4">
            <TabsTrigger value="general" className="flex-1">
              <UserIcon className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-muted">
                        <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                        <AvatarFallback className="text-2xl">{getInitials(fullName)}</AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleAvatarChange}
                      />
                    </div>
                    {avatarUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveAvatar}
                        className="text-xs text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skill">Skill Level</Label>
                  <Select 
                    value={skillLevel}
                    onValueChange={setSkillLevel}
                  >
                    <SelectTrigger id="skill">
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Language Preference</Label>
                  <div className="pt-2">
                    <LanguageSelector 
                      currentLanguage="en"
                      onLanguageChange={() => {}}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateProfile} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="block mb-1">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates and learning materials via email
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weekly-digest" className="block mb-1">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a summary of your learning progress weekly
                    </p>
                  </div>
                  <Switch id="weekly-digest" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
                <div className="pt-4">
                  <h3 className="font-medium mb-2">Account Activity</h3>
                  <div className="rounded-md border p-4">
                    <p className="text-sm">Last login: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
