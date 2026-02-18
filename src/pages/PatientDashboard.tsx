import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar, Clock, User, Stethoscope, ArrowLeft,
  CheckCircle, XCircle, Timer, Heart, MessageSquare, Loader2,
} from 'lucide-react';
import { Appointment } from '@/types/telemed';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import TelemedChatRoom from '@/components/telemed/TelemedChatRoom';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending:   { color: 'bg-yellow-500', icon: Timer,        label: 'Pending Approval' },
  confirmed: { color: 'bg-green-500',  icon: CheckCircle,  label: 'Confirmed' },
  completed: { color: 'bg-blue-500',   icon: CheckCircle,  label: 'Completed' },
  cancelled: { color: 'bg-red-500',    icon: XCircle,      label: 'Cancelled' },
};

interface AppointmentWithDoctor extends Appointment {
  doctor?: any;
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useTelemedAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please log in to view your dashboard');
      navigate('/telemed/auth');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('patient-appointments')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'appointments',
        filter: `patient_id=eq.${user.id}`,
      }, () => { fetchAppointments(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchAppointments = async () => {
    setApptLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, doctor:doctors(full_name, specialty, phone, email, consultation_fee)')
      .eq('patient_id', user!.id)
      .order('appointment_date', { ascending: false });

    if (error) {
      toast.error('Failed to load appointments');
    } else {
      setAppointments((data as AppointmentWithDoctor[]) || []);
    }
    setApptLoading(false);
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) toast.error('Failed to cancel');
    else { toast.success('Appointment cancelled'); fetchAppointments(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const upcoming = appointments.filter(a => ['pending','confirmed'].includes(a.status || ''));
  const past     = appointments.filter(a => ['completed','cancelled'].includes(a.status || ''));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/?mode=telemed')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">My Health Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{upcoming.filter(a=>a.status==='pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{upcoming.filter(a=>a.status==='confirmed').length}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{past.filter(a=>a.status==='completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="bookings">My Appointments</TabsTrigger>
            <TabsTrigger value="chats">My Chats</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {apptLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No appointments yet</p>
                  <Button className="mt-4" onClick={() => navigate('/?mode=telemed')}>
                    Find a Doctor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-lg mb-3">Upcoming</h2>
                    <div className="space-y-3">
                      {upcoming.map(appt => {
                        const cfg = STATUS_CONFIG[appt.status || 'pending'];
                        const Icon = cfg.icon;
                        return (
                          <Card key={appt.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge className={`${cfg.color} text-white`}>
                                      <Icon className="h-3 w-3 mr-1" />
                                      {cfg.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(appt.appointment_date).toLocaleDateString()}
                                    </span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {appt.appointment_time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{appt.doctor?.full_name || 'Unknown Doctor'}</span>
                                    {appt.doctor?.specialty && (
                                      <Badge variant="outline" className="text-xs">{appt.doctor.specialty}</Badge>
                                    )}
                                  </div>
                                  {appt.notes && (
                                    <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded-lg">{appt.notes}</p>
                                  )}
                                </div>
                                {appt.status === 'pending' && (
                                  <Button size="sm" variant="destructive" onClick={() => cancelAppointment(appt.id)}>
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-lg mb-3 mt-6">History</h2>
                    <div className="space-y-3">
                      {past.map(appt => {
                        const cfg = STATUS_CONFIG[appt.status || 'completed'];
                        const Icon = cfg.icon;
                        return (
                          <Card key={appt.id} className="opacity-80">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={`${cfg.color} text-white`}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {cfg.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{appt.doctor?.full_name || 'Unknown Doctor'}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="chats">
            <TelemedChatRoom patientId={user?.id} patientName={user?.email?.split('@')[0]} userRole="patient" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDashboard;
