import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  Stethoscope,
  Pill,
  FlaskConical,
  Calendar,
  Settings,
  LogOut,
  Plus,
  Heart,
  TrendingUp,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { DashboardStats, Organization, Doctor } from '@/types/telemed';
import OrganizationForm from '@/components/telemed/OrganizationForm';
import DoctorForm from '@/components/telemed/DoctorForm';
import OrganizationList from '@/components/telemed/OrganizationList';
import DoctorList from '@/components/telemed/DoctorList';
import AppointmentList from '@/components/telemed/AppointmentList';
import FAQManager from '@/components/telemed/FAQManager';
import SystemSettings from '@/components/telemed/SystemSettings';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading, signOut } = useTelemedAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalHospitals: 0,
    totalPharmacies: 0,
    totalLabs: 0,
    totalPolyclinics: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
  });
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin())) {
      toast.error('Access denied. Super Admin only.');
      navigate('/telemed/auth');
    }
  }, [user, loading, isSuperAdmin]);

  useEffect(() => {
    if (user && isSuperAdmin()) {
      fetchStats();
    }
  }, [user, refreshKey]);

  const fetchStats = async () => {
    try {
      const [hospitals, pharmacies, labs, polyclinics, doctors, appointments] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'hospital'),
        supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'pharmacy'),
        supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'lab'),
        supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'polyclinic'),
        supabase.from('doctors').select('id', { count: 'exact' }),
        supabase.from('appointments').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalHospitals: hospitals.count || 0,
        totalPharmacies: pharmacies.count || 0,
        totalLabs: labs.count || 0,
        totalPolyclinics: polyclinics.count || 0,
        totalDoctors: doctors.count || 0,
        totalPatients: 0, // Would need patient tracking
        totalAppointments: appointments.count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/telemed/auth');
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    { label: 'Hospitals', value: stats.totalHospitals, icon: Building2, color: 'bg-blue-500' },
    { label: 'Pharmacies', value: stats.totalPharmacies, icon: Pill, color: 'bg-green-500' },
    { label: 'Labs', value: stats.totalLabs, icon: FlaskConical, color: 'bg-purple-500' },
    { label: 'Polyclinics', value: stats.totalPolyclinics, icon: Activity, color: 'bg-orange-500' },
    { label: 'Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'bg-cyan-500' },
    { label: 'Appointments', value: stats.totalAppointments, icon: Calendar, color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Telemed Admin</h1>
              <p className="text-xs text-muted-foreground">Super Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden md:flex">
              {user?.email}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chatbot">FAQs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat) => (
                <Card key={stat.label} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                      <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowOrgForm(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Register Organization</h3>
                  <p className="text-sm text-muted-foreground">Hospital, Pharmacy, Lab, or Polyclinic</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowDoctorForm(true)}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Stethoscope className="h-6 w-6 text-cyan-600" />
                  </div>
                  <h3 className="font-semibold">Register Doctor</h3>
                  <p className="text-sm text-muted-foreground">Add private or hospital doctor</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('appointments')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="font-semibold">View Appointments</h3>
                  <p className="text-sm text-muted-foreground">Manage all bookings</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/telemed')}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Test Chatbot</h3>
                  <p className="text-sm text-muted-foreground">View patient interface</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organizations">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Organizations</h2>
              <Button onClick={() => setShowOrgForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>
            <OrganizationList key={refreshKey} onRefresh={handleRefresh} />
          </TabsContent>

          <TabsContent value="doctors">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Doctors</h2>
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

          <TabsContent value="chatbot">
            <h2 className="text-xl font-semibold mb-4">Chatbot FAQs</h2>
            <FAQManager />
          </TabsContent>

          <TabsContent value="settings">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </main>

      {/* Organization Form Modal */}
      {showOrgForm && (
        <OrganizationForm
          onClose={() => setShowOrgForm(false)}
          onSuccess={() => {
            setShowOrgForm(false);
            handleRefresh();
          }}
        />
      )}

      {/* Doctor Form Modal */}
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

export default SuperAdminDashboard;
