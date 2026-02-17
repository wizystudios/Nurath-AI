import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Pill, FlaskConical, Activity, MapPin, Phone, Ban, CheckCircle, Star, Loader2, Pencil, Heart, TrendingUp } from 'lucide-react';
import { Organization, OrganizationType } from '@/types/telemed';
import OrganizationForm from './OrganizationForm';

interface OrganizationListProps {
  onRefresh: () => void;
}

const TYPE_ICONS: Record<string, any> = {
  hospital: Building2,
  pharmacy: Pill,
  lab: FlaskConical,
  polyclinic: Activity,
  clinic: Heart,
  health_center: TrendingUp,
};

const OrganizationList: React.FC<OrganizationListProps> = ({ onRefresh }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [typeFilter]);

  const fetchOrganizations = async () => {
    setLoading(true);
    let query = supabase.from('organizations').select('*').order('created_at', { ascending: false });
    
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter as OrganizationType);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } else {
      setOrganizations((data as Organization[]) || []);
    }
    setLoading(false);
  };

  const toggleApproval = async (org: Organization) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_approved: !org.is_approved })
      .eq('id', org.id);

    if (error) {
      toast.error('Failed to update organization');
    } else {
      toast.success(`Organization ${org.is_approved ? 'suspended' : 'approved'}`);
      fetchOrganizations();
      onRefresh();
    }
  };

  const toggleSuspension = async (org: Organization) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_suspended: !org.is_suspended })
      .eq('id', org.id);

    if (error) {
      toast.error('Failed to update organization');
    } else {
      toast.success(`Organization ${org.is_suspended ? 'activated' : 'suspended'}`);
      fetchOrganizations();
      onRefresh();
    }
  };

  const toggleFeatured = async (org: Organization) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_featured: !org.is_featured })
      .eq('id', org.id);

    if (error) {
      toast.error('Failed to update organization');
    } else {
      toast.success(`Featured status updated`);
      fetchOrganizations();
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.location?.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex gap-4 flex-col sm:flex-row">
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hospital">Hospitals</SelectItem>
            <SelectItem value="pharmacy">Pharmacies</SelectItem>
            <SelectItem value="lab">Labs</SelectItem>
            <SelectItem value="polyclinic">Polyclinics</SelectItem>
            <SelectItem value="clinic">Clinics</SelectItem>
            <SelectItem value="health_center">Health Centers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrgs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No organizations found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrgs.map((org) => {
            const Icon = TYPE_ICONS[org.type] || Building2;
            return (
              <Card key={org.id} className={org.is_suspended ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{org.name}</h3>
                          {org.is_featured && (
                            <Badge className="bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge variant="outline">{org.type}</Badge>
                          {org.is_approved ? (
                            <Badge className="bg-green-500 text-white">Approved</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {org.is_suspended && (
                            <Badge variant="destructive">Suspended</Badge>
                          )}
                        </div>
                        {org.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {org.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          {org.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {org.location}
                            </span>
                          )}
                          {org.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {org.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingOrg(org)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={org.is_featured ? 'default' : 'outline'}
                        onClick={() => toggleFeatured(org)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={org.is_approved ? 'outline' : 'default'}
                        onClick={() => toggleApproval(org)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={org.is_suspended ? 'destructive' : 'outline'}
                        onClick={() => toggleSuspension(org)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editingOrg && (
        <OrganizationForm
          editOrganization={editingOrg}
          onClose={() => setEditingOrg(null)}
          onSuccess={() => {
            setEditingOrg(null);
            fetchOrganizations();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default OrganizationList;
