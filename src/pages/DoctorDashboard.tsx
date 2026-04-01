import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Stethoscope, Calendar, MessageSquare, Clock, CheckCircle, X,
  Loader2, User, Wifi, WifiOff, CalendarClock, FileText, FlaskConical, Plus,
  Pill,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Doctor, Appointment } from '@/types/telemed';
import TelemedChatRoom from '@/components/telemed/TelemedChatRoom';
import DashboardShell from '@/components/DashboardShell';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, isDoctor, loading, signOut } = useTelemedAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [docLoading, setDocLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [isOnline, setIsOnline] = useState(false);
  const [newBookingCount, setNewBookingCount] = useState(0);

  // Suggest time
  const [suggestDialog, setSuggestDialog] = useState<{ open: boolean; appointmentId: string; patientName: string }>({ open: false, appointmentId: '', patientName: '' });
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [suggestReason, setSuggestReason] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  // Write prescription
  const [rxDialog, setRxDialog] = useState<{ open: boolean; appointment: any }>({ open: false, appointment: null });
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxItems, setRxItems] = useState<Array<{ medicine_name: string; dosage: string; frequency: string; duration: string; quantity: number }>>([{ medicine_name: '', dosage: '', frequency: '', duration: '', quantity: 1 }]);
  const [writingRx, setWritingRx] = useState(false);

  // Lab request
  const [labDialog, setLabDialog] = useState<{ open: boolean; appointment: any }>({ open: false, appointment: null });
  const [labTests, setLabTests] = useState<any[]>([]);
  const [selectedLabTest, setSelectedLabTest] = useState('');
  const [selectedLabOrg, setSelectedLabOrg] = useState('');
  const [labs, setLabs] = useState<any[]>([]);
  const [labNote, setLabNote] = useState('');

  useEffect(() => {
    if (!loading && (!user || !isDoctor())) {
      toast.error('Access denied. Doctors only.');
      navigate('/auth');
    }
  }, [user, loading, isDoctor]);

  useEffect(() => { if (user) fetchDoctorProfile(); }, [user]);

  useEffect(() => {
    if (!doctor) return;
    const channel = supabase.channel('doc-appts-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${doctor.id}` }, (payload) => {
        const newAppt = payload.new as Appointment;
        setAppointments(prev => [newAppt, ...prev]);
        setNewBookingCount(c => c + 1);
        toast.info(`New booking from ${newAppt.patient_name || 'a patient'}!`, { description: `${newAppt.appointment_date} at ${newAppt.appointment_time}`, duration: 8000 });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${doctor.id}` }, (payload) => {
        const updated = payload.new as Appointment;
        setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [doctor]);

  const fetchDoctorProfile = async () => {
    const { data, error } = await supabase.from('doctors').select('*, organization:organizations(*)').eq('user_id', user?.id).single();
    if (error) { toast.error('Failed to load profile'); }
    else { setDoctor(data as Doctor); setIsOnline(data.is_online || false); fetchAppointments(data.id); fetchPrescriptions(data.id); }
    setDocLoading(false);
  };

  const fetchAppointments = async (doctorId: string) => {
    const { data } = await supabase.from('appointments').select('*').eq('doctor_id', doctorId).order('appointment_date', { ascending: true });
    if (data) setAppointments(data as Appointment[]);
  };

  const fetchPrescriptions = async (doctorId: string) => {
    const { data } = await supabase.from('prescriptions').select('*, items:prescription_items(*)').eq('doctor_id', doctorId).order('created_at', { ascending: false });
    if (data) setPrescriptions(data);
  };

  const toggleOnlineStatus = async () => {
    if (!doctor) return;
    const newStatus = !isOnline;
    const { error } = await supabase.from('doctors').update({ is_online: newStatus }).eq('id', doctor.id);
    if (error) toast.error('Failed to update status');
    else { setIsOnline(newStatus); toast.success(newStatus ? 'You are now online' : 'You are now offline'); }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const appt = appointments.find(a => a.id === id);
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) toast.error('Failed to update');
    else {
      toast.success('Appointment updated');
      if (doctor) fetchAppointments(doctor.id);
      // Notify patient
      if (appt?.patient_id) {
        await supabase.from('notifications').insert({
          user_id: appt.patient_id,
          title: `Appointment ${status}`,
          message: `Your appointment on ${appt.appointment_date} at ${appt.appointment_time} has been ${status} by Dr. ${doctor?.full_name}.`,
          type: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'info',
        });
      }
    }
  };

  const handleSuggestNewTime = async () => {
    if (!suggestedDate || !suggestedTime) { toast.error('Please select both date and time'); return; }
    setSuggesting(true);
    try {
      const noteText = `Doctor suggested a new time: ${suggestedDate} at ${suggestedTime}${suggestReason ? ` — Reason: ${suggestReason}` : ''}`;
      await supabase.from('appointments').update({ status: 'cancelled', notes: noteText }).eq('id', suggestDialog.appointmentId);
      const appt = appointments.find(a => a.id === suggestDialog.appointmentId);
      if (appt) {
        await supabase.from('appointments').insert({
          doctor_id: appt.doctor_id, patient_id: appt.patient_id, patient_name: appt.patient_name,
          patient_phone: appt.patient_phone, patient_email: appt.patient_email, organization_id: appt.organization_id,
          appointment_date: suggestedDate, appointment_time: suggestedTime, status: 'pending',
          notes: `Rescheduled by doctor from ${appt.appointment_date} ${appt.appointment_time}. ${suggestReason || ''}`.trim(),
        });
        if (appt.patient_id) {
          await supabase.from('notifications').insert({
            user_id: appt.patient_id,
            title: 'New Time Suggested',
            message: `Dr. ${doctor?.full_name} suggested a new time: ${suggestedDate} at ${suggestedTime}. ${suggestReason || ''}`,
            type: 'info',
          });
        }
      }
      toast.success(`New time suggested to ${suggestDialog.patientName}`);
      setSuggestDialog({ open: false, appointmentId: '', patientName: '' });
      setSuggestedDate(''); setSuggestedTime(''); setSuggestReason('');
      if (doctor) fetchAppointments(doctor.id);
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setSuggesting(false); }
  };

  const handleWritePrescription = async () => {
    if (!rxDiagnosis || rxItems.every(i => !i.medicine_name)) { toast.error('Add diagnosis and at least one medicine'); return; }
    setWritingRx(true);
    try {
      const appt = rxDialog.appointment;
      const { data: rx, error } = await supabase.from('prescriptions').insert({
        appointment_id: appt?.id || null, doctor_id: doctor!.id, patient_id: appt?.patient_id || null,
        patient_name: appt?.patient_name || null, diagnosis: rxDiagnosis, notes: rxNotes || null,
      }).select().single();
      if (error) throw error;
      const validItems = rxItems.filter(i => i.medicine_name);
      if (validItems.length > 0) {
        await supabase.from('prescription_items').insert(validItems.map(i => ({ prescription_id: rx.id, ...i })));
      }
      // Create medical record
      if (appt?.patient_id) {
        await supabase.from('medical_records').insert({
          patient_id: appt.patient_id, record_type: 'prescription', title: `Prescription: ${rxDiagnosis}`,
          description: `Prescribed by Dr. ${doctor?.full_name}`, doctor_id: doctor!.id, appointment_id: appt?.id || null,
        });
        await supabase.from('notifications').insert({
          user_id: appt.patient_id, title: 'New Prescription',
          message: `Dr. ${doctor?.full_name} wrote a prescription for: ${rxDiagnosis}`, type: 'info',
        });
      }
      toast.success('Prescription created');
      setRxDialog({ open: false, appointment: null }); setRxDiagnosis(''); setRxNotes('');
      setRxItems([{ medicine_name: '', dosage: '', frequency: '', duration: '', quantity: 1 }]);
      if (doctor) fetchPrescriptions(doctor.id);
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setWritingRx(false); }
  };

  const openLabRequestDialog = async (appointment: any) => {
    setLabDialog({ open: true, appointment });
    const { data: orgs } = await supabase.from('organizations').select('id, name').eq('type', 'lab').eq('is_approved', true);
    setLabs(orgs || []);
  };

  const handleLabRequest = async () => {
    if (!selectedLabOrg || !selectedLabTest) { toast.error('Select a lab and test'); return; }
    const appt = labDialog.appointment;
    const { error } = await supabase.from('lab_bookings').insert({
      patient_id: appt?.patient_id || null, patient_name: appt?.patient_name || null,
      organization_id: selectedLabOrg, lab_test_id: selectedLabTest, doctor_id: doctor!.id,
      notes: labNote || null, status: 'pending', result_status: 'pending',
    });
    if (error) toast.error('Failed to request lab test');
    else {
      toast.success('Lab test requested');
      if (appt?.patient_id) {
        await supabase.from('notifications').insert({
          user_id: appt.patient_id, title: 'Lab Test Requested',
          message: `Dr. ${doctor?.full_name} requested a lab test for you.`, type: 'info',
        });
      }
      setLabDialog({ open: false, appointment: null }); setSelectedLabTest(''); setSelectedLabOrg(''); setLabNote('');
    }
  };

  const fetchLabTestsForOrg = async (orgId: string) => {
    setSelectedLabOrg(orgId);
    const { data } = await supabase.from('lab_tests').select('id, name, cost').eq('organization_id', orgId).eq('is_available', true);
    setLabTests(data || []);
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };

  if (loading || docLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const today = appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0] && a.status !== 'cancelled');

  return (
    <DashboardShell
      title={`Dr. ${doctor?.full_name || ''}`}
      subtitle={doctor?.specialty}
      icon={<Stethoscope className="h-4 w-4 text-primary" />}
      onLogout={handleLogout}
      headerActions={
        <div className="flex items-center gap-1.5">
          {isOnline ? <Wifi className="h-3.5 w-3.5 text-green-500" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
          <Switch checked={isOnline} onCheckedChange={toggleOnlineStatus} />
        </div>
      }
    >

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-600">{pending.length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{confirmed.length}</p><p className="text-xs text-muted-foreground">Confirmed</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-primary">{today.length}</p><p className="text-xs text-muted-foreground">Today</p></CardContent></Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto mb-4">
                <TabsTrigger value="appointments" className="relative" onClick={() => setNewBookingCount(0)}>
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />Appointments
                  {newBookingCount > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">{newBookingCount}</span>}
                </TabsTrigger>
                <TabsTrigger value="prescriptions"><FileText className="h-3.5 w-3.5 mr-1.5" />Prescriptions</TabsTrigger>
                <TabsTrigger value="chats"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Chats</TabsTrigger>
                <TabsTrigger value="profile"><User className="h-3.5 w-3.5 mr-1.5" />Profile</TabsTrigger>
              </TabsList>
            </ScrollArea>

            {/* APPOINTMENTS */}
            <TabsContent value="appointments" className="space-y-3">
              {appointments.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No appointments yet</CardContent></Card>
              ) : (
                appointments.map(appt => (
                  <Card key={appt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={appt.status === 'pending' ? 'bg-yellow-500 text-white' : appt.status === 'confirmed' ? 'bg-green-500 text-white' : appt.status === 'completed' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}>{appt.status}</Badge>
                            <span className="text-sm flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(appt.appointment_date).toLocaleDateString()}</span>
                            <span className="text-sm flex items-center gap-1"><Clock className="h-3 w-3" />{appt.appointment_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appt.patient_name || 'Anonymous'}</span>
                          </div>
                          {appt.patient_phone && <p className="text-sm text-muted-foreground mt-1">{appt.patient_phone}</p>}
                          {appt.notes && <p className="text-sm mt-2 p-2 bg-muted rounded-lg">{appt.notes}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {appt.status === 'pending' && (
                            <>
                              <div className="flex gap-1">
                                <Button size="sm" className="bg-green-500 hover:bg-green-600 h-7 w-7 p-0" onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}><CheckCircle className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}><X className="h-3.5 w-3.5" /></Button>
                              </div>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setSuggestDialog({ open: true, appointmentId: appt.id, patientName: appt.patient_name || 'Patient' })}>
                                <CalendarClock className="h-3 w-3 mr-1" />Reschedule
                              </Button>
                            </>
                          )}
                          {appt.status === 'confirmed' && (
                            <div className="flex flex-col gap-1">
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateAppointmentStatus(appt.id, 'completed')}>Complete</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setRxDialog({ open: true, appointment: appt })}>
                                <FileText className="h-3 w-3 mr-1" />Prescribe
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openLabRequestDialog(appt)}>
                                <FlaskConical className="h-3 w-3 mr-1" />Lab
                              </Button>
                            </div>
                          )}
                          {appt.status === 'completed' && (
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setRxDialog({ open: true, appointment: appt })}>
                              <FileText className="h-3 w-3 mr-1" />Prescribe
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* PRESCRIPTIONS */}
            <TabsContent value="prescriptions" className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Prescriptions Written</h3>
                <Button size="sm" variant="outline" onClick={() => setRxDialog({ open: true, appointment: null })}>
                  <Plus className="h-3.5 w-3.5 mr-1" />New Prescription
                </Button>
              </div>
              {prescriptions.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No prescriptions written yet</CardContent></Card>
              ) : (
                prescriptions.map(rx => (
                  <Card key={rx.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{rx.diagnosis}</p>
                          <p className="text-xs text-muted-foreground">{rx.patient_name || 'Unknown'} • {new Date(rx.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>{rx.status}</Badge>
                      </div>
                      {rx.items?.map((item: any) => (
                        <div key={item.id} className="text-sm bg-muted/50 p-2 rounded mt-1">
                          <span className="font-medium">{item.medicine_name}</span>
                          <span className="text-muted-foreground"> • {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' • ')}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* CHATS */}
            <TabsContent value="chats">
              {doctor && <TelemedChatRoom doctorId={doctor.id} userRole="doctor" />}
            </TabsContent>

            {/* PROFILE */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Your professional information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{doctor?.full_name}</h3>
                      <Badge>{doctor?.specialty}</Badge>
                      {doctor?.organization && <p className="text-sm text-muted-foreground mt-1">{doctor.organization.name}</p>}
                    </div>
                  </div>
                  {doctor?.bio && <p className="text-sm text-muted-foreground">{doctor.bio}</p>}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {doctor?.phone && <div><Label className="text-muted-foreground">Phone</Label><p>{doctor.phone}</p></div>}
                    {doctor?.email && <div><Label className="text-muted-foreground">Email</Label><p>{doctor.email}</p></div>}
                    {doctor?.location && <div><Label className="text-muted-foreground">Location</Label><p>{doctor.location}</p></div>}
                    {doctor?.consultation_fee && <div><Label className="text-muted-foreground">Consultation Fee</Label><p className="font-medium">TZS {doctor.consultation_fee.toLocaleString()}</p></div>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Suggest New Time Dialog */}
      <Dialog open={suggestDialog.open} onOpenChange={(open) => { if (!open) setSuggestDialog({ open: false, appointmentId: '', patientName: '' }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle><CalendarClock className="h-5 w-5 inline mr-2" />Suggest New Time</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Propose an alternative time to <strong>{suggestDialog.patientName}</strong>.</p>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={suggestedDate} onChange={e => setSuggestedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} /></div>
            <div className="space-y-1"><Label>Time</Label><Input type="time" value={suggestedTime} onChange={e => setSuggestedTime(e.target.value)} /></div>
            <div className="space-y-1"><Label>Reason (optional)</Label><Input value={suggestReason} onChange={e => setSuggestReason(e.target.value)} placeholder="e.g., I have another appointment" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuggestDialog({ open: false, appointmentId: '', patientName: '' })}>Cancel</Button>
            <Button onClick={handleSuggestNewTime} disabled={suggesting}>{suggesting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Suggest Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write Prescription Dialog */}
      <Dialog open={rxDialog.open} onOpenChange={(open) => { if (!open) setRxDialog({ open: false, appointment: null }); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle><FileText className="h-5 w-5 inline mr-2" />Write Prescription</DialogTitle></DialogHeader>
          {rxDialog.appointment && <p className="text-sm text-muted-foreground">Patient: <strong>{rxDialog.appointment.patient_name}</strong></p>}
          <div className="space-y-3">
            <div className="space-y-1"><Label>Diagnosis *</Label><Input value={rxDiagnosis} onChange={e => setRxDiagnosis(e.target.value)} placeholder="e.g., Upper respiratory infection" /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={rxNotes} onChange={e => setRxNotes(e.target.value)} placeholder="Additional notes..." rows={2} /></div>
            <div>
              <div className="flex justify-between items-center mb-2"><Label>Medicines</Label><Button size="sm" variant="outline" onClick={() => setRxItems([...rxItems, { medicine_name: '', dosage: '', frequency: '', duration: '', quantity: 1 }])}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
              {rxItems.map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 mb-2">
                  <Input className="col-span-2" placeholder="Medicine" value={item.medicine_name} onChange={e => { const n = [...rxItems]; n[i].medicine_name = e.target.value; setRxItems(n); }} />
                  <Input placeholder="Dosage" value={item.dosage} onChange={e => { const n = [...rxItems]; n[i].dosage = e.target.value; setRxItems(n); }} />
                  <Input placeholder="Frequency" value={item.frequency} onChange={e => { const n = [...rxItems]; n[i].frequency = e.target.value; setRxItems(n); }} />
                  <Input placeholder="Duration" value={item.duration} onChange={e => { const n = [...rxItems]; n[i].duration = e.target.value; setRxItems(n); }} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRxDialog({ open: false, appointment: null })}>Cancel</Button>
            <Button onClick={handleWritePrescription} disabled={writingRx}>{writingRx && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Request Dialog */}
      <Dialog open={labDialog.open} onOpenChange={(open) => { if (!open) setLabDialog({ open: false, appointment: null }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle><FlaskConical className="h-5 w-5 inline mr-2" />Request Lab Test</DialogTitle></DialogHeader>
          {labDialog.appointment && <p className="text-sm text-muted-foreground">Patient: <strong>{labDialog.appointment.patient_name}</strong></p>}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Select Lab</Label>
              <Select value={selectedLabOrg} onValueChange={fetchLabTestsForOrg}>
                <SelectTrigger><SelectValue placeholder="Choose a lab..." /></SelectTrigger>
                <SelectContent>{labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {labTests.length > 0 && (
              <div className="space-y-1">
                <Label>Select Test</Label>
                <Select value={selectedLabTest} onValueChange={setSelectedLabTest}>
                  <SelectTrigger><SelectValue placeholder="Choose a test..." /></SelectTrigger>
                  <SelectContent>{labTests.map(t => <SelectItem key={t.id} value={t.id}>{t.name} {t.cost ? `(TZS ${Number(t.cost).toLocaleString()})` : ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1"><Label>Notes</Label><Input value={labNote} onChange={e => setLabNote(e.target.value)} placeholder="Clinical notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLabDialog({ open: false, appointment: null })}>Cancel</Button>
            <Button onClick={handleLabRequest}>Request Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;
