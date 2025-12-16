import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Pill, LogOut, Heart, Loader2, Package, AlertCircle } from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Organization } from '@/types/telemed';
import MedicineManager from '@/components/telemed/MedicineManager';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isOrgAdmin, loading, signOut } = useTelemedAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, lowStock: 0 });

  useEffect(() => {
    if (!loading && (!user || !isOrgAdmin())) {
      toast.error('Access denied.');
      navigate('/telemed/auth');
    }
  }, [user, loading, isOrgAdmin]);

  useEffect(() => {
    if (user && userRole?.organization_id) {
      fetchOrganization();
      fetchStats();
    }
  }, [user, userRole]);

  const fetchOrganization = async () => {
    if (!userRole?.organization_id) return;
    
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userRole.organization_id)
      .single();

    if (data) {
      setOrganization(data as Organization);
    }
    setOrgLoading(false);
  };

  const fetchStats = async () => {
    if (!userRole?.organization_id) return;
    
    const { data } = await supabase
      .from('medicines')
      .select('*')
      .eq('organization_id', userRole.organization_id);

    if (data) {
      setStats({
        total: data.length,
        available: data.filter(m => m.is_available).length,
        lowStock: data.filter(m => (m.stock || 0) < 10).length,
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/telemed/auth');
  };

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">{organization?.name || 'Pharmacy'}</h1>
              <p className="text-xs text-muted-foreground">Pharmacy Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Medicines</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Pill className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medicine Inventory</CardTitle>
            <CardDescription>Manage your pharmacy's medicine stock</CardDescription>
          </CardHeader>
          <CardContent>
            {userRole?.organization_id && (
              <MedicineManager organizationId={userRole.organization_id} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PharmacyDashboard;
