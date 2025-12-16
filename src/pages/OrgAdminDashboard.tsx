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
import {
  Building2,
  Stethoscope,
  Calendar,
  Settings,
  LogOut,
  Plus,
  Heart,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2,
  Edit,
  Save,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Organization, Doctor } from '@/types/telemed';
import DoctorForm from '@/components/telemed/DoctorForm';
import DoctorList from '@/components/telemed/DoctorList';
import AppointmentList from '@/components/telemed/AppointmentList';

const OrgAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isOrgAdmin, loading, signOut } = useTelemedAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  });

  useEffect(() => {
    if (!loading && (!user || !isOrgAdmin())) {
      toast.error('Access denied. Organization Admin only.');
      navigate('/telemed/auth');
    }
  }, [user, loading, isOrgAdmin]);

  useEffect(() => {
    if (user && userRole?.organization_id) {
      fetchOrganization();
    }
  }, [user, userRole]);

  const fetchOrganization = async () => {
    if (!userRole?.organization_id) return;
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userRole.organization_id)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to load organization');
    } else {
      setOrganization(data as Organization);
      setEditForm({
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        address: data.address || '',
      });
    }
    setOrgLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!organization) return;

    const { error } = await supabase
      .from('organizations')
      .update({
        description: editForm.description,
        phone: editForm.phone,
        email: editForm.email,
        website: editForm.website,
        address: editForm.address,
      })
      .eq('id', organization.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
      setIsEditing(false);
      fetchOrganization();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/telemed/auth');
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">{organization?.name || 'Organization'}</h1>
              <p className="text-xs text-muted-foreground">Organization Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{organization?.type}</Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Org Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{organization?.name}</h2>
                    <Badge className="mt-1 capitalize">{organization?.type}</Badge>
                    <p className="text-muted-foreground mt-2">{organization?.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      {organization?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {organization.location}
                        </span>
                      )}
                      {organization?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {organization.phone}
                        </span>
                      )}
                      {organization?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {organization.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowDoctorForm(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Stethoscope className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold">Add Doctor</h3>
                  <p className="text-sm text-muted-foreground">Register a new doctor</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('appointments')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="font-semibold">View Appointments</h3>
                  <p className="text-sm text-muted-foreground">Manage bookings</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('profile')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">Update organization info</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="doctors">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Our Doctors</h2>
              <Button onClick={() => setShowDoctorForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Doctor
              </Button>
            </div>
            <DoctorList key={refreshKey} onRefresh={handleRefresh} />
          </TabsContent>

          <TabsContent value="appointments">
            <h2 className="text-xl font-semibold mb-4">Appointments</h2>
            <AppointmentList key={refreshKey} />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Organization Profile</CardTitle>
                    <CardDescription>Update your organization's information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {showDoctorForm && (
        <DoctorForm
          onClose={() => setShowDoctorForm(false)}
          onSuccess={() => {
            setShowDoctorForm(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default OrgAdminDashboard;
