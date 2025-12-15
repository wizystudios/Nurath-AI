import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Organization } from '@/types/telemed';

interface DoctorFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SPECIALTIES = [
  'General Practitioner',
  'Dentist',
  'Pediatrician',
  'Cardiologist',
  'Dermatologist',
  'Orthopedic',
  'Gynecologist',
  'Neurologist',
  'Psychiatrist',
  'ENT Specialist',
  'Ophthalmologist',
  'Surgeon',
  'Other',
];

const DoctorForm: React.FC<DoctorFormProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [formData, setFormData] = useState({
    full_name: '',
    specialty: '',
    bio: '',
    phone: '',
    email: '',
    location: '',
    consultation_fee: '',
    organization_id: '',
    is_private: false,
    is_approved: true,
  });

  // Doctor account credentials
  const [createAccount, setCreateAccount] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .in('type', ['hospital', 'polyclinic'])
      .eq('is_approved', true);
    
    setOrganizations((data as Organization[]) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.specialty) {
      toast.error('Name and specialty are required');
      return;
    }

    setLoading(true);

    try {
      let userId = null;

      // Create doctor account if requested
      if (createAccount && doctorEmail && doctorPassword) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: doctorEmail,
          password: doctorPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/telemed/auth`,
            data: {
              full_name: formData.full_name,
            },
          },
        });

        if (authError) {
          console.error('Auth error:', authError);
          toast.warning('Failed to create doctor account, continuing without it');
        } else if (authData.user) {
          userId = authData.user.id;
          
          // Assign doctor role
          await supabase.from('user_roles').insert({
            user_id: userId,
            role: 'doctor',
            organization_id: formData.organization_id || null,
          });
        }
      }

      // Create doctor record
      const { error: doctorError } = await supabase.from('doctors').insert({
        user_id: userId,
        organization_id: formData.organization_id || null,
        full_name: formData.full_name,
        specialty: formData.specialty,
        bio: formData.bio || null,
        phone: formData.phone || null,
        email: formData.email || doctorEmail || null,
        location: formData.location || null,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        is_private: formData.is_private,
        is_approved: formData.is_approved,
      });

      if (doctorError) throw doctorError;

      toast.success('Doctor registered successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Failed to register doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Doctor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Dr. John Doe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty *</Label>
              <Select
                value={formData.specialty}
                onValueChange={(value) => setFormData({ ...formData, specialty: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description about the doctor..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+255 xxx xxx xxx"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Dar es Salaam"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fee">Consultation Fee (TZS)</Label>
              <Input
                id="fee"
                type="number"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                placeholder="50000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={formData.is_private}
                onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked, organization_id: checked ? '' : formData.organization_id })}
              />
              <Label htmlFor="private">Private Practice (No Hospital)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="approved"
                checked={formData.is_approved}
                onCheckedChange={(checked) => setFormData({ ...formData, is_approved: checked })}
              />
              <Label htmlFor="approved">Approved</Label>
            </div>
          </div>

          {!formData.is_private && (
            <div className="space-y-2">
              <Label htmlFor="org">Hospital / Polyclinic</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Account Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="createAccount"
                checked={createAccount}
                onCheckedChange={setCreateAccount}
              />
              <Label htmlFor="createAccount">Create Doctor Login Account</Label>
            </div>

            {createAccount && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="doctorEmail">Login Email *</Label>
                  <Input
                    id="doctorEmail"
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="doctor@login.com"
                    required={createAccount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorPassword">Password *</Label>
                  <Input
                    id="doctorPassword"
                    type="password"
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required={createAccount}
                    minLength={6}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Doctor'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorForm;
