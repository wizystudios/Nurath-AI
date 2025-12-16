import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Loader2, Settings, MessageSquare, Bell, Globe } from 'lucide-react';

interface SettingsData {
  chatbot_greeting: string;
  chatbot_fallback: string;
  enable_guest_booking: boolean;
  enable_chat_notifications: boolean;
  system_name: string;
  support_email: string;
  support_phone: string;
}

const defaultSettings: SettingsData = {
  chatbot_greeting: "Hello! 👋 Welcome to the Telemed Health Management System. I can help you find doctors, hospitals, pharmacies, and lab tests. How can I assist you today?",
  chatbot_fallback: "I'm sorry, I couldn't find what you're looking for. Try typing '/doctor' to find doctors or '/hospital' to search hospitals. Type '/help' for all commands.",
  enable_guest_booking: true,
  enable_chat_notifications: true,
  system_name: "Telemed Health System",
  support_email: "",
  support_phone: "",
};

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('telemed_settings')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj = { ...defaultSettings };
        data.forEach((row) => {
          if (row.key in settingsObj) {
            (settingsObj as any)[row.key] = row.value;
          }
        });
        setSettings(settingsObj);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('telemed_settings')
          .upsert(update, { onConflict: 'key' });
        if (error) throw error;
      }

      toast.success('Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-sky-500" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Configure basic system settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>System Name</Label>
            <Input
              value={settings.system_name}
              onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
              placeholder="Telemed Health System"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                placeholder="support@telemed.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Support Phone</Label>
              <Input
                value={settings.support_phone}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                placeholder="+255 xxx xxx xxx"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chatbot Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <CardTitle>Chatbot Settings</CardTitle>
          </div>
          <CardDescription>Configure chatbot behavior and messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Welcome Greeting</Label>
            <Textarea
              value={settings.chatbot_greeting}
              onChange={(e) => setSettings({ ...settings, chatbot_greeting: e.target.value })}
              placeholder="The greeting message shown when a user starts a chat"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Fallback Message</Label>
            <Textarea
              value={settings.chatbot_fallback}
              onChange={(e) => setSettings({ ...settings, chatbot_fallback: e.target.value })}
              placeholder="Message shown when the chatbot can't find an answer"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500" />
            <CardTitle>Feature Toggles</CardTitle>
          </div>
          <CardDescription>Enable or disable system features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Guest Booking</Label>
              <p className="text-sm text-muted-foreground">
                Allow patients to book appointments without logging in
              </p>
            </div>
            <Switch
              checked={settings.enable_guest_booking}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_guest_booking: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Chat Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications for new chat messages
              </p>
            </div>
            <Switch
              checked={settings.enable_chat_notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_chat_notifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SystemSettings;
