import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, FlaskConical, Edit, Trash2, Loader2, Clock, DollarSign } from 'lucide-react';
import { LabTest } from '@/types/telemed';

interface LabTestManagerProps {
  organizationId: string;
}

const LabTestManager: React.FC<LabTestManagerProps> = ({ organizationId }) => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    preparation: '',
    result_time: '',
    is_available: true,
  });

  useEffect(() => {
    fetchLabTests();
  }, [organizationId]);

  const fetchLabTests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lab_tests')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching lab tests:', error);
      toast.error('Failed to load lab tests');
    } else {
      setLabTests((data as LabTest[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cost: '',
      preparation: '',
      result_time: '',
      is_available: true,
    });
    setEditingTest(null);
  };

  const handleEdit = (test: LabTest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      description: test.description || '',
      cost: test.cost?.toString() || '',
      preparation: test.preparation || '',
      result_time: test.result_time || '',
      is_available: test.is_available,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    const testData = {
      organization_id: organizationId,
      name: formData.name,
      description: formData.description || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      preparation: formData.preparation || null,
      result_time: formData.result_time || null,
      is_available: formData.is_available,
    };

    try {
      if (editingTest) {
        const { error } = await supabase
          .from('lab_tests')
          .update(testData)
          .eq('id', editingTest.id);
        if (error) throw error;
        toast.success('Test updated');
      } else {
        const { error } = await supabase.from('lab_tests').insert(testData);
        if (error) throw error;
        toast.success('Test added');
      }

      setShowForm(false);
      resetForm();
      fetchLabTests();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    const { error } = await supabase.from('lab_tests').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete test');
    } else {
      toast.success('Test deleted');
      fetchLabTests();
    }
  };

  const toggleAvailability = async (test: LabTest) => {
    const { error } = await supabase
      .from('lab_tests')
      .update({ is_available: !test.is_available })
      .eq('id', test.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchLabTests();
    }
  };

  const filteredTests = labTests.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-col sm:flex-row">
        <Input
          placeholder="Search lab tests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lab Test
        </Button>
      </div>

      {filteredTests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lab tests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <Card key={test.id} className={!test.is_available ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <FlaskConical className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{test.name}</h3>
                      {test.is_available ? (
                        <Badge className="bg-green-500 text-xs">Available</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={test.is_available}
                    onCheckedChange={() => toggleAvailability(test)}
                  />
                </div>

                {test.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {test.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {test.cost && (
                    <Badge className="bg-purple-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      TZS {test.cost.toLocaleString()}
                    </Badge>
                  )}
                  {test.result_time && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {test.result_time}
                    </Badge>
                  )}
                </div>

                {test.preparation && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Preparation:</strong> {test.preparation}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(test)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(test.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Edit Lab Test' : 'Add Lab Test'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Test Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Complete Blood Count"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost (TZS)</Label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Result Time</Label>
                <Input
                  value={formData.result_time}
                  onChange={(e) => setFormData({ ...formData, result_time: e.target.value })}
                  placeholder="e.g., 2-3 hours"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Test description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Preparation Instructions</Label>
              <Textarea
                value={formData.preparation}
                onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
                placeholder="e.g., Fasting required for 8 hours"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
              <Label>Available</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTest ? 'Update' : 'Add'} Test
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabTestManager;
