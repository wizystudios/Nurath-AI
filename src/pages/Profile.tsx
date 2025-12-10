import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Save, 
  User as UserIcon, 
  Bell, 
  Shield, 
  Camera,
  Trash2,
  ArrowLeft,
  LogOut
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [languagePreference, setLanguagePreference] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
  
  useEffect(() => {
    async function getUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/');
          return;
        }
        
        setUser(user);
        setEmail(user.email || "");
        
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
          setLanguagePreference(profileData.language_preference || "en");
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
      setSaving(true);
      
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        }
      });
      
      if (authError) throw authError;
      
      let newAvatarUrl = avatarUrl;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
          
        newAvatarUrl = publicUrlData.publicUrl;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          skill_level: skillLevel,
          language_preference: languagePreference,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
        
      if (profileError) throw profileError;
      
      toast.success("Profile updated successfully!");
      setAvatarFile(null);
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-white/60">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-10">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className="bg-white/10 text-white text-2xl">
                {getInitials(fullName || 'U')}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer hover:bg-white/90 transition-colors"
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
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white">{fullName || 'User'}</h2>
            <p className="text-white/50">{email}</p>
            {avatarUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemoveAvatar}
                className="text-red-400 hover:text-red-300 hover:bg-transparent mt-2 px-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove photo
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-1 flex items-center gap-2 transition-colors ${
              activeTab === 'general' 
                ? 'text-white border-b-2 border-white' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-1 flex items-center gap-2 transition-colors ${
              activeTab === 'notifications' 
                ? 'text-white border-b-2 border-white' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-1 flex items-center gap-2 transition-colors ${
              activeTab === 'security' 
                ? 'text-white border-b-2 border-white' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Your name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-white/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                disabled
                className="bg-transparent border-white/10 text-white/50"
              />
              <p className="text-xs text-white/40">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skill" className="text-white/70">Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger className="bg-transparent border-white/10 text-white">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="beginner" className="text-white hover:bg-white/10">Beginner</SelectItem>
                  <SelectItem value="intermediate" className="text-white hover:bg-white/10">Intermediate</SelectItem>
                  <SelectItem value="advanced" className="text-white hover:bg-white/10">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language" className="text-white/70">Language Preference</Label>
              <Select value={languagePreference} onValueChange={setLanguagePreference}>
                <SelectTrigger className="bg-transparent border-white/10 text-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="en" className="text-white hover:bg-white/10">🇬🇧 English</SelectItem>
                  <SelectItem value="sw" className="text-white hover:bg-white/10">🇹🇿 Kiswahili</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleUpdateProfile} 
              disabled={saving}
              className="bg-white text-black hover:bg-white/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-sm text-white/50">Receive updates and learning materials via email</p>
              </div>
              <Switch 
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white font-medium">Weekly Digest</p>
                <p className="text-sm text-white/50">Receive a summary of your learning progress weekly</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white font-medium">New Features</p>
                <p className="text-sm text-white/50">Get notified about new AI features and updates</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="py-4">
              <p className="text-white font-medium mb-1">Change Password</p>
              <p className="text-sm text-white/50 mb-4">Update your password to keep your account secure</p>
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <Shield className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>
            
            <div className="py-4">
              <p className="text-white font-medium mb-1">Account Activity</p>
              <p className="text-sm text-white/50">Last login: {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="py-4">
              <p className="text-white font-medium mb-1">Delete Account</p>
              <p className="text-sm text-white/50 mb-4">Permanently delete your account and all data</p>
              <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;