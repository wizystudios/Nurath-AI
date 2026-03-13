import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar, Clock, User, Stethoscope, ArrowLeft,
  CheckCircle, XCircle, Timer, Heart, MessageSquare, Loader2,
  ChevronDown,
} from 'lucide-react';
import { Appointment } from '@/types/telemed';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { ThemeToggle } from '@/components/theme-toggle';
import TelemedChatRoom from '@/components/telemed/TelemedChatRoom';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending:   { color: 'bg-yellow-500', icon: Timer,       label: 'Pending' },
  confirmed: { color: 'bg-green-500',  icon: CheckCircle, label: 'Confirmed' },
  completed: { color: 'bg-blue-500',   icon: CheckCircle, label: 'Completed' },
  cancelled: { color: 'bg-red-500',    icon: XCircle,     label: 'Cancelled' },
};

interface AppointmentWithDoctor extends Appointment {
  doctor?: any;
}

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useTelemedAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'chats' ? 'chats' : 'bookings');
  const initialChatId = searchParams.get('chatId') || undefined;

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please log in to view your dashboard');
      navigate('/auth');
    }
  }, [user, loading]);

  useEffect(() => { if (user) fetchAppointments(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('patient-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `patient_id=eq.${user.id}` },
        () => { fetchAppointments(); })
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
    if (error) toast.error('Failed to load appointments');
    else setAppointments((data as AppointmentWithDoctor[]) || []);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status || ''));
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status || ''));

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header — matching AI chat header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/?mode=telemed')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">My Health</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Stats — compact inline */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 text-center py-3 rounded-xl bg-muted/30">
              <p className="text-xl font-bold text-yellow-600">{upcoming.filter(a => a.status === 'pending').length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="flex-1 text-center py-3 rounded-xl bg-muted/30">
              <p className="text-xl font-bold text-green-600">{upcoming.filter(a => a.status === 'confirmed').length}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
            <div className="flex-1 text-center py-3 rounded-xl bg-muted/30">
              <p className="text-xl font-bold text-blue-600">{past.filter(a => a.status === 'completed').length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bookings">
                <Calendar className="h-4 w-4 mr-2" /> Appointments
              </TabsTrigger>
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4 mr-2" /> Chats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-3">
              {apptLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-16">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">No appointments yet</p>
                  <Button onClick={() => navigate('/?mode=telemed')}>Find a Doctor</Button>
                </div>
              ) : (
                <>
                  {upcoming.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                      {upcoming.map(appt => {
                        const cfg = STATUS_CONFIG[appt.status || 'pending'];
                        const Icon = cfg.icon;
                        return (
                          <Card key={appt.id} className="border-border/50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge className={`${cfg.color} text-white`}>
                                      <Icon className="h-3 w-3 mr-1" />{cfg.label}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(appt.appointment_date).toLocaleDateString()}
                                    </span>
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />{appt.appointment_time}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">{appt.doctor?.full_name || 'Unknown Doctor'}</span>
                                    {appt.doctor?.specialty && <Badge variant="outline" className="text-xs">{appt.doctor.specialty}</Badge>}
                                  </div>
                                  {appt.notes && <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded-lg">{appt.notes}</p>}
                                </div>
                                {appt.status === 'pending' && (
                                  <Button size="sm" variant="destructive" onClick={() => cancelAppointment(appt.id)}>Cancel</Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {past.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium text-muted-foreground">History</p>
                      {past.map(appt => {
                        const cfg = STATUS_CONFIG[appt.status || 'completed'];
                        const Icon = cfg.icon;
                        return (
                          <Card key={appt.id} className="border-border/50 opacity-70">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${cfg.color} text-white`}><Icon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                                </span>
                                <span className="text-sm font-medium ml-auto">{appt.doctor?.full_name}</span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="chats">
              <TelemedChatRoom patientId={user?.id} patientName={user?.email?.split('@')[0]} userRole="patient" initialChatId={initialChatId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
