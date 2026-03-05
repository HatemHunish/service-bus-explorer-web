import { useState } from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Database, Shield, Keyboard } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/components/common/ThemeProvider';
import { toast } from '@/components/common/Toaster';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [maxMessages, setMaxMessages] = useState(100);
  const [showNotifications, setShowNotifications] = useState(true);

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('sbe-settings', JSON.stringify({
      autoRefresh,
      refreshInterval,
      maxMessages,
      showNotifications,
    }));
    toast('Settings saved successfully');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Configure your Service Bus Explorer preferences</p>
      </div>

      {/* Appearance */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <Sun className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize the look and feel</p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Select your preferred theme</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Refresh */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <Database className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Data & Refresh</h2>
            <p className="text-sm text-muted-foreground">Control data fetching behavior</p>
          </div>
        </div>
        <div className="divide-y p-4">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <div>
              <p className="font-medium">Auto-refresh</p>
              <p className="text-sm text-muted-foreground">Automatically refresh entity data</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/50" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Refresh Interval</p>
              <p className="text-sm text-muted-foreground">Seconds between auto-refresh</p>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="rounded-md border bg-background px-3 py-1.5"
              disabled={!autoRefresh}
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 last:pb-0">
            <div>
              <p className="font-medium">Max Messages to Peek</p>
              <p className="text-sm text-muted-foreground">Maximum messages to retrieve when peeking</p>
            </div>
            <select
              value={maxMessages}
              onChange={(e) => setMaxMessages(Number(e.target.value))}
              className="rounded-md border bg-background px-3 py-1.5"
            >
              <option value={20}>20 messages</option>
              <option value={50}>50 messages</option>
              <option value={100}>100 messages</option>
              <option value={200}>200 messages</option>
              <option value={500}>500 messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage notification preferences</p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Notifications</p>
              <p className="text-sm text-muted-foreground">Display toast notifications for actions</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showNotifications}
                onChange={(e) => setShowNotifications(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary/50" />
            </label>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <Keyboard className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Keyboard Shortcuts</h2>
            <p className="text-sm text-muted-foreground">Quick actions using keyboard</p>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Refresh current view</span>
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl + R</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Toggle sidebar</span>
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl + B</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Command palette</span>
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl + K</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">New message</span>
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl + N</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Search</span>
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-xs">Ctrl + F</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Connection and data security</p>
          </div>
        </div>
        <div className="p-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Connections Secured</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  All connection strings are stored locally and encrypted. No data is sent to external servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">About</h2>
            <p className="text-sm text-muted-foreground">Application information</p>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Build</span>
              <span className="font-medium">2024.03</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">React</span>
              <span className="font-medium">18.x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License</span>
              <span className="font-medium">MIT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
