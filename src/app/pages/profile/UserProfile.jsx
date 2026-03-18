import { useState } from 'react';
import { Eye, EyeOff, Lock, Save, User } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../lib/toast';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';

export default function UserProfile() {
  const role = useRoleFromPath();
  const menuItems = useDashboardMenu(role);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);

  const handleSavePersonalInfo = () => {
    toast.success('Personal information saved successfully.', {
      title: 'Profile Updated',
      details: 'Your full name, email, and phone number are now up to date.',
    });
  };

  const handleChangePassword = () => {
    toast.success('Your password has been updated.', {
      title: 'Password Changed',
      details: 'Use the new password next time you log in.',
    });
  };

  const handleSavePreferences = () => {
    toast.info('Notification settings were applied.', {
      title: 'Preferences Saved',
      details: 'You can return here anytime to adjust alerts and communication.',
    });
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole={role}>
      <div className="min-h-screen px-4 pb-8 pt-0">
        <div className="mx-auto max-w-4xl -mt-4">

          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <h1 className="text-4xl font-bold text-gray-900">User Profile</h1>
              <span className="text-3xl text-purple-500">✨</span>
            </div>
            <p className="text-gray-600">Manage your account settings and preferences.</p>
          </div>

          <div className="space-y-8 rounded-2xl bg-white p-8 shadow-lg">
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                <User className="h-5 w-5 text-purple-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="fullName" className="font-medium text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    defaultValue="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    defaultValue="john.doe@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    defaultValue="01234567890"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSavePersonalInfo}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 font-semibold text-white shadow-md animate-pulse transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  Save Personal Information
                </button>
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                <Lock className="h-5 w-5 text-purple-600" />
                Change Password
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currentPassword" className="font-medium text-gray-700">
                    Current Password
                  </Label>
                  <div className="relative mt-1">
                    <Input id="currentPassword" type="password" placeholder="........" className="pr-10" />
                  </div>
                </div>
                <div />
                <div>
                  <Label htmlFor="newPassword" className="font-medium text-gray-700">
                    New Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="........"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="........"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 font-semibold text-white shadow-md animate-pulse transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>

            <div>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
                <span className="text-purple-600">⚙️</span>
                User Preferences
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">System Notifications</p>
                    <p className="text-sm text-gray-500">Receive system alerts in the app</p>
                  </div>
                  <Switch checked={systemNotifications} onCheckedChange={setSystemNotifications} />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 font-semibold text-white shadow-md animate-pulse transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-600">
            Need help?{' '}
            <a href="#" className="font-medium text-purple-600 hover:text-purple-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

