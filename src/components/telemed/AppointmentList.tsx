import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Clock, User, Stethoscope, Loader2, CheckCircle, X } from 'lucide-react';
import { Appointment, Doctor } from '@/types/telemed';

interface AppointmentWithDoctor extends Appointment {
  doctor?: Doctor;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
  completed: 'bg-blue-500',
};

const AppointmentList: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    let query = supabase
      .from('appointments')
      .select('*, doctor:doctors(*)')
      .order('appointment_date', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } else {
      setAppointments((data as AppointmentWithDoctor[]) || []);
    }
    setLoading(false);
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      toast.error('Failed to update appointment');
    } else {
      toast.success('Appointment updated');
      fetchAppointments();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No appointments found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={STATUS_COLORS[appointment.status]}>
                        {appointment.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.appointment_time}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Patient
                        </p>
                        <p className="text-sm">{appointment.patient_name || 'Anonymous'}</p>
                        {appointment.patient_phone && (
                          <p className="text-xs text-muted-foreground">{appointment.patient_phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          Doctor
                        </p>
                        <p className="text-sm">{appointment.doctor?.full_name || 'Unknown'}</p>
                        {appointment.doctor?.specialty && (
                          <p className="text-xs text-muted-foreground">{appointment.doctor.specialty}</p>
                        )}
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-2 border-t pt-2">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => updateStatus(appointment.id, 'confirmed')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {appointment.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(appointment.id, 'completed')}
                    >
                      Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
