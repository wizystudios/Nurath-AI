import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pill, Loader2, Package, AlertCircle,
  ShoppingCart, CheckCircle, Clock, Truck, XCircle,
} from 'lucide-react';
import { useTelemedAuth } from '@/hooks/useTelemedAuth';
import { Organization } from '@/types/telemed';
import MedicineManager from '@/components/telemed/MedicineManager';
import DashboardShell from '@/components/DashboardShell';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, isOrgAdmin, loading, signOut } = useTelemedAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, lowStock: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!loading && (!user || !isOrgAdmin())) { toast.error('Access denied.'); navigate('/auth'); }
  }, [user, loading, isOrgAdmin]);

  useEffect(() => {
    if (user && userRole?.organization_id) { fetchOrganization(); fetchStats(); fetchOrders(); }
  }, [user, userRole]);

  // Real-time orders
  useEffect(() => {
    if (!userRole?.organization_id) return;
    const channel = supabase.channel('pharmacy-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacy_orders', filter: `organization_id=eq.${userRole.organization_id}` }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userRole]);

  const fetchOrganization = async () => {
    const { data } = await supabase.from('organizations').select('*').eq('id', userRole!.organization_id!).single();
    if (data) setOrganization(data as Organization);
    setOrgLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase.from('medicines').select('*').eq('organization_id', userRole!.organization_id!);
    if (data) setStats({ total: data.length, available: data.filter(m => m.is_available).length, lowStock: data.filter(m => (m.stock || 0) < 10).length });
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('pharmacy_orders').select('*, items:pharmacy_order_items(*, medicine:medicines(name))').eq('organization_id', userRole!.organization_id!).order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('pharmacy_orders').update({ status }).eq('id', orderId);
    if (error) toast.error('Failed to update');
    else {
      toast.success('Order updated');
      const order = orders.find(o => o.id === orderId);
      if (order?.patient_id) {
        await supabase.from('notifications').insert({
          user_id: order.patient_id, title: `Order ${status}`,
          message: `Your pharmacy order has been ${status}.`, type: 'info',
        });
      }
      fetchOrders();
    }
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };

  if (loading || orgLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const processingOrders = orders.filter(o => o.status === 'processing');

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center"><Pill className="h-4 w-4 text-green-500" /></div>
            <div>
              <h1 className="text-sm font-semibold">{organization?.name || 'Pharmacy'}</h1>
              <p className="text-xs text-muted-foreground">Pharmacy Dashboard</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Medicines</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{stats.available}</p><p className="text-xs text-muted-foreground">Available</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-orange-600">{stats.lowStock}</p><p className="text-xs text-muted-foreground">Low Stock</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-yellow-600">{pendingOrders.length}</p><p className="text-xs text-muted-foreground">New Orders</p></CardContent></Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="orders" className="relative">
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Orders
                {pendingOrders.length > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">{pendingOrders.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="inventory"><Package className="h-3.5 w-3.5 mr-1.5" />Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-3">
              {orders.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No orders yet</CardContent></Card>
              ) : (
                orders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{order.patient_name || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                          {order.delivery_method && <Badge variant="outline" className="text-xs mt-1">{order.delivery_method}</Badge>}
                        </div>
                        <div className="text-right">
                          <Badge className={order.status === 'pending' ? 'bg-yellow-500 text-white' : order.status === 'processing' ? 'bg-blue-500 text-white' : order.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>{order.status}</Badge>
                          {order.total_amount > 0 && <p className="text-sm font-medium mt-1">TZS {Number(order.total_amount).toLocaleString()}</p>}
                        </div>
                      </div>
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-sm bg-muted/50 p-2 rounded mt-1 flex justify-between">
                          <span>{item.medicine?.name || item.medicine_name} x{item.quantity}</span>
                          <span className="text-muted-foreground">TZS {Number(item.unit_price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                      {order.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateOrderStatus(order.id, 'processing')}>Accept</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>Reject</Button>
                        </div>
                      )}
                      {order.status === 'processing' && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>Mark Ready</Button>
                          <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, 'delivered')}><Truck className="h-3 w-3 mr-1" />Delivered</Button>
                        </div>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" className="mt-3" onClick={() => updateOrderStatus(order.id, 'delivered')}><Truck className="h-3 w-3 mr-1" />Mark Delivered</Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="inventory">
              {userRole?.organization_id && <MedicineManager organizationId={userRole.organization_id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
