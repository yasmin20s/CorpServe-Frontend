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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}/>
            </div>

            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={profile.currentPassword} onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={profile.newPassword} onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={profile.confirmPassword} onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}/>
            </div>

            <Button onClick={() => toast.success('Password updated!')}>Update Password</Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}/>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>In-App Notifications</Label>
                <p className="text-sm text-gray-600">Receive in-app notifications</p>
              </div>
              <Switch checked={notifications.inApp} onCheckedChange={(checked) => setNotifications({ ...notifications, inApp: checked })}/>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>New Proposals</Label>
                <p className="text-sm text-gray-600">Get notified when you receive new proposals</p>
              </div>
              <Switch checked={notifications.proposals} onCheckedChange={(checked) => setNotifications({ ...notifications, proposals: checked })}/>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Deadline Warnings</Label>
                <p className="text-sm text-gray-600">Get notified about approaching deadlines</p>
              </div>
              <Switch checked={notifications.deadlines} onCheckedChange={(checked) => setNotifications({ ...notifications, deadlines: checked })}/>
            </div>

            <Button onClick={handleSaveNotifications}>Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}
