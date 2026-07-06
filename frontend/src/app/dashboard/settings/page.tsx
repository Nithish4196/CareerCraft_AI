"use client";

import React, { useState, useEffect } from"react";
import { useAuth } from"@/context/AuthContext";
import { useTheme } from"@/context/ThemeContext";
import { doc, updateDoc, collection, getDocs, deleteDoc } from"firebase/firestore";
import { db } from"@/lib/firebase";
import toast from"react-hot-toast";
import { 
  User, Mail, Calendar, LogOut, Trash2, Save, Download, RotateCcw,
  Moon, Sun, Monitor, Type, Layout, Bell, Briefcase, Zap, Eye, BarChart, X
} from"lucide-react";
import { DEFAULT_SETTINGS, UserSettings } from"@/lib/auth";
import UserAvatar from"@/components/ui/UserAvatar";
import AvatarSelector from"@/components/ui/AvatarSelector";

// Reusable Settings Card Wrapper
const SettingsCard = ({ title, description, children, icon: Icon }: any) => (
  <div className="bg-background rounded-xl border border-muted shadow-sm overflow-hidden mb-6">
    <div className="p-6 border-b border-muted flex items-start gap-4">
      {Icon && (
        <div className="p-3 bg-primary/10 text-primary rounded-lg">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Toggle Switch Component
const Toggle = ({ checked, onChange, label, description }: any) => (
  <div className="flex items-center justify-between py-3">
    <div className="pr-4">
      <div className="font-medium">{label}</div>
      {description && <div className="text-sm text-muted-foreground mt-0.5">{description}</div>}
    </div>
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="sr-only">Toggle {label}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default function AppSettingsPage() {
  const { user, userProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Local state for forms
  const [accountDraft, setAccountDraft] = useState({ fullName:"", phoneNumber:"", location:"" });
  const [careerDraft, setCareerDraft] = useState({ role:"", targetRole:"", experience:"", skills: [] as string[] });
  
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  // Save button states
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavedAccount, setIsSavedAccount] = useState(false);
  const [isSavingCareer, setIsSavingCareer] = useState(false);
  const [isSavedCareer, setIsSavedCareer] = useState(false);
  
  // Initialize drafts when profile loads
  useEffect(() => {
    if (userProfile) {
      setAccountDraft({
        fullName: userProfile.fullName ||"",
        phoneNumber: userProfile.phoneNumber ||"",
        location: userProfile.location ||"",
      });
      setCareerDraft({
        role: userProfile.role ||"",
        targetRole: userProfile.targetRole ||"",
        experience: userProfile.experience ||"",
        skills: userProfile.skills || [],
      });
    }
  }, [userProfile]);

  // Handle Unsaved Changes warning (simple version for now)
  const hasUnsavedAccount = userProfile && (
    accountDraft.fullName !== userProfile.fullName ||
    accountDraft.phoneNumber !== (userProfile.phoneNumber ||"") ||
    accountDraft.location !== (userProfile.location ||"")
  );

  const hasUnsavedCareer = userProfile && (
    careerDraft.role !== (userProfile.role ||"") ||
    careerDraft.targetRole !== (userProfile.targetRole ||"") ||
    careerDraft.experience !== (userProfile.experience ||"") ||
    JSON.stringify(careerDraft.skills) !== JSON.stringify(userProfile.skills || [])
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedAccount || hasUnsavedCareer) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedAccount, hasUnsavedCareer]);

  if (!user || !userProfile) return null;

  // Safe accessor for settings
  const settings: UserSettings = userProfile.settings || DEFAULT_SETTINGS;

  // --- Handlers ---
  
  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      await updateDoc(doc(db,"users", user.uid), {
        fullName: accountDraft.fullName,
        phoneNumber: accountDraft.phoneNumber,
        location: accountDraft.location
      });
      setIsSavedAccount(true);
      setTimeout(() => setIsSavedAccount(false), 1500);
    } catch (error) {
      toast.error("Failed to save changes.");
    }
    setIsSavingAccount(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateDoc(doc(db,"users", user.uid), {
        avatarType: "initials",
        avatarValue: ""
      });
      toast.success("Avatar removed.");
    } catch (err) {
      toast.error("Failed to remove avatar.");
    }
  };

  const handleSaveCareer = async () => {
    setIsSavingCareer(true);
    try {
      await updateDoc(doc(db,"users", user.uid), {
        role: careerDraft.role,
        targetRole: careerDraft.targetRole,
        experience: careerDraft.experience,
        skills: careerDraft.skills
      });
      setIsSavedCareer(true);
      setTimeout(() => setIsSavedCareer(false), 1500);
    } catch (error) {
      toast.error("Failed to save changes.");
    }
    setIsSavingCareer(false);
  };

  // Generic settings updater (instant save)
  const updateSetting = async (category: keyof UserSettings, key: string, value: any) => {
    try {
      const newSettings = { ...settings };
      // @ts-ignore - dynamic indexing
      newSettings[category] = { ...newSettings[category], [key]: value };
      
      await updateDoc(doc(db,"users", user.uid), {
        settings: newSettings
      });
      toast.success("Preference saved", { duration: 2000, position: 'bottom-right' });
    } catch (error) {
      toast.error("Failed to update setting");
    }
  };

  const handleResetHeatmap = async () => {
    if (!confirm("This will clear your activity history and streaks. This cannot be undone. Proceed?")) return;
    
    try {
      const logRef = collection(db, `users/${user.uid}/activityLog`);
      const snapshot = await getDocs(logRef);
      
      const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, `users/${user.uid}/activityLog`, document.id)));
      await Promise.all(deletePromises);
      
      toast.success("Activity Heatmap has been reset.");
    } catch (error) {
      toast.error("Failed to reset heatmap.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('To permanently delete your account, type"DELETE" below:');
    if (confirmation ==="DELETE") {
      try {
        // First delete from Firestore
        await deleteDoc(doc(db,"users", user.uid));
        // Then delete Auth user (this requires recent login)
        await user.delete();
        toast.success("Account deleted permanently.");
        // Router will redirect due to AuthContext listener
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          toast.error("Please sign out and sign in again to delete your account.");
        } else {
          toast.error("Failed to delete account:" + error.message);
        }
      }
    }
  };

  // Helper for date
  let createdDateStr ="Unknown";
  if (userProfile.createdAt) {
    const d = typeof userProfile.createdAt === 'object' && 'seconds' in userProfile.createdAt 
      ? new Date(userProfile.createdAt.seconds * 1000)
      : new Date(userProfile.createdAt);
    createdDateStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Common styles
  const inputClass ="w-full bg-background border border-muted rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account, preferences, and app behavior</p>
      </div>

      {/* CARD 1: Account Information */}
      <SettingsCard 
        title="Account Information" 
        description="Update your personal details and contact info."
        icon={User}
      >
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Read Only Info */}
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
              <UserAvatar profile={userProfile} user={user} className="w-24 h-24 text-3xl shadow-lg ring-4 ring-background" />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-bold">Change</span>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg mb-2">{userProfile.fullName}</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="text-xs font-bold bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-full transition-colors"
                >
                  Change Photo
                </button>
                {(userProfile.avatarType && userProfile.avatarType !== "initials") && (
                  <button 
                    onClick={handleRemoveAvatar}
                    className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 mt-3 text-sm">
                <Mail className="w-4 h-4" /> {user.email}
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 mt-1 text-sm">
                <Calendar className="w-4 h-4" /> Member since {createdDateStr}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
            <input 
              type="text" 
              className={inputClass}
              value={accountDraft.fullName}
              onChange={e => setAccountDraft({...accountDraft, fullName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number (Optional)</label>
            <input 
              type="text" 
              className={inputClass}
              value={accountDraft.phoneNumber}
              onChange={e => setAccountDraft({...accountDraft, phoneNumber: e.target.value})}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Location</label>
            <input 
              type="text" 
              className={inputClass}
              value={accountDraft.location}
              onChange={e => setAccountDraft({...accountDraft, location: e.target.value})}
              placeholder="e.g. San Francisco, CA"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveAccount}
            disabled={(!hasUnsavedAccount && !isSavedAccount) || isSavingAccount}
            className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors ${
              isSavedAccount 
                ? 'bg-green-500 text-white' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isSavedAccount ? (
              <>Saved ✓</>
            ) : isSavingAccount ? (
              <>Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </SettingsCard>

      {/* CARD 2: Career Profile */}
      <SettingsCard 
        title="Career Profile" 
        description="These fields sync with your Career Roadmap and Mock Interviews."
        icon={Briefcase}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Current Role / Background</label>
            <input 
              type="text" 
              className={inputClass}
              value={careerDraft.role}
              onChange={e => setCareerDraft({...careerDraft, role: e.target.value})}
              placeholder="e.g. Computer Science Student"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Target Role</label>
            <input 
              type="text" 
              className={inputClass}
              value={careerDraft.targetRole}
              onChange={e => setCareerDraft({...careerDraft, targetRole: e.target.value})}
              placeholder="e.g. Full Stack Developer"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Experience Level</label>
            <div className="flex flex-wrap gap-3">
              {['Student', 'Fresher', 'Junior', 'Mid', 'Senior'].map(level => (
                <button
                  key={level}
                  onClick={() => setCareerDraft({...careerDraft, experience: level})}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    careerDraft.experience === level 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-foreground border-muted hover:border-primary/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Simple skills input for now */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Skills (comma separated)</label>
            <input 
              type="text" 
              className={inputClass}
              value={careerDraft.skills.join(', ')}
              onChange={e => setCareerDraft({...careerDraft, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
              placeholder="React, Node.js, Python..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveCareer}
            disabled={(!hasUnsavedCareer && !isSavedCareer) || isSavingCareer}
            className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-colors ${
              isSavedCareer 
                ? 'bg-green-500 text-white' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isSavedCareer ? (
              <>Saved ✓</>
            ) : isSavingCareer ? (
              <>Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </SettingsCard>

      {/* CARD 3: Appearance */}
      <SettingsCard 
        title="Appearance" 
        description="Customize the look and feel of CareerCraft AI."
        icon={Layout}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">Theme Preference</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
              >
                <Sun className="w-8 h-8 text-amber-500" />
                <span className="font-medium">Light</span>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
              >
                <Moon className="w-8 h-8 text-blue-400" />
                <span className="font-medium">Dark</span>
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`flex-1 flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}
              >
                <Monitor className="w-8 h-8 text-slate-400" />
                <span className="font-medium">System</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-muted">
            <label className="block text-sm font-medium text-muted-foreground mb-3">Font Size</label>
            <div className="flex items-center justify-between mb-2 px-2 text-xs text-muted-foreground">
              <span>Small</span>
              <span>Default</span>
              <span>Large</span>
              <span>Extra Large</span>
            </div>
            <input 
              type="range" 
              min="0" max="3" step="1" 
              className="w-full accent-primary"
              value={['Small', 'Default', 'Large', 'Extra Large'].indexOf(settings.appearance.fontSize)}
              onChange={(e) => {
                const sizes = ['Small', 'Default', 'Large', 'Extra Large'];
                updateSetting('appearance', 'fontSize', sizes[Number(e.target.value)]);
              }}
            />
            <div className="mt-4 p-4 bg-muted/30 rounded-lg text-center">
              <p>This is a live preview of your font size setting.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-muted">
             <Toggle 
              label="Compact Mode" 
              description="Reduces padding and spacing across all dashboard components."
              checked={settings.appearance.compactMode}
              onChange={(val: boolean) => updateSetting('appearance', 'compactMode', val)}
            />
          </div>
        </div>
      </SettingsCard>

      {/* CARD 4: Notifications */}
      <SettingsCard 
        title="Notifications" 
        description="Manage what emails and alerts you receive."
        icon={Bell}
      >
        <div className="space-y-1 divide-y divide-muted">
          <Toggle 
            label="Job Match Alerts" 
            checked={settings.notifications.jobMatches}
            onChange={(val: boolean) => updateSetting('notifications', 'jobMatches', val)}
          />
          <Toggle 
            label="Weekly Progress Summary" 
            checked={settings.notifications.weeklyProgress}
            onChange={(val: boolean) => updateSetting('notifications', 'weeklyProgress', val)}
          />
          <Toggle 
            label="Product Updates & Announcements" 
            checked={settings.notifications.productUpdates}
            onChange={(val: boolean) => updateSetting('notifications', 'productUpdates', val)}
          />
        </div>
      </SettingsCard>

      {/* CARD 5: AI Assistant Preferences */}
      <SettingsCard 
        title="AI Assistant Preferences" 
        description="Customize how the CareerCraft AI interacts with you."
        icon={Zap}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">AI Tone</label>
            <div className="flex flex-wrap gap-3">
              {['Professional', 'Friendly', 'Direct', 'Motivational'].map(tone => (
                <button
                  key={tone}
                  onClick={() => updateSetting('aiPreferences', 'tone', tone)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    settings.aiPreferences.tone === tone 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-foreground border-muted hover:border-primary/50'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">Response Length</label>
            <div className="flex flex-wrap gap-3">
              {['Concise', 'Balanced', 'Detailed'].map(len => (
                <button
                  key={len}
                  onClick={() => updateSetting('aiPreferences', 'responseLength', len)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    settings.aiPreferences.responseLength === len 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background text-foreground border-muted hover:border-primary/50'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-muted">
            <Toggle 
              label="Personalize Responses with Career Profile" 
              description="Allow the AI to reference your target role, skills, and roadmap progress to provide highly personalized advice."
              checked={settings.aiPreferences.useProfileData}
              onChange={(val: boolean) => updateSetting('aiPreferences', 'useProfileData', val)}
            />
          </div>
        </div>
      </SettingsCard>

      {/* CARD 6: Privacy */}
      <SettingsCard 
        title="Privacy" 
        description="Manage your data visibility."
        icon={Eye}
      >
        <div className="space-y-1 divide-y divide-muted">
          <Toggle 
            label="Show my profile on the Leaderboard" 
            checked={settings.privacy.showLeaderboard}
            onChange={(val: boolean) => updateSetting('privacy', 'showLeaderboard', val)}
          />
          <Toggle 
            label="Make Activity Heatmap Public" 
            checked={settings.privacy.showHeatmap}
            onChange={(val: boolean) => updateSetting('privacy', 'showHeatmap', val)}
          />
          <Toggle 
            label="Share data to improve CareerCraft AI" 
            description="Turning this off may reduce the accuracy of job matches and course suggestions."
            checked={settings.privacy.allowDataUsage}
            onChange={(val: boolean) => updateSetting('privacy', 'allowDataUsage', val)}
          />
        </div>
      </SettingsCard>

      {/* CARD 7: Data & Account Actions */}
      <SettingsCard 
        title="Data & Account Actions" 
        description="Manage your account data or permanently delete your profile."
        icon={Trash2}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-muted rounded-lg bg-muted/20">
            <div>
              <div className="font-bold">Reset Activity Heatmap</div>
              <div className="text-sm text-muted-foreground">Clear all activity history and streaks.</div>
            </div>
            <button 
              onClick={handleResetHeatmap}
              className="mt-3 sm:mt-0 px-4 py-2 bg-background border border-muted hover:bg-muted transition-colors duration-150 ease-out text-foreground font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" /> Reset Heatmap
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-muted rounded-lg bg-muted/20">
            <div>
              <div className="font-bold">Download My Data</div>
              <div className="text-sm text-muted-foreground">Request a copy of your personal data.</div>
            </div>
            <button 
              onClick={() => toast.success("We'll email you a copy of your data within 24 hours.")}
              className="mt-3 sm:mt-0 px-4 py-2 bg-background border border-muted hover:bg-muted transition-colors duration-150 ease-out text-foreground font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Download Data
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-muted">
            <button 
              onClick={signOut}
              className="flex-1 px-4 py-2.5 border border-muted hover:bg-muted transition-colors duration-150 ease-out text-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 transition-colors duration-150 ease-out text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* Avatar Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-muted rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6">Change Avatar</h3>
            <AvatarSelector 
              currentType={userProfile.avatarType} 
              currentValue={userProfile.avatarValue} 
              onSelect={async (type, val) => {
                try {
                  await updateDoc(doc(db,"users", user.uid), {
                    avatarType: type,
                    avatarValue: val
                  });
                  toast.success("Avatar updated successfully!");
                  setIsAvatarModalOpen(false);
                } catch (err) {
                  toast.error("Failed to update avatar");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
