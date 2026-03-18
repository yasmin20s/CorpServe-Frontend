import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Save, User } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../lib/toast';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';
import { useAuth } from '../../hooks/useAuth';
import {
  changeCurrentUserPasswordApi,
  getCurrentUserProfileApi,
  getUserPreferencesApi,
  updateCurrentUserApi,
  updateUserPreferencesApi,
} from '../../services/userProfileApi';

export default function UserProfile() {
  const role = useRoleFromPath();
  const menuItems = useDashboardMenu(role);
  const { user, updateAuthenticatedUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [initialProfile, setInitialProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [initialPreferences, setInitialPreferences] = useState({
    emailNotification: true,
    systemNotification: true,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.token) {
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      try {
        const [profile, preferences] = await Promise.all([
          getCurrentUserProfileApi(user.token),
          getUserPreferencesApi(user.token),
        ]);

        const nextFullName = profile?.fullName || '';
        const nextEmail = profile?.email || '';
        const nextPhoneNumber = profile?.phoneNumber || '';
        const nextEmailNotification = Boolean(preferences?.emailNotification);
        const nextSystemNotification = Boolean(preferences?.systemNotification);

        setFullName(nextFullName);
        setEmail(nextEmail);
        setPhoneNumber(nextPhoneNumber);
        setEmailNotifications(nextEmailNotification);
        setSystemNotifications(nextSystemNotification);
        setInitialProfile({
          fullName: nextFullName,
          email: nextEmail,
          phoneNumber: nextPhoneNumber,
        });
        setInitialPreferences({
          emailNotification: nextEmailNotification,
          systemNotification: nextSystemNotification,
        });
      } catch (error) {
        toast.error(error.message || 'Failed to load profile data.');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfileData();
  }, [user?.token]);

  const handleSavePersonalInfo = async () => {
    if (!user?.token) {
      toast.error('You are not authorized. Please log in again.');
      return;
    }

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhoneNumber = phoneNumber.trim();
    const hasProfileChanges =
      normalizedFullName !== initialProfile.fullName.trim() ||
      normalizedEmail !== initialProfile.email.trim() ||
      normalizedPhoneNumber !== initialProfile.phoneNumber.trim();

    if (!hasProfileChanges) {
      toast.warning('No personal information changes to save.', {
        title: 'No Changes Detected',
        details: 'Edit your full name, email, or phone number first, then click save.',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateCurrentUserApi({
        fullName: normalizedFullName,
        email: normalizedEmail,
        phoneNumber: normalizedPhoneNumber,
        token: user.token,
      });

      updateAuthenticatedUser({
        fullName: normalizedFullName,
        email: normalizedEmail,
      });
      setInitialProfile({
        fullName: normalizedFullName,
        email: normalizedEmail,
        phoneNumber: normalizedPhoneNumber,
      });

      toast.success('Personal information saved successfully.', {
        title: 'Profile Updated',
        details: 'Your full name, email, and phone number are now up to date.',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to save personal information.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.token) {
      toast.error('You are not authorized. Please log in again.');
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Please fill all password fields.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeCurrentUserPasswordApi({
        currentPassword,
        newPassword,
        confirmNewPassword,
        token: user.token,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Your password has been updated.', {
        title: 'Password Changed',
        details: 'Use the new password next time you log in.',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.token) {
      toast.error('You are not authorized. Please log in again.');
      return;
    }

    const hasPreferenceChanges =
      emailNotifications !== initialPreferences.emailNotification ||
      systemNotifications !== initialPreferences.systemNotification;

    if (!hasPreferenceChanges) {
      toast.warning('No preference changes to save.', {
        title: 'No Changes Detected',
        details: 'Toggle at least one notification setting before saving.',
      });
      return;
    }

    setIsSavingPreferences(true);
    try {
      await updateUserPreferencesApi({
        emailNotification: emailNotifications,
        systemNotification: systemNotifications,
        token: user.token,
      });
      setInitialPreferences({
        emailNotification: emailNotifications,
        systemNotification: systemNotifications,
      });
      toast.info('Notification settings were applied.', {
        title: 'Preferences Saved',
        details: 'You can return here anytime to adjust alerts and communication.',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to save preferences.');
    } finally {
      setIsSavingPreferences(false);
    }
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
            {isProfileLoading && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                Loading profile data...
              </div>
            )}

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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isProfileLoading || isSavingProfile}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isProfileLoading || isSavingProfile}
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isProfileLoading || isSavingProfile}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSavePersonalInfo}
                  disabled={isProfileLoading || isSavingProfile}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 font-semibold text-white shadow-md animate-pulse transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Saving...' : 'Save Personal Information'}
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
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="........"
                      className="pr-10"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isProfileLoading || isChangingPassword}
                    />
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
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isProfileLoading || isChangingPassword}
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
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={isProfileLoading || isChangingPassword}
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
                  disabled={isProfileLoading || isChangingPassword}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 font-semibold text-white shadow-md animate-pulse transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
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
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    disabled={isProfileLoading || isSavingPreferences}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">System Notifications</p>
                    <p className="text-sm text-gray-500">Receive system alerts in the app</p>
                  </div>
                  <Switch
                    checked={systemNotifications}
                    onCheckedChange={setSystemNotifications}
                    disabled={isProfileLoading || isSavingPreferences}
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={isProfileLoading || isSavingPreferences}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 font-semibold text-white shadow-md animate-pulse transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
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

