import { useState } from 'react';
import { X, RefreshCw, Trash2, ChevronDown, ChevronRight, CheckCircle, XCircle, SkipForward, Send } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useActivityLog, useClearActivityLog, useAutoReplyRule, useResendReply } from '@/hooks';
import { IAutoReplyActivityLog } from '@service-bus-explorer/shared';
import { toast } from '@/components/common/Toaster';
import { cn } from '@/utils/cn';

interface ActivityLogViewerProps {
  ruleId: string;
  onClose: () => void;
}

export function ActivityLogViewer({ ruleId, onClose }: ActivityLogViewerProps) {
  const { data: rule } = useAutoReplyRule(ruleId);
  const { data: logs, isLoading, refetch } = useActivityLog(ruleId);
  const clearLog = useClearActivityLog();
  const resendReply = useResendReply();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [resendingLogId, setResendingLogId] = useState<string | null>(null);

  const handleClearLog = async () => {
    if (!confirm('Are you sure you want to clear the activity log?')) return;

    try {
      await clearLog.mutateAsync(ruleId);
      toast('Activity log cleared', 'default');
    } catch (err) {
      toast(`Failed to clear log: ${(err as Error).message}`, 'destructive');
    }
  };

  const handleResend = async (log: IAutoReplyActivityLog) => {
    setResendingLogId(log.id);
    try {
      const result = await resendReply.mutateAsync({ ruleId, logId: log.id });
      toast(`Reply resent (${result.messageId})`, 'default');
    } catch (err) {
      toast(`Failed to resend: ${(err as Error).message}`, 'destructive');
    } finally {
      setResendingLogId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[600px] bg-background shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Activity Log</h2>
            <p className="text-sm text-muted-foreground">{rule?.name || 'Loading...'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearLog}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading activity log...</div>
          ) : !logs?.length ? (
            <div className="text-center text-muted-foreground py-8">
              No activity recorded yet. Start the listener to begin processing messages.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: IAutoReplyActivityLog) => (
                <div
                  key={log.id}
                  className={cn(
                    'rounded-lg border',
                    log.status === 'success' && 'border-green-500/30',
                    log.status === 'failed' && 'border-destructive/30',
                    log.status === 'skipped' && 'border-yellow-500/30'
                  )}
                >
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30"
                  >
                    {expandedLogId === log.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {log.originalMessageId || 'Unknown Message'}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs',
                            log.status === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            log.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            log.status === 'skipped' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          )}
                        >
                          {log.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(log.receivedAt)}
                        {log.processingTimeMs !== undefined && (
                          <span className="ml-2">({log.processingTimeMs}ms)</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedLogId === log.id && (
                    <div className="border-t p-3 space-y-3 bg-muted/20">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Message ID</div>
                          <div className="font-mono text-xs">{log.originalMessageId || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Sequence Number</div>
                          <div className="font-mono text-xs">{log.originalSequenceNumber ?? '-'}</div>
                        </div>
                        {log.replyTarget && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Reply Target</div>
                            <div className="font-mono text-xs">{log.replyTarget}</div>
                          </div>
                        )}
                        {log.repliedAt && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground">Replied At</div>
                            <div className="text-xs">{formatDate(log.repliedAt)}</div>
                          </div>
                        )}
                      </div>

                      {log.errorMessage && (
                        <div>
                          <div className="text-xs font-medium text-destructive mb-1">Error</div>
                          <div className="rounded bg-destructive/10 p-2 text-xs font-mono text-destructive">
                            {log.errorMessage}
                          </div>
                        </div>
                      )}

                      {log.originalBody && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Original Message Body
                          </div>
                          <pre className="rounded bg-muted p-2 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                            {formatJson(log.originalBody)}
                          </pre>
                        </div>
                      )}

                      {log.replyBody && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Reply Message Body
                          </div>
                          <pre className="rounded bg-muted p-2 text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
                            {formatJson(log.replyBody)}
                          </pre>
                        </div>
                      )}

                      {log.replyBody && log.replyTarget && (
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleResend(log); }}
                            disabled={resendingLogId === log.id}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            {resendingLogId === log.id ? 'Sending...' : 'Resend'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between text-sm text-muted-foreground">
          <span>{logs?.length || 0} entries</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
