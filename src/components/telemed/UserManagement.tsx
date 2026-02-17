import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Eye, Trash2, RefreshCw, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TelemedRole } from '@/types/telemed';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: TelemedRole | null;
  role_id: string | null;
  organization_id: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500 text-white',
  org_admin: 'bg-blue-500 text-white',
  doctor: 'bg-green-500 text-white',
  patient: 'bg-primary/20 text-primary',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  doctor: 'Doctor',
  patient: 'Patient',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Map profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = (roles || []).find((r) => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.full_name || 'Unknown',
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: (userRole?.role as TelemedRole) || null,
          role_id: userRole?.id || null,
          organization_id: userRole?.organization_id || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const changeRole = async (userId: string, newRole: TelemedRole, existingRoleId: string | null) => {
    try {
      if (existingRoleId) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('id', existingRoleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Failed to update role');
    }
  };

  const deleteUserRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to remove this user\'s role?')) return;
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      toast.error('Failed to remove role');
    } else {
      toast.success('Role removed');
      fetchUsers();
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users ({users.length})
        </h2>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Input
        placeholder="Search users by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {(user.full_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{user.full_name || 'Unknown'}</h3>
                    {user.role && (
                      <Badge className={`${ROLE_COLORS[user.role]} mt-1`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    )}
                    {!user.role && (
                      <Badge variant="outline" className="mt-1">No Role</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Select
                    value={user.role || ''}
                    onValueChange={(value) => changeRole(user.id, value as TelemedRole, user.role_id)}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Assign Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="org_admin">Org Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {user.role_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => deleteUserRole(user.role_id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
