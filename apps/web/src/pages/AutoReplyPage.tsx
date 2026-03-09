import { useState } from 'react';
import { Plus, RefreshCw, Reply, Play, Square, Trash2, Edit, Activity } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAutoReplyRules, useListenerStatuses, useDeleteAutoReplyRule, useStartListener, useStopListener, useEnableAutoReplyRule, useDisableAutoReplyRule } from '@/hooks';
import { useConnectionStore } from '@/store/useConnectionStore';
import { AutoReplyRuleDialog } from '@/components/auto-reply/AutoReplyRuleDialog';
import { ActivityLogViewer } from '@/components/auto-reply/ActivityLogViewer';
import { IAutoReplyRule } from '@service-bus-explorer/shared';
import { toast } from '@/components/common/Toaster';
import { cn } from '@/utils/cn';

export function AutoReplyPage() {
  const { activeConnection } = useConnectionStore();
  const { data: rules, isLoading, refetch } = useAutoReplyRules();
  const { data: listenerStatuses } = useListenerStatuses();
  const deleteRule = useDeleteAutoReplyRule();
  const startListener = useStartListener();
  const stopListener = useStopListener();
  const enableRule = useEnableAutoReplyRule();
  const disableRule = useDisableAutoReplyRule();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IAutoReplyRule | null>(null);
  const [viewingActivityRuleId, setViewingActivityRuleId] = useState<string | null>(null);

  const getListenerStatus = (ruleId: string) => {
    return listenerStatuses?.find((s) => s.ruleId === ruleId);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: IAutoReplyRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = async (rule: IAutoReplyRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.name}"?`)) return;

    try {
      await deleteRule.mutateAsync(rule.id);
      toast(`Rule "${rule.name}" deleted`, 'default');
    } catch (err) {
      toast(`Failed to delete rule: ${(err as Error).message}`, 'destructive');
    }
  };

  const handleToggleListener = async (rule: IAutoReplyRule) => {
    const status = getListenerStatus(rule.id);
    try {
      if (status?.isActive) {
        await stopListener.mutateAsync(rule.id);
        toast(`Listener stopped for "${rule.name}"`, 'default');
      } else {
        await startListener.mutateAsync(rule.id);
        toast(`Listener started for "${rule.name}"`, 'default');
      }
    } catch (err) {
      toast(`Failed to toggle listener: ${(err as Error).message}`, 'destructive');
    }
  };

  const handleToggleEnabled = async (rule: IAutoReplyRule) => {
    try {
      if (rule.enabled) {
        await disableRule.mutateAsync(rule.id);
        toast(`Rule "${rule.name}" disabled`, 'default');
      } else {
        await enableRule.mutateAsync(rule.id);
        toast(`Rule "${rule.name}" enabled`, 'default');
      }
    } catch (err) {
      toast(`Failed to toggle rule: ${(err as Error).message}`, 'destructive');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
    refetch();
  };

  if (!activeConnection) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          Connect to a namespace to manage auto-reply rules
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Auto-Reply Rules</h1>
          <p className="text-muted-foreground">
            Configure automatic reply messages for incoming Service Bus messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateRule}>
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading rules...</div>
      ) : !rules?.length ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Reply className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No auto-reply rules</h3>
          <p className="mt-2 text-muted-foreground">
            Create a rule to automatically respond to incoming messages
          </p>
          <Button className="mt-4" onClick={handleCreateRule}>
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Reply Target</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Listener</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Triggers</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const status = getListenerStatus(rule.id);
                return (
                  <tr key={rule.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        {rule.description && (
                          <div className="text-xs text-muted-foreground">{rule.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {rule.source.entityType === 'queue' ? (
                        <span className="text-queue">{rule.source.queueName || 'Unknown queue'}</span>
                      ) : (
                        <span className="text-topic">
                          {rule.source.topicName || 'Unknown topic'}
                          {rule.source.subscriptionName && `/${rule.source.subscriptionName}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {rule.reply.target.targetType === 'same'
                        ? 'Same entity'
                        : rule.reply.target.targetType === 'queue'
                        ? rule.reply.target.queueName
                        : rule.reply.target.subscriptionName
                        ? `${rule.reply.target.topicName}/${rule.reply.target.subscriptionName}`
                        : rule.reply.target.topicName}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleEnabled(rule)}
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs',
                          rule.enabled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                        )}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {status?.isActive ? (
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          <span className="text-xs text-green-600">Running</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Stopped</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {rule.triggerCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleListener(rule)}
                          title={status?.isActive ? 'Stop listener' : 'Start listener'}
                          disabled={!rule.enabled}
                        >
                          {status?.isActive ? (
                            <Square className="h-4 w-4 text-destructive" />
                          ) : (
                            <Play className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingActivityRuleId(rule.id)}
                          title="View activity"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditRule(rule)}
                          title="Edit rule"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteRule(rule)}
                          title="Delete rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AutoReplyRuleDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        editingRule={editingRule}
      />

      {viewingActivityRuleId && (
        <ActivityLogViewer
          ruleId={viewingActivityRuleId}
          onClose={() => setViewingActivityRuleId(null)}
        />
      )}
    </div>
  );
}
