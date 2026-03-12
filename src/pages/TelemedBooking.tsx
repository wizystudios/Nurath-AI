import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Loader2, MapPin, CheckCircle, Stethoscope } from 'lucide-react';
import { Doctor } from '@/types/telemed';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

const TelemedBooking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useTelemedAuth();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    if (!doctorId) return;
    const { data, error } = await supabase
      .from('doctors')
      .select('*, organization:organizations(*)')
      .eq('id', doctorId)
      .maybeSingle();
    if (error || !data) {
      toast.error('Doctor not found');
      navigate('/telemed');
      return;
    }
    setDoctor(data as Doctor);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !patientName || !patientPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        doctor_id: doctorId,
        patient_id: user?.id || null,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail || null,
        organization_id: doctor?.organization_id || null,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedTime,
        notes: notes || null,
        status: 'pending',
      });
      if (error) throw error;
      setSuccess(true);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center border-border">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Appointment Booked!</CardTitle>
            <CardDescription>
              Your appointment with Dr. {doctor?.full_name} has been submitted.
              You will receive a confirmation once approved.
            </CardDescription>
            <div className="bg-muted rounded-xl p-4 text-sm text-left space-y-1">
              <p><span className="text-muted-foreground">Date:</span> <strong>{selectedDate?.toLocaleDateString()}</strong></p>
              <p><span className="text-muted-foreground">Time:</span> <strong>{selectedTime}</strong></p>
              <p><span className="text-muted-foreground">Doctor:</span> <strong>{doctor?.full_name}</strong></p>
            </div>
            <Button onClick={() => navigate('/?mode=telemed')} className="w-full">
              Back to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-lg px-4 py-4">
        <Button variant="ghost" onClick={() => navigate('/?mode=telemed')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Doctor Info Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-muted/50 rounded-2xl">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">Dr. {doctor?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{doctor?.specialty}</p>
            {doctor?.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                {doctor.location}
              </div>
            )}
          </div>
          {doctor?.consultation_fee && (
            <p className="text-sm font-semibold text-primary whitespace-nowrap">
              Tsh {doctor.consultation_fee.toLocaleString()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" /> Select Date *
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date.getDay() === 0}
              className="rounded-xl border mx-auto"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" /> Select Time *
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Patient Info */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Full Name *</Label>
              <Input id="name" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Your full name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">Phone *</Label>
              <Input id="phone" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="+255 xxx xxx xxx" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email (Optional)</Label>
              <Input id="email" type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any symptoms or concerns..." rows={3} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TelemedBooking;
