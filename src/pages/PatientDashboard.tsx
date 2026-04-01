import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Calendar, Clock, User, Stethoscope, CheckCircle, XCircle, Timer,
  MessageSquare, Loader2, Pill, FlaskConical, FileText, CreditCard, Star,
  Upload, Heart, Bell, Search, Plus, ChevronRight, Package,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import DashboardShell from '@/components/DashboardShell';
import TelemedChatRoom from '@/components/telemed/TelemedChatRoom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending:   { color: 'bg-yellow-500', icon: Timer,       label: 'Pending' },
  confirmed: { color: 'bg-green-500',  icon: CheckCircle, label: 'Confirmed' },
  completed: { color: 'bg-blue-500',   icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'bg-red-500',    icon: XCircle,     label: 'Cancelled' },
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useTelemedAuth();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labBookings, setLabBookings] = useState<any[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const initialChatId = searchParams.get('chatId') || undefined;

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; doctorId: string; doctorName: string }>({ open: false, doctorId: '', doctorName: '' });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=/telemed/patient');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;
    const channels = [
      supabase.channel('patient-appts').on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `patient_id=eq.${user.id}` }, () => fetchAppointments()).subscribe(),
      supabase.channel('patient-notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as any;
        setNotifications(prev => [n, ...prev]);
        toast.info(n.title, { description: n.message });
      }).subscribe(),
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [user]);

  const fetchAll = async () => {
    setDataLoading(true);
    await Promise.all([fetchAppointments(), fetchPrescriptions(), fetchLabBookings(), fetchPharmacyOrders(), fetchPayments(), fetchMedicalRecords(), fetchNotifications()]);
    setDataLoading(false);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase.from('appointments').select('*, doctor:doctors(full_name, specialty, phone, consultation_fee, organization:organizations(name))').eq('patient_id', user!.id).order('appointment_date', { ascending: false });
    setAppointments(data || []);
  };

  const fetchPrescriptions = async () => {
    const { data } = await supabase.from('prescriptions').select('*, doctor:doctors(full_name, specialty), items:prescription_items(*)').eq('patient_id', user!.id).order('created_at', { ascending: false });
    setPrescriptions(data || []);
  };

  const fetchLabBookings = async () => {
    const { data } = await supabase.from('lab_bookings').select('*, lab_test:lab_tests(name, cost), organization:organizations(name)').eq('patient_id', user!.id).order('created_at', { ascending: false });
    setLabBookings(data || []);
  };

  const fetchPharmacyOrders = async () => {
    const { data } = await supabase.from('pharmacy_orders').select('*, organization:organizations(name), items:pharmacy_order_items(*)').eq('patient_id', user!.id).order('created_at', { ascending: false });
    setPharmacyOrders(data || []);
  };

  const fetchPayments = async () => {
    const { data } = await supabase.from('payments').select('*').eq('patient_id', user!.id).order('created_at', { ascending: false });
    setPayments(data || []);
  };

  const fetchMedicalRecords = async () => {
    const { data } = await supabase.from('medical_records').select('*, doctor:doctors(full_name)').eq('patient_id', user!.id).order('created_at', { ascending: false });
    setMedicalRecords(data || []);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
    setNotifications(data || []);
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) toast.error('Failed to cancel');
    else { toast.success('Appointment cancelled'); fetchAppointments(); }
  };

  const submitReview = async () => {
    const { error } = await supabase.from('reviews').insert({
      patient_id: user!.id,
      patient_name: user!.email?.split('@')[0],
      doctor_id: reviewDialog.doctorId,
      rating: reviewRating,
      comment: reviewComment || null,
    });
    if (error) toast.error('Failed to submit review');
    else { toast.success('Review submitted!'); setReviewDialog({ open: false, doctorId: '', doctorName: '' }); setReviewComment(''); setReviewRating(5); }
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status || ''));
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  return (
    <DashboardShell
      title="My Health"
      subtitle={`Welcome, ${user?.email?.split('@')[0]}`}
      icon={<Heart className="h-4 w-4 text-primary" />}
      onLogout={async () => { await supabase.auth.signOut(); navigate('/auth'); }}
      headerActions={
        <Button variant="ghost" size="icon" className="relative" onClick={() => setActiveTab('notifications')}>
          <Bell className="h-5 w-5" />
          {unreadNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">{unreadNotifs}</span>}
        </Button>
      }
    >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto mb-4">
                <TabsTrigger value="overview"><Heart className="h-3.5 w-3.5 mr-1.5" />Overview</TabsTrigger>
                <TabsTrigger value="appointments"><Calendar className="h-3.5 w-3.5 mr-1.5" />Appointments</TabsTrigger>
                <TabsTrigger value="prescriptions"><FileText className="h-3.5 w-3.5 mr-1.5" />Prescriptions</TabsTrigger>
                <TabsTrigger value="pharmacy"><Pill className="h-3.5 w-3.5 mr-1.5" />Pharmacy</TabsTrigger>
                <TabsTrigger value="labs"><FlaskConical className="h-3.5 w-3.5 mr-1.5" />Labs</TabsTrigger>
                <TabsTrigger value="records"><Upload className="h-3.5 w-3.5 mr-1.5" />Records</TabsTrigger>
                <TabsTrigger value="chats"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Chats</TabsTrigger>
                <TabsTrigger value="payments"><CreditCard className="h-3.5 w-3.5 mr-1.5" />Payments</TabsTrigger>
                <TabsTrigger value="notifications" className="relative">
                  <Bell className="h-3.5 w-3.5 mr-1.5" />Alerts
                  {unreadNotifs > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5">{unreadNotifs}</span>}
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-4">
              {dataLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('appointments')}>
                      <CardContent className="p-3 text-center">
                        <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-xl font-bold">{upcoming.length}</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('prescriptions')}>
                      <CardContent className="p-3 text-center">
                        <FileText className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        <p className="text-xl font-bold">{prescriptions.filter(p => p.status === 'active').length}</p>
                        <p className="text-xs text-muted-foreground">Active Rx</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('pharmacy')}>
                      <CardContent className="p-3 text-center">
                        <Pill className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                        <p className="text-xl font-bold">{pharmacyOrders.filter(o => o.status === 'pending').length}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('labs')}>
                      <CardContent className="p-3 text-center">
                        <FlaskConical className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        <p className="text-xl font-bold">{labBookings.filter(l => l.result_status === 'pending').length}</p>
                        <p className="text-xs text-muted-foreground">Pending Labs</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Upcoming appointments */}
                  {upcoming.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming Appointments</h3>
                      {upcoming.slice(0, 3).map(appt => (
                        <Card key={appt.id} className="mb-2">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Stethoscope className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Dr. {appt.doctor?.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}</p>
                                </div>
                              </div>
                              <Badge className={`${STATUS_CONFIG[appt.status || 'pending'].color} text-white text-xs`}>{STATUS_CONFIG[appt.status || 'pending'].label}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate('/')}>
                      <Search className="h-5 w-5" />
                      <span className="text-xs">Find Doctor</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('chats')}>
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">My Chats</span>
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* APPOINTMENTS */}
            <TabsContent value="appointments" className="space-y-3">
              {appointments.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">No appointments yet</p>
                  <Button onClick={() => navigate('/')}>Find a Doctor</Button>
                </div>
              ) : (
                appointments.map(appt => {
                  const cfg = STATUS_CONFIG[appt.status || 'pending'];
                  const Icon = cfg.icon;
                  return (
                    <Card key={appt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge className={`${cfg.color} text-white`}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(appt.appointment_date).toLocaleDateString()}</span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{appt.appointment_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">Dr. {appt.doctor?.full_name || 'Unknown'}</span>
                              {appt.doctor?.specialty && <Badge variant="outline" className="text-xs">{appt.doctor.specialty}</Badge>}
                            </div>
                            {appt.doctor?.organization?.name && <p className="text-xs text-muted-foreground mt-1">{appt.doctor.organization.name}</p>}
                            {appt.notes && <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded-lg">{appt.notes}</p>}
                          </div>
                          <div className="flex flex-col gap-1">
                            {appt.status === 'pending' && <Button size="sm" variant="destructive" onClick={() => cancelAppointment(appt.id)}>Cancel</Button>}
                            {appt.status === 'completed' && (
                              <Button size="sm" variant="outline" onClick={() => setReviewDialog({ open: true, doctorId: appt.doctor_id, doctorName: appt.doctor?.full_name || '' })}>
                                <Star className="h-3 w-3 mr-1" />Rate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* PRESCRIPTIONS */}
            <TabsContent value="prescriptions" className="space-y-3">
              {prescriptions.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No prescriptions yet</p>
                </div>
              ) : (
                prescriptions.map(rx => (
                  <Card key={rx.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{rx.diagnosis || 'Prescription'}</p>
                          <p className="text-xs text-muted-foreground">Dr. {rx.doctor?.full_name} • {new Date(rx.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>{rx.status}</Badge>
                      </div>
                      {rx.items && rx.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {rx.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-lg">
                              <div>
                                <p className="font-medium">{item.medicine_name}</p>
                                <p className="text-xs text-muted-foreground">{[item.dosage, item.frequency, item.duration].filter(Boolean).join(' • ')}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {rx.notes && <p className="text-sm text-muted-foreground mt-2">{rx.notes}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* PHARMACY ORDERS */}
            <TabsContent value="pharmacy" className="space-y-3">
              {pharmacyOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Pill className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No pharmacy orders yet</p>
                </div>
              ) : (
                pharmacyOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{order.organization?.name || 'Pharmacy Order'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                          {order.total_amount > 0 && <p className="text-sm font-medium mt-1">TZS {Number(order.total_amount).toLocaleString()}</p>}
                        </div>
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span>{item.medicine_name} x{item.quantity}</span>
                              <span className="text-muted-foreground">TZS {Number(item.unit_price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* LAB BOOKINGS */}
            <TabsContent value="labs" className="space-y-3">
              {labBookings.length === 0 ? (
                <div className="text-center py-16">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No lab tests yet</p>
                </div>
              ) : (
                labBookings.map(lb => (
                  <Card key={lb.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{lb.lab_test?.name || 'Lab Test'}</p>
                          <p className="text-xs text-muted-foreground">{lb.organization?.name} • {new Date(lb.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={lb.result_status === 'completed' ? 'default' : 'secondary'}>{lb.result_status}</Badge>
                          {lb.lab_test?.cost && <p className="text-xs mt-1">TZS {Number(lb.lab_test.cost).toLocaleString()}</p>}
                        </div>
                      </div>
                      {lb.result_notes && <p className="text-sm mt-2 p-2 bg-muted rounded-lg">{lb.result_notes}</p>}
                      {lb.result_file_url && (
                        <a href={lb.result_file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary mt-2 inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> View Results
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* MEDICAL RECORDS */}
            <TabsContent value="records" className="space-y-3">
              {medicalRecords.length === 0 ? (
                <div className="text-center py-16">
                  <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No medical records yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Records from consultations will appear here</p>
                </div>
              ) : (
                medicalRecords.map(rec => (
                  <Card key={rec.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{rec.title}</p>
                          <p className="text-xs text-muted-foreground">{rec.record_type} • {new Date(rec.created_at).toLocaleDateString()}</p>
                          {rec.doctor?.full_name && <p className="text-xs text-muted-foreground">Dr. {rec.doctor.full_name}</p>}
                        </div>
                        {rec.file_url && (
                          <a href={rec.file_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" />View</Button>
                          </a>
                        )}
                      </div>
                      {rec.description && <p className="text-sm text-muted-foreground mt-2">{rec.description}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* CHATS */}
            <TabsContent value="chats">
              <TelemedChatRoom patientId={user?.id} patientName={user?.email?.split('@')[0]} userRole="patient" initialChatId={initialChatId} />
            </TabsContent>

            {/* PAYMENTS */}
            <TabsContent value="payments" className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-16">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No payment history</p>
                </div>
              ) : (
                payments.map(pay => (
                  <Card key={pay.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm capitalize">{pay.payment_type.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{new Date(pay.created_at).toLocaleDateString()} • {pay.payment_method}</p>
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

            {/* NOTIFICATIONS */}
            <TabsContent value="notifications" className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              ) : (
                notifications.map(n => (
                  <Card key={n.id} className={`cursor-pointer transition-colors ${!n.is_read ? 'border-primary/30 bg-primary/5' : 'opacity-70'}`} onClick={() => markNotificationRead(n.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-muted'}`} />
                        <div>
                          <p className="font-medium text-sm">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => { if (!open) setReviewDialog({ open: false, doctorId: '', doctorName: '' }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rate Dr. {reviewDialog.doctorName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setReviewRating(s)} className="p-1">
                  <Star className={`h-8 w-8 ${s <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How was your experience?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, doctorId: '', doctorName: '' })}>Cancel</Button>
            <Button onClick={submitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
};

export default PatientDashboard;
