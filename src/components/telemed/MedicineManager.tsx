import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pill, Edit, Trash2, Loader2, Package, AlertCircle } from 'lucide-react';
import { Medicine } from '@/types/telemed';

interface MedicineManagerProps {
  organizationId: string;
}

const MedicineManager: React.FC<MedicineManagerProps> = ({ organizationId }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    price: '',
    stock: '',
    expiry_date: '',
    is_available: true,
  });

  useEffect(() => {
    fetchMedicines();
  }, [organizationId]);

  const fetchMedicines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines');
    } else {
      setMedicines((data as Medicine[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: '',
      price: '',
      stock: '',
      expiry_date: '',
      is_available: true,
    });
    setEditingMedicine(null);
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      description: medicine.description || '',
      type: medicine.type || '',
      price: medicine.price?.toString() || '',
      stock: medicine.stock.toString(),
      expiry_date: medicine.expiry_date || '',
      is_available: medicine.is_available,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    const medicineData = {
      organization_id: organizationId,
      name: formData.name,
      description: formData.description || null,
      type: formData.type || null,
      price: formData.price ? parseFloat(formData.price) : null,
      stock: parseInt(formData.stock) || 0,
      expiry_date: formData.expiry_date || null,
      is_available: formData.is_available,
    };

    try {
      if (editingMedicine) {
        const { error } = await supabase
          .from('medicines')
          .update(medicineData)
          .eq('id', editingMedicine.id);
        if (error) throw error;
        toast.success('Medicine updated');
      } else {
        const { error } = await supabase.from('medicines').insert(medicineData);
        if (error) throw error;
        toast.success('Medicine added');
      }

      setShowForm(false);
      resetForm();
      fetchMedicines();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    const { error } = await supabase.from('medicines').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete medicine');
    } else {
      toast.success('Medicine deleted');
      fetchMedicines();
    }
  };

  const toggleAvailability = async (medicine: Medicine) => {
    const { error } = await supabase
      .from('medicines')
      .update({ is_available: !medicine.is_available })
      .eq('id', medicine.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchMedicines();
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-col sm:flex-row">
        <Input
          placeholder="Search medicines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      {filteredMedicines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No medicines found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicines.map((medicine) => {
            const isLowStock = medicine.stock < 10;
            const isExpiringSoon = medicine.expiry_date && 
              new Date(medicine.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <Card key={medicine.id} className={!medicine.is_available ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Pill className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{medicine.name}</h3>
                        {medicine.type && (
                          <Badge variant="outline" className="text-xs">{medicine.type}</Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={medicine.is_available}
                      onCheckedChange={() => toggleAvailability(medicine)}
                    />
                  </div>

                  {medicine.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {medicine.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {medicine.price && (
                      <Badge className="bg-green-500">TZS {medicine.price.toLocaleString()}</Badge>
                    )}
                    <Badge variant={isLowStock ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {medicine.stock} in stock
                    </Badge>
                  </div>

                  {isExpiringSoon && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
                      <AlertCircle className="h-3 w-3" />
                      Expires: {new Date(medicine.expiry_date!).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(medicine)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(medicine.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMedicine ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Medicine name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Antibiotic"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (TZS)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Medicine description..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
              <Label>Available for sale</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMedicine ? 'Update' : 'Add'} Medicine
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicineManager;
