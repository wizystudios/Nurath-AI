import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Stethoscope, MapPin, Phone, Ban, CheckCircle, Loader2, Building2, Pencil } from 'lucide-react';
import { Doctor } from '@/types/telemed';
import DoctorForm from './DoctorForm';

interface DoctorListProps {
  onRefresh: () => void;
}

const DoctorList: React.FC<DoctorListProps> = ({ onRefresh }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('doctors')
      .select('*, organization:organizations(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } else {
      setDoctors((data as Doctor[]) || []);
    }
    setLoading(false);
  };

  const toggleApproval = async (doctor: Doctor) => {
    const { error } = await supabase
      .from('doctors')
      .update({ is_approved: !doctor.is_approved })
      .eq('id', doctor.id);

    if (error) {
      toast.error('Failed to update doctor');
    } else {
      toast.success(`Doctor ${doctor.is_approved ? 'unapproved' : 'approved'}`);
      fetchDoctors();
      onRefresh();
    }
  };

  const filteredDoctors = doctors.filter((doc) =>
    doc.full_name.toLowerCase().includes(search.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
    doc.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search doctors by name, specialty, or location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredDoctors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No doctors found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{doctor.full_name}</h3>
                        <Badge variant="outline">{doctor.specialty}</Badge>
                        {doctor.is_private && (
                          <Badge variant="secondary">Private Practice</Badge>
                        )}
                        {doctor.is_approved ? (
                          <Badge className="bg-green-500 text-white">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {doctor.is_online && (
                          <Badge className="bg-emerald-500 text-white">Online</Badge>
                        )}
                      </div>
                      
                      {doctor.organization && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {doctor.organization.name}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {doctor.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {doctor.location}
                          </span>
                        )}
                        {doctor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {doctor.phone}
                          </span>
                        )}
                        {doctor.consultation_fee && (
                          <span className="font-medium text-primary">
                            TZS {doctor.consultation_fee.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingDoctor(doctor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={doctor.is_approved ? 'outline' : 'default'}
                      onClick={() => toggleApproval(doctor)}
                    >
                      {doctor.is_approved ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingDoctor && (
        <DoctorForm
          editDoctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onSuccess={() => {
            setEditingDoctor(null);
            fetchDoctors();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default DoctorList;
