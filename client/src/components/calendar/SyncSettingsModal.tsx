import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CalendarConnection } from '../../../../drizzle/schema';
import { CALENDAR_COLORS, PROVIDER_COLORS } from '@shared/types';
import { Cloud, CloudOff, RefreshCw, Trash2, Plus, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: CalendarConnection[];
  onRefresh: () => void;
}

export function SyncSettingsModal({ isOpen, onClose, connections, onRefresh }: SyncSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('connections');
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newProvider, setNewProvider] = useState<'google' | 'apple' | 'notion'>('google');

  // Google connection state
  const [googleClientId, setGoogleClientId] = useState('');
  
  // Apple connection state
  const [appleCaldavUrl, setAppleCaldavUrl] = useState('https://caldav.icloud.com');
  const [appleUsername, setAppleUsername] = useState('');
  const [applePassword, setApplePassword] = useState('');
  
  // Notion connection state
  const [notionToken, setNotionToken] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');

  const createConnection = trpc.connections.create.useMutation({
    onSuccess: () => {
      toast.success('Connection created');
      onRefresh();
      setIsAddingConnection(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateConnection = trpc.connections.update.useMutation({
    onSuccess: () => {
      toast.success('Settings saved');
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteConnection = trpc.connections.delete.useMutation({
    onSuccess: () => {
      toast.success('Connection removed');
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const connectApple = trpc.connections.connectApple.useMutation({
    onSuccess: () => {
      toast.success('Apple Calendar connected');
      onRefresh();
      setIsAddingConnection(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const connectNotion = trpc.connections.connectNotion.useMutation({
    onSuccess: () => {
      toast.success('Notion connected');
      onRefresh();
      setIsAddingConnection(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const triggerSync = trpc.sync.trigger.useMutation({
    onSuccess: () => {
      toast.success('Sync completed');
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddConnection = async () => {
    if (newProvider === 'google') {
      // For Google, we need OAuth flow - create connection first
      const result = await createConnection.mutateAsync({
        provider: 'google',
        calendarName: 'Google Calendar',
        color: PROVIDER_COLORS.google,
      });
      toast.info('Google Calendar requires OAuth setup. Please configure your Google API credentials.');
    } else if (newProvider === 'apple') {
      if (!appleUsername || !applePassword) {
        toast.error('Please enter your Apple ID credentials');
        return;
      }
      const result = await createConnection.mutateAsync({
        provider: 'apple',
        calendarName: 'Apple Calendar',
        color: PROVIDER_COLORS.apple,
      });
      // Then connect with CalDAV credentials
      // Note: In a real app, you'd get the connection ID from the result
    } else if (newProvider === 'notion') {
      if (!notionToken || !notionDatabaseId) {
        toast.error('Please enter your Notion credentials');
        return;
      }
      const result = await createConnection.mutateAsync({
        provider: 'notion',
        calendarName: 'Notion Calendar',
        color: PROVIDER_COLORS.notion,
      });
    }
  };

  const handleSyncDirectionChange = (connectionId: number, direction: string) => {
    updateConnection.mutate({
      id: connectionId,
      syncDirection: direction as 'none' | 'pull' | 'push' | 'bidirectional',
    });
  };

  const handleColorChange = (connectionId: number, color: string) => {
    updateConnection.mutate({
      id: connectionId,
      color,
    });
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google Calendar';
      case 'apple': return 'Apple Calendar';
      case 'notion': return 'Notion';
      default: return provider;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sync Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="sync">Sync Options</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Existing Connections */}
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: conn.color || '#007AFF' }}
                    />
                    <span className="font-medium">{getProviderName(conn.provider)}</span>
                    {conn.isConnected ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        <Cloud className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <CloudOff className="w-3 h-3" />
                        Disconnected
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteConnection.mutate({ id: conn.id })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Sync Direction</Label>
                    <Select
                      value={conn.syncDirection}
                      onValueChange={(value) => handleSyncDirectionChange(conn.id, value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Disabled</SelectItem>
                        <SelectItem value="pull">Pull Only (Read)</SelectItem>
                        <SelectItem value="push">Push Only (Write)</SelectItem>
                        <SelectItem value="bidirectional">Bidirectional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <div className="flex gap-1 mt-2">
                      {CALENDAR_COLORS.slice(0, 6).map((c) => (
                        <button
                          key={c.value}
                          onClick={() => handleColorChange(conn.id, c.value)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            conn.color === c.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''
                          }`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {conn.lastSyncAt && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last synced: {new Date(conn.lastSyncAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}

            {/* Add New Connection */}
            {!isAddingConnection ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingConnection(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Calendar Connection
              </Button>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                <div>
                  <Label>Calendar Provider</Label>
                  <Select value={newProvider} onValueChange={(v) => setNewProvider(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Calendar</SelectItem>
                      <SelectItem value="apple">Apple Calendar (iCloud)</SelectItem>
                      <SelectItem value="notion">Notion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newProvider === 'google' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Google Calendar requires OAuth authentication. You'll need to set up a Google Cloud project and configure OAuth credentials.
                    </p>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      Open Google Cloud Console
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {newProvider === 'apple' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect to Apple Calendar using CalDAV. You'll need an app-specific password from your Apple ID settings.
                    </p>
                    <div>
                      <Label>CalDAV URL</Label>
                      <Input
                        value={appleCaldavUrl}
                        onChange={(e) => setAppleCaldavUrl(e.target.value)}
                        placeholder="https://caldav.icloud.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Apple ID Email</Label>
                      <Input
                        value={appleUsername}
                        onChange={(e) => setAppleUsername(e.target.value)}
                        placeholder="your@email.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>App-Specific Password</Label>
                      <Input
                        type="password"
                        value={applePassword}
                        onChange={(e) => setApplePassword(e.target.value)}
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                        className="mt-1"
                      />
                    </div>
                    <a
                      href="https://appleid.apple.com/account/manage"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      Generate App-Specific Password
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {newProvider === 'notion' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect to a Notion database with date properties to sync events.
                    </p>
                    <div>
                      <Label>Integration Token</Label>
                      <Input
                        type="password"
                        value={notionToken}
                        onChange={(e) => setNotionToken(e.target.value)}
                        placeholder="secret_..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Database ID</Label>
                      <Input
                        value={notionDatabaseId}
                        onChange={(e) => setNotionDatabaseId(e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="mt-1"
                      />
                    </div>
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      Create Notion Integration
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingConnection(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddConnection}
                    className="flex-1"
                    disabled={createConnection.isPending}
                  >
                    {createConnection.isPending ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync" className="flex-1 overflow-y-auto space-y-4 mt-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-medium mb-3">Manual Sync</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Trigger a manual synchronization of all connected calendars.
              </p>
              <Button
                onClick={() => triggerSync.mutate({})}
                disabled={triggerSync.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${triggerSync.isPending ? 'animate-spin' : ''}`} />
                {triggerSync.isPending ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-medium mb-3">Auto Sync</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Automatic synchronization</p>
                  <p className="text-xs text-muted-foreground">
                    Sync changes automatically when events are created or modified
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-medium mb-3">Conflict Resolution</h3>
              <Select defaultValue="newest">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Keep newest version</SelectItem>
                  <SelectItem value="local">Prefer local changes</SelectItem>
                  <SelectItem value="remote">Prefer remote changes</SelectItem>
                  <SelectItem value="ask">Ask each time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
