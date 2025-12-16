import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Stethoscope,
  Calendar,
  MessageSquare,
  LogOut,
  Heart,
  Clock,
  CheckCircle,
  X,
  Loader2,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Doctor, Appointment } from '@/types/telemed';
import TelemedChatRoom from '@/components/telemed/TelemedChatRoom';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, isDoctor, loading, signOut } = useTelemedAuth();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [docLoading, setDocLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [isOnline, setIsOnline] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isDoctor())) {
      toast.error('Access denied. Doctors only.');
      navigate('/telemed/auth');
    }
  }, [user, loading, isDoctor]);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, organization:organizations(*)')
      .eq('user_id', user?.id)
      .single();

    if (error) {
      console.error('Error fetching doctor:', error);
      toast.error('Failed to load profile');
    } else {
      setDoctor(data as Doctor);
      setIsOnline(data.is_online || false);
      fetchAppointments(data.id);
    }
    setDocLoading(false);
  };

  const fetchAppointments = async (doctorId: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      setAppointments((data as Appointment[]) || []);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!doctor) return;

    const newStatus = !isOnline;
    const { error } = await supabase
      .from('doctors')
      .update({ is_online: newStatus })
      .eq('id', doctor.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setIsOnline(newStatus);
      toast.success(newStatus ? 'You are now online' : 'You are now offline');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    if (error) {
      toast.error('Failed to update appointment');
    } else {
      toast.success('Appointment updated');
      if (doctor) fetchAppointments(doctor.id);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/telemed/auth');
  };

  if (loading || docLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const todayAppointments = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointment_date === today && a.status !== 'cancelled';
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Dr. {doctor?.full_name}</h1>
              <p className="text-xs text-muted-foreground">{doctor?.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-gray-400" />}
              <Switch checked={isOnline} onCheckedChange={toggleOnlineStatus} />
              <Label className="text-sm">{isOnline ? 'Online' : 'Offline'}</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingAppointments.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{confirmedAppointments.length}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{todayAppointments.length}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chats">Patient Chats</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <h2 className="text-xl font-semibold">Your Appointments</h2>
            
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No appointments yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              appointment.status === 'pending' ? 'bg-yellow-500' :
                              appointment.status === 'confirmed' ? 'bg-green-500' :
                              appointment.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                            }>
                              {appointment.status}
                            </Badge>
                            <span className="text-sm flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </span>
                            <span className="text-sm flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {appointment.appointment_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.patient_name || 'Anonymous'}</span>
                          </div>
                          {appointment.patient_phone && (
                            <p className="text-sm text-muted-foreground mt-1">{appointment.patient_phone}</p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">{appointment.notes}</p>
                          )}
                        </div>
                        
                        {appointment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {appointment.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chats">
            <h2 className="text-xl font-semibold mb-4">Patient Chats</h2>
            {doctor && <TelemedChatRoom doctorId={doctor.id} userRole="doctor" />}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Your professional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-10 w-10 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{doctor?.full_name}</h3>
                    <Badge>{doctor?.specialty}</Badge>
                    {doctor?.organization && (
                      <p className="text-sm text-muted-foreground mt-1">{doctor.organization.name}</p>
                    )}
                  </div>
                </div>
                
                {doctor?.bio && (
                  <div>
                    <Label>Bio</Label>
                    <p className="text-sm text-muted-foreground mt-1">{doctor.bio}</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  {doctor?.phone && (
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm">{doctor.phone}</p>
                    </div>
                  )}
                  {doctor?.email && (
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm">{doctor.email}</p>
                    </div>
                  )}
                  {doctor?.location && (
                    <div>
                      <Label>Location</Label>
                      <p className="text-sm">{doctor.location}</p>
                    </div>
                  )}
                  {doctor?.consultation_fee && (
                    <div>
                      <Label>Consultation Fee</Label>
                      <p className="text-sm font-medium">TZS {doctor.consultation_fee.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorDashboard;
