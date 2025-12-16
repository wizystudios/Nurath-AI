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
import { Plus, HelpCircle, Edit, Trash2, Loader2, Tag } from 'lucide-react';
import { ChatbotFaq } from '@/types/telemed';

const FAQManager: React.FC = () => {
  const [faqs, setFaqs] = useState<ChatbotFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<ChatbotFaq | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    keywords: '',
    category: '',
    is_active: true,
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chatbot_faqs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
    } else {
      setFaqs((data as ChatbotFaq[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      keywords: '',
      category: '',
      is_active: true,
    });
    setEditingFaq(null);
  };

  const handleEdit = (faq: ChatbotFaq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords.join(', '),
      category: faq.category || '',
      is_active: faq.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question || !formData.answer) {
      toast.error('Question and answer are required');
      return;
    }

    const keywords = formData.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k);

    const faqData = {
      question: formData.question,
      answer: formData.answer,
      keywords,
      category: formData.category || null,
      is_active: formData.is_active,
    };

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from('chatbot_faqs')
          .update(faqData)
          .eq('id', editingFaq.id);
        if (error) throw error;
        toast.success('FAQ updated');
      } else {
        const { error } = await supabase.from('chatbot_faqs').insert(faqData);
        if (error) throw error;
        toast.success('FAQ added');
      }

      setShowForm(false);
      resetForm();
      fetchFaqs();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    const { error } = await supabase.from('chatbot_faqs').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete FAQ');
    } else {
      toast.success('FAQ deleted');
      fetchFaqs();
    }
  };

  const toggleActive = async (faq: ChatbotFaq) => {
    const { error } = await supabase
      .from('chatbot_faqs')
      .update({ is_active: !faq.is_active })
      .eq('id', faq.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchFaqs();
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.keywords.some((k) => k.includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-col sm:flex-row">
        <Input
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {filteredFaqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No FAQs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <Card key={faq.id} className={!faq.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="h-4 w-4 text-sky-500 flex-shrink-0" />
                      <h3 className="font-semibold">{faq.question}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>
                    <div className="flex flex-wrap gap-2">
                      {faq.category && (
                        <Badge variant="outline">{faq.category}</Badge>
                      )}
                      {faq.keywords.slice(0, 5).map((keyword, i) => (
                        <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {keyword}
                        </Badge>
                      ))}
                      {faq.keywords.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{faq.keywords.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Switch
                      checked={faq.is_active}
                      onCheckedChange={() => toggleActive(faq)}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(faq)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(faq.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Question *</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., What are your opening hours?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Answer *</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="The answer to the question..."
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="e.g., hours, open, time, schedule"
              />
              <p className="text-xs text-muted-foreground">
                Keywords help the chatbot match this FAQ to user questions
              </p>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., General, Appointments, Services"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingFaq ? 'Update' : 'Add'} FAQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FAQManager;
