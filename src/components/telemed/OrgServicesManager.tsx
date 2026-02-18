import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';
import { OrgService } from '@/types/telemed';

interface OrgServicesManagerProps {
  organizationId: string;
}

const CATEGORIES = ['General','Dental','Maternity','Imaging','Cardiology','Pediatrics','Surgery','Emergency','Ambulance','Laboratory','Pharmacy','Physiotherapy','Other'];

const OrgServicesManager: React.FC<OrgServicesManagerProps> = ({ organizationId }) => {
  const [services, setServices] = useState<OrgService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OrgService | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: '', price: '', is_available: true, duration_minutes: '',
  });

  useEffect(() => { fetchServices(); }, [organizationId]);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('org_services')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (!error) setServices((data as OrgService[]) || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: '', price: '', is_available: true, duration_minutes: '' });
    setShowForm(true);
  };

  const openEdit = (svc: OrgService) => {
    setEditing(svc);
    setForm({
      name: svc.name,
      description: svc.description || '',
      category: svc.category || '',
      price: svc.price?.toString() || '',
      is_available: svc.is_available,
      duration_minutes: svc.duration_minutes?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Service name is required'); return; }
    setSaving(true);
    const payload = {
      organization_id: organizationId,
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      price: form.price ? parseFloat(form.price) : null,
      is_available: form.is_available,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
    };

    const { error } = editing
      ? await supabase.from('org_services').update(payload).eq('id', editing.id)
      : await supabase.from('org_services').insert(payload);

    if (error) toast.error('Failed to save service');
    else { toast.success(editing ? 'Service updated' : 'Service added'); setShowForm(false); fetchServices(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    const { error } = await supabase.from('org_services').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Service deleted'); fetchServices(); }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Services ({services.length})</h3>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No services added yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {services.map(svc => (
            <Card key={svc.id} className={!svc.is_available ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{svc.name}</span>
                      {svc.category && <Badge variant="outline" className="text-xs"><Tag className="h-3 w-3 mr-1" />{svc.category}</Badge>}
                      {!svc.is_available && <Badge variant="secondary" className="text-xs">Unavailable</Badge>}
                    </div>
                    {svc.description && <p className="text-sm text-muted-foreground mt-1">{svc.description}</p>}
                    <div className="flex gap-4 mt-2 text-sm">
                      {svc.price != null && <span className="font-semibold text-primary">TZS {svc.price.toLocaleString()}</span>}
                      {svc.duration_minutes && <span className="text-muted-foreground">{svc.duration_minutes} min</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(svc)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(svc.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Dental Checkup" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price (TZS)</Label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} placeholder="30" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_available} onCheckedChange={v => setForm({ ...form, is_available: v })} />
              <Label>Available</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Update' : 'Add Service'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgServicesManager;
