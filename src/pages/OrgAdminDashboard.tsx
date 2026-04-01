import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, Stethoscope, Calendar, Plus, MapPin, Phone, Mail,
  Globe, Loader2, Edit, Save, Settings,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Organization } from '@/types/telemed';
import DoctorForm from '@/components/telemed/DoctorForm';
import DoctorList from '@/components/telemed/DoctorList';
import AppointmentList from '@/components/telemed/AppointmentList';
import OrgServicesManager from '@/components/telemed/OrgServicesManager';
import DashboardShell from '@/components/DashboardShell';

const OrgAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isOrgAdmin, loading, signOut } = useTelemedAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', phone: '', email: '', website: '', address: '' });

  useEffect(() => {
    if (!loading && (!user || !isOrgAdmin())) { toast.error('Access denied.'); navigate('/auth'); }
  }, [user, loading, isOrgAdmin]);

  useEffect(() => {
    if (user && userRole?.organization_id) fetchOrganization();
  }, [user, userRole]);

  const fetchOrganization = async () => {
    const { data, error } = await supabase.from('organizations').select('*').eq('id', userRole!.organization_id!).single();
    if (data) {
      setOrganization(data as Organization);
      setEditForm({ description: data.description || '', phone: data.phone || '', email: data.email || '', website: data.website || '', address: data.address || '' });
    }
    setOrgLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!organization) return;
    const { error } = await supabase.from('organizations').update(editForm).eq('id', organization.id);
    if (error) toast.error('Failed to update');
    else { toast.success('Profile updated'); setIsEditing(false); fetchOrganization(); }
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  if (loading || orgLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <DashboardShell
      title={organization?.name || 'Organization'}
      subtitle={`${organization?.type || ''} Dashboard`}
      icon={<Building2 className="h-4 w-4 text-primary" />}
      onLogout={handleLogout}
    >

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="doctors">Doctors</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>
            </ScrollArea>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center"><Building2 className="h-7 w-7 text-emerald-500" /></div>
                    <div>
                      <h2 className="text-lg font-bold">{organization?.name}</h2>
                      <Badge className="capitalize">{organization?.type}</Badge>
                      {organization?.location && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{organization.location}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-3">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowDoctorForm(true)}>
                  <CardContent className="p-4 text-center"><Stethoscope className="h-6 w-6 mx-auto mb-2 text-cyan-500" /><p className="text-sm font-medium">Add Doctor</p></CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('appointments')}>
                  <CardContent className="p-4 text-center"><Calendar className="h-6 w-6 mx-auto mb-2 text-pink-500" /><p className="text-sm font-medium">Appointments</p></CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('profile')}>
                  <CardContent className="p-4 text-center"><Settings className="h-6 w-6 mx-auto mb-2 text-purple-500" /><p className="text-sm font-medium">Edit Profile</p></CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="doctors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Our Doctors</h2>
                <Button onClick={() => setShowDoctorForm(true)}><Plus className="h-4 w-4 mr-2" />Add</Button>
              </div>
              <DoctorList key={refreshKey} onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="services">
              <h2 className="text-lg font-semibold mb-4">Services & Pricing</h2>
              {userRole?.organization_id && <OrgServicesManager organizationId={userRole.organization_id} />}
            </TabsContent>

            <TabsContent value="appointments">
              <h2 className="text-lg font-semibold mb-4">Appointments</h2>
              <AppointmentList key={refreshKey} />
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div><CardTitle>Organization Profile</CardTitle><CardDescription>Update your organization's information</CardDescription></div>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile}><Save className="h-4 w-4 mr-2" />Save</Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Description</Label><Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} disabled={!isEditing} rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} disabled={!isEditing} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} disabled={!isEditing} /></div>
                    <div className="space-y-2"><Label>Website</Label><Input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} disabled={!isEditing} /></div>
                    <div className="space-y-2"><Label>Address</Label><Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} disabled={!isEditing} /></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

      {showDoctorForm && <DoctorForm onClose={() => setShowDoctorForm(false)} onSuccess={() => { setShowDoctorForm(false); handleRefresh(); }} />}
    </DashboardShell>
  );
};

export default OrgAdminDashboard;
