import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';

export default function UserProfile() {
  const role = useRoleFromPath();
  const menuItems = useDashboardMenu(role);
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john@example.com',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [notifications, setNotifications] = useState({
        email: true,
        inApp: true,
        proposals: true,
        deadlines: true,
    });
    const handleSaveProfile = () => {
        toast.success('Profile updated successfully!');
    };
    const handleSaveNotifications = () => {
        toast.success('Notification preferences saved!');
    };
    return (<DashboardLayout menuItems={menuItems} userRole={role}>
      
      <div className="max-w-4xl space-y-6">
        <div className="space-y-1">
 <div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900">
    Profile Settings
  </h1>

  {/* الخط الأزرق تحت العنوان */}
  <div className="w-24 h-1 bg-gradient-to-r from-[#6b76f6] to-[#8a8efc] rounded-full mt-2 animate-pulse" />

  <p className="text-gray-500 mt-2">
    Manage your account settings and preferences
  </p>
</div>
        </div>

{/* Profile Information */}
<Card className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
  <CardHeader>
    <CardTitle className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
      Profile Information
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 p-6 bg-white/30 backdrop-blur-md rounded-xl border border-white/20">
    <div className="space-y-2 p-4 bg-white/50 rounded-lg shadow-sm">
      <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
      <Input
        id="name"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
    </div>

    <div className="space-y-2 p-4 bg-white/50 rounded-lg shadow-sm">
      <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
      <Input
        id="email"
        type="email"
        value={profile.email}
        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
      />
    </div>

    <Button
      className="text-white px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-pulse hover:opacity-90 transition"
      onClick={handleSaveProfile}
    >
      Save Changes
    </Button>
  </CardContent>
</Card>

{/* Change Password */}
<Card className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
  <CardHeader>
    <CardTitle className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
      Change Password
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 p-6 bg-white/30 backdrop-blur-md rounded-xl border border-white/20">
    <div className="space-y-2 p-4 bg-white/50 rounded-lg shadow-sm">
      <Label htmlFor="currentPassword" className="text-gray-700 font-medium">Current Password</Label>
      <Input
        id="currentPassword"
        type="password"
        value={profile.currentPassword}
        onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
      />
    </div>

    <div className="space-y-2 p-4 bg-white/50 rounded-lg shadow-sm">
      <Label htmlFor="newPassword" className="text-gray-700 font-medium">New Password</Label>
      <Input
        id="newPassword"
        type="password"
        value={profile.newPassword}
        onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
      />
    </div>

    <div className="space-y-2 p-4 bg-white/50 rounded-lg shadow-sm">
      <Label htmlFor="confirmPassword"className="text-gray-700 font-medium">Confirm New Password</Label>
      <Input
        id="confirmPassword"
        type="password"
        value={profile.confirmPassword}
        onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
      />
    </div>

    <Button
      className="text-white px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-pulse hover:opacity-90 transition"
      onClick={() => toast.success('Password updated!')}
    >
      Update Password
    </Button>
  </CardContent>
</Card>

{/* Notification Preferences */}
<Card className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
  <CardHeader>
    <CardTitle className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200">
      Notification Preferences
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 p-6 bg-white/30 backdrop-blur-md rounded-xl border border-white/20">
    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg shadow-sm">
      <div>
        <Label>Email Notifications</Label>
        <p className="text-sm text-gray-600">Receive notifications via email</p>
      </div>
      <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}/>
    </div>

    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg shadow-sm">
      <div>
        <Label>In-App Notifications</Label>
        <p className="text-sm text-gray-600">Receive in-app notifications</p>
      </div>
      <Switch checked={notifications.inApp} onCheckedChange={(checked) => setNotifications({ ...notifications, inApp: checked })}/>
    </div>

    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg shadow-sm">
      <div>
        <Label>New Proposals</Label>
        <p className="text-sm text-gray-600">Get notified when you receive new proposals</p>
      </div>
      <Switch checked={notifications.proposals} onCheckedChange={(checked) => setNotifications({ ...notifications, proposals: checked })}/>
    </div>

    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg shadow-sm">
      <div>
        <Label>Deadline Warnings</Label>
        <p className="text-sm text-gray-600">Get notified about approaching deadlines</p>
      </div>
      <Switch checked={notifications.deadlines} onCheckedChange={(checked) => setNotifications({ ...notifications, deadlines: checked })}/>
    </div>

    <Button
      className="text-white px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-pulse hover:opacity-90 transition"
      onClick={handleSaveNotifications}
    >
      Save Preferences
    </Button>
  </CardContent>
</Card>
      </div>
    </DashboardLayout>);
}
