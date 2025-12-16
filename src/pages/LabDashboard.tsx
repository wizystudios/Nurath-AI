import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { FlaskConical, LogOut, Loader2, TestTube, CheckCircle } from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Organization } from '@/types/telemed';
import LabTestManager from '@/components/telemed/LabTestManager';

const LabDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isOrgAdmin, loading, signOut } = useTelemedAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0 });

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
      .from('lab_tests')
      .select('*')
      .eq('organization_id', userRole.organization_id);

    if (data) {
      setStats({
        total: data.length,
        available: data.filter(t => t.is_available).length,
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
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white dark:bg-slate-800 border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">{organization?.name || 'Laboratory'}</h1>
              <p className="text-xs text-muted-foreground">Lab Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <TestTube className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab Tests</CardTitle>
            <CardDescription>Manage available laboratory tests</CardDescription>
          </CardHeader>
          <CardContent>
            {userRole?.organization_id && (
              <LabTestManager organizationId={userRole.organization_id} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LabDashboard;
