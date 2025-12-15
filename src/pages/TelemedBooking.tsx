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
import { ArrowLeft, Calendar as CalendarIcon, Clock, Loader2, MapPin, CheckCircle } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Appointment Booked!</CardTitle>
            <CardDescription>
              Your appointment with Dr. {doctor?.full_name} has been submitted.
              You will receive a confirmation once the doctor approves.
            </CardDescription>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 text-sm">
              <p><strong>Date:</strong> {selectedDate?.toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Doctor:</strong> {doctor?.full_name}</p>
            </div>
            <Button onClick={() => navigate('/telemed')} className="w-full">
              Back to Chatbot
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/telemed')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chatbot
        </Button>

        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Book Appointment</CardTitle>
            <CardDescription>
              Schedule an appointment with Dr. {doctor?.full_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Doctor Info */}
            <div className="bg-sky-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-sky-100 dark:bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-sky-600">
                    {doctor?.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{doctor?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{doctor?.specialty}</p>
                  {doctor?.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {doctor.location}
                    </div>
                  )}
                  {doctor?.consultation_fee && (
                    <p className="text-sm font-medium text-sky-600 mt-2">
                      Consultation: TZS {doctor.consultation_fee.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Select Date *
                </Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border mx-auto"
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Select Time *
                </Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patient Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+255 xxx xxx xxx"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific concerns or symptoms..."
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-600"
                disabled={submitting}
              >
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TelemedBooking;
