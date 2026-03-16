import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2, Users, Stethoscope, Pill, FlaskConical, Calendar,
  Settings, LogOut, Plus, Heart, TrendingUp, MessageSquare,
  CreditCard, FileText, ArrowLeft, Star, ShoppingCart, TestTube,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { DashboardStats } from '@/types/telemed';
import OrganizationForm from '@/components/telemed/OrganizationForm';
import DoctorForm from '@/components/telemed/DoctorForm';
import OrganizationList from '@/components/telemed/OrganizationList';
import DoctorList from '@/components/telemed/DoctorList';
import AppointmentList from '@/components/telemed/AppointmentList';
import FAQManager from '@/components/telemed/FAQManager';
import SystemSettings from '@/components/telemed/SystemSettings';
import UserManagement from '@/components/telemed/UserManagement';
import { ThemeToggle } from '@/components/theme-toggle';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin, loading, signOut } = useTelemedAuth();

  const [stats, setStats] = useState<DashboardStats & { totalPayments: number; totalOrders: number; totalLabBookings: number; totalReviews: number }>({
    totalHospitals: 0, totalPharmacies: 0, totalLabs: 0, totalPolyclinics: 0,
    totalClinics: 0, totalHealthCenters: 0, totalDoctors: 0, totalPatients: 0,
    totalAppointments: 0, totalPayments: 0, totalOrders: 0, totalLabBookings: 0, totalReviews: 0,
  });
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Additional data
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentLabBookings, setRecentLabBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin())) { toast.error('Access denied.'); navigate('/auth'); }
  }, [user, loading, isSuperAdmin]);

  useEffect(() => {
    if (user && isSuperAdmin()) { fetchStats(); fetchRecentData(); }
  }, [user, refreshKey]);

  const fetchStats = async () => {
    const [hospitals, pharmacies, labs, polyclinics, clinics, healthCenters, doctors, appointments, users, payments, orders, labBookings, reviews] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'hospital'),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'pharmacy'),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'lab'),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'polyclinic'),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'clinic'),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('type', 'health_center'),
      supabase.from('doctors').select('id', { count: 'exact' }),
      supabase.from('appointments').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('payments').select('id', { count: 'exact' }),
      supabase.from('pharmacy_orders').select('id', { count: 'exact' }),
      supabase.from('lab_bookings').select('id', { count: 'exact' }),
      supabase.from('reviews').select('id', { count: 'exact' }),
    ]);
    setStats({
      totalHospitals: hospitals.count || 0, totalPharmacies: pharmacies.count || 0,
      totalLabs: labs.count || 0, totalPolyclinics: polyclinics.count || 0,
      totalClinics: clinics.count || 0, totalHealthCenters: healthCenters.count || 0,
      totalDoctors: doctors.count || 0, totalPatients: users.count || 0,
      totalAppointments: appointments.count || 0, totalPayments: payments.count || 0,
      totalOrders: orders.count || 0, totalLabBookings: labBookings.count || 0,
      totalReviews: reviews.count || 0,
    });
  };

  const fetchRecentData = async () => {
    const [p, o, l] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('pharmacy_orders').select('*, organization:organizations(name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('lab_bookings').select('*, lab_test:lab_tests(name), organization:organizations(name)').order('created_at', { ascending: false }).limit(10),
    ]);
    setRecentPayments(p.data || []);
    setRecentOrders(o.data || []);
    setRecentLabBookings(l.data || []);
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const statCards = [
    { label: 'Users', value: stats.totalPatients, icon: Users, color: 'text-indigo-500' },
    { label: 'Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'text-cyan-500' },
    { label: 'Hospitals', value: stats.totalHospitals, icon: Building2, color: 'text-blue-500' },
    { label: 'Pharmacies', value: stats.totalPharmacies, icon: Pill, color: 'text-green-500' },
    { label: 'Labs', value: stats.totalLabs, icon: FlaskConical, color: 'text-purple-500' },
    { label: 'Appointments', value: stats.totalAppointments, icon: Calendar, color: 'text-pink-500' },
    { label: 'Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-orange-500' },
    { label: 'Lab Tests', value: stats.totalLabBookings, icon: TestTube, color: 'text-violet-500' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="organizations">Organizations</TabsTrigger>
                <TabsTrigger value="doctors">Doctors</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="lab-bookings">Lab Bookings</TabsTrigger>
                <TabsTrigger value="chatbot">FAQs</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </ScrollArea>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {statCards.map(s => (
                  <Card key={s.label}>
                    <CardContent className="p-3 text-center">
                      <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowOrgForm(true)}>
                  <CardContent className="p-4 text-center"><Building2 className="h-6 w-6 mx-auto mb-2 text-blue-500" /><p className="font-medium text-sm">Add Organization</p></CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowDoctorForm(true)}>
                  <CardContent className="p-4 text-center"><Stethoscope className="h-6 w-6 mx-auto mb-2 text-cyan-500" /><p className="font-medium text-sm">Add Doctor</p></CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('appointments')}>
                  <CardContent className="p-4 text-center"><Calendar className="h-6 w-6 mx-auto mb-2 text-pink-500" /><p className="font-medium text-sm">Appointments</p></CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/')}>
                  <CardContent className="p-4 text-center"><MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-500" /><p className="font-medium text-sm">Test Chatbot</p></CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users"><UserManagement /></TabsContent>

            <TabsContent value="organizations">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Organizations</h2>
                <Button onClick={() => setShowOrgForm(true)}><Plus className="h-4 w-4 mr-2" />Add</Button>
              </div>
              <OrganizationList key={refreshKey} onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="doctors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Doctors</h2>
                <Button onClick={() => setShowDoctorForm(true)}><Plus className="h-4 w-4 mr-2" />Add</Button>
              </div>
              <DoctorList key={refreshKey} onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="appointments">
              <h2 className="text-lg font-semibold mb-4">All Appointments</h2>
              <AppointmentList key={refreshKey} />
            </TabsContent>

            <TabsContent value="payments" className="space-y-3">
              <h2 className="text-lg font-semibold">Payments</h2>
              {recentPayments.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No payments yet</CardContent></Card>
              ) : (
                recentPayments.map(pay => (
                  <Card key={pay.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{pay.patient_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{pay.payment_type.replace('_', ' ')} • {pay.payment_method} • {new Date(pay.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">TZS {Number(pay.amount).toLocaleString()}</p>
                          <Badge variant={pay.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{pay.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-3">
              <h2 className="text-lg font-semibold">Pharmacy Orders</h2>
              {recentOrders.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No orders yet</CardContent></Card>
              ) : (
                recentOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{order.patient_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{order.organization?.name} • {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">TZS {Number(order.total_amount || 0).toLocaleString()}</p>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">{order.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="lab-bookings" className="space-y-3">
              <h2 className="text-lg font-semibold">Lab Bookings</h2>
              {recentLabBookings.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No lab bookings yet</CardContent></Card>
              ) : (
                recentLabBookings.map(lb => (
                  <Card key={lb.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{lb.lab_test?.name || 'Test'}</p>
                          <p className="text-xs text-muted-foreground">{lb.patient_name || 'Unknown'} • {lb.organization?.name} • {new Date(lb.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant={lb.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{lb.status}</Badge>
                          <Badge variant="outline" className="text-xs">{lb.result_status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="chatbot"><FAQManager /></TabsContent>
            <TabsContent value="settings"><SystemSettings /></TabsContent>
          </Tabs>
        </div>
      </div>

      {showOrgForm && <OrganizationForm onClose={() => setShowOrgForm(false)} onSuccess={() => { setShowOrgForm(false); handleRefresh(); }} />}
      {showDoctorForm && <DoctorForm onClose={() => setShowDoctorForm(false)} onSuccess={() => { setShowDoctorForm(false); handleRefresh(); }} />}
    </div>
  );
};

export default SuperAdminDashboard;
