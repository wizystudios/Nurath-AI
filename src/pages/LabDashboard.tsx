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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  FlaskConical, Loader2, TestTube, CheckCircle,
  FileText, Upload, Clock, User,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Organization } from '@/types/telemed';
import LabTestManager from '@/components/telemed/LabTestManager';
import DashboardShell from '@/components/DashboardShell';

const LabDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isOrgAdmin, loading, signOut } = useTelemedAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('bookings');

  // Result upload dialog
  const [resultDialog, setResultDialog] = useState<{ open: boolean; booking: any }>({ open: false, booking: null });
  const [resultNotes, setResultNotes] = useState('');

  useEffect(() => {
    if (!loading && (!user || !isOrgAdmin())) { toast.error('Access denied.'); navigate('/auth'); }
  }, [user, loading, isOrgAdmin]);

  useEffect(() => {
    if (user && userRole?.organization_id) { fetchOrganization(); fetchStats(); fetchBookings(); }
  }, [user, userRole]);

  // Real-time bookings
  useEffect(() => {
    if (!userRole?.organization_id) return;
    const channel = supabase.channel('lab-bookings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_bookings', filter: `organization_id=eq.${userRole.organization_id}` }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userRole]);

  const fetchOrganization = async () => {
    const { data } = await supabase.from('organizations').select('*').eq('id', userRole!.organization_id!).single();
    if (data) setOrganization(data as Organization);
    setOrgLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase.from('lab_tests').select('*').eq('organization_id', userRole!.organization_id!);
    if (data) setStats({ total: data.length, available: data.filter(t => t.is_available).length });
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from('lab_bookings').select('*, lab_test:lab_tests(name, cost), doctor:doctors(full_name)').eq('organization_id', userRole!.organization_id!).order('created_at', { ascending: false });
    setBookings(data || []);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from('lab_bookings').update({ status }).eq('id', bookingId);
    if (error) toast.error('Failed to update');
    else { toast.success('Booking updated'); fetchBookings(); }
  };

  const submitResults = async () => {
    const booking = resultDialog.booking;
    const { error } = await supabase.from('lab_bookings').update({
      result_status: 'completed', result_notes: resultNotes, status: 'completed',
    }).eq('id', booking.id);
    if (error) toast.error('Failed to submit results');
    else {
      toast.success('Results submitted');
      if (booking.patient_id) {
        await supabase.from('medical_records').insert({
          patient_id: booking.patient_id, record_type: 'lab_result', title: `Lab Result: ${booking.lab_test?.name || 'Test'}`,
          description: resultNotes, doctor_id: booking.doctor_id, organization_id: userRole!.organization_id!,
        });
        await supabase.from('notifications').insert({
          user_id: booking.patient_id, title: 'Lab Results Ready',
          message: `Your ${booking.lab_test?.name || 'lab test'} results are ready.`, type: 'success',
        });
      }
      setResultDialog({ open: false, booking: null }); setResultNotes('');
      fetchBookings();
    }
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };

  if (loading || orgLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const inProgress = bookings.filter(b => b.status === 'in_progress');

  return (
    <DashboardShell
      title={organization?.name || 'Laboratory'}
      subtitle="Lab Dashboard"
      icon={<FlaskConical className="h-4 w-4 text-primary" />}
      onLogout={handleLogout}
    >

          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Tests</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-600">{pendingBookings.length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{inProgress.length}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="bookings" className="relative">
                <TestTube className="h-3.5 w-3.5 mr-1.5" />Bookings
                {pendingBookings.length > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">{pendingBookings.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="tests"><FlaskConical className="h-3.5 w-3.5 mr-1.5" />Test Catalog</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-3">
              {bookings.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No lab bookings yet</CardContent></Card>
              ) : (
                bookings.map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{booking.lab_test?.name || 'Lab Test'}</p>
                          <p className="text-xs text-muted-foreground">
                            Patient: {booking.patient_name || 'Unknown'} • {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                          {booking.doctor?.full_name && <p className="text-xs text-muted-foreground">Referred by Dr. {booking.doctor.full_name}</p>}
                        </div>
                        <div className="text-right">
                          <Badge className={booking.status === 'pending' ? 'bg-yellow-500 text-white' : booking.status === 'in_progress' ? 'bg-blue-500 text-white' : booking.status === 'completed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>{booking.status}</Badge>
                          <Badge variant="outline" className="text-xs ml-1">{booking.result_status}</Badge>
                        </div>
                      </div>
                      {booking.notes && <p className="text-sm text-muted-foreground bg-muted p-2 rounded mb-2">{booking.notes}</p>}
                      {booking.result_notes && <p className="text-sm p-2 bg-green-50 dark:bg-green-950 rounded mb-2"><strong>Results:</strong> {booking.result_notes}</p>}
                      <div className="flex gap-2 mt-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateBookingStatus(booking.id, 'in_progress')}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Reject</Button>
                          </>
                        )}
                        {booking.status === 'in_progress' && (
                          <Button size="sm" onClick={() => { setResultDialog({ open: true, booking }); setResultNotes(''); }}>
                            <FileText className="h-3 w-3 mr-1" />Upload Results
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="tests">
              {userRole?.organization_id && <LabTestManager organizationId={userRole.organization_id} />}
            </TabsContent>
          </Tabs>


      {/* Results Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => { if (!open) setResultDialog({ open: false, booking: null }); }}>
        <DialogContent>
          <DialogHeader><DialogTitle><FileText className="h-5 w-5 inline mr-2" />Submit Lab Results</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Test: <strong>{resultDialog.booking?.lab_test?.name}</strong> • Patient: <strong>{resultDialog.booking?.patient_name}</strong></p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Results / Notes</Label>
              <Textarea value={resultNotes} onChange={e => setResultNotes(e.target.value)} placeholder="Enter test results, findings, observations..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultDialog({ open: false, booking: null })}>Cancel</Button>
            <Button onClick={submitResults}>Submit Results</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
};

export default LabDashboard;
