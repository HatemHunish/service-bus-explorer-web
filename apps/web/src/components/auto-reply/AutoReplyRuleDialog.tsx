import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Select, SelectOption } from '@/components/common/Select';
import { toast } from '@/components/common/Toaster';
import { cn } from '@/utils/cn';
import { useQueues, useTopics, useSubscriptions, useCreateAutoReplyRule, useUpdateAutoReplyRule } from '@/hooks';
import { useConnectionStore } from '@/store/useConnectionStore';
import { ConditionBuilder } from './ConditionBuilder';
import { TemplateEditor } from './TemplateEditor';
import {
  IAutoReplyRule,
  IPropertyCondition,
  IBodyCondition,
  IAutoReplySource,
  IAutoReplyTarget,
} from '@service-bus-explorer/shared';

interface AutoReplyRuleDialogProps {
  open: boolean;
  onClose: () => void;
  editingRule: IAutoReplyRule | null;
}

const STEPS = ['Basic Info', 'Conditions', 'Reply'];

export function AutoReplyRuleDialog({ open, onClose, editingRule }: AutoReplyRuleDialogProps) {
  const { activeConnection } = useConnectionStore();
  const { data: queues } = useQueues();
  const { data: topics } = useTopics();
  const createRule = useCreateAutoReplyRule();
  const updateRule = useUpdateAutoReplyRule();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);

  // Source
  const [sourceType, setSourceType] = useState<'queue' | 'subscription'>('queue');
  const [sourceQueueName, setSourceQueueName] = useState('');
  const [sourceTopicName, setSourceTopicName] = useState('');
  const [sourceSubscriptionName, setSourceSubscriptionName] = useState('');

  // Conditions
  const [propertyConditions, setPropertyConditions] = useState<IPropertyCondition[]>([]);
  const [bodyConditions, setBodyConditions] = useState<IBodyCondition[]>([]);
  const [matchMode, setMatchMode] = useState<'all' | 'any'>('all');

  // Reply
  const [replyTargetType, setReplyTargetType] = useState<'same' | 'queue' | 'topic'>('same');
  const [replyQueueName, setReplyQueueName] = useState('');
  const [replyTopicName, setReplyTopicName] = useState('');
  const [replySubscriptionName, setReplySubscriptionName] = useState('');
  const [replyDelayMs, setReplyDelayMs] = useState(0);
  const [replyCount, setReplyCount] = useState(1);
  const [replyTemplate, setReplyTemplate] = useState('{\n  "status": "received",\n  "originalMessageId": "{{messageId}}"\n}');
  const [replyContentType, setReplyContentType] = useState('application/json');

  const { data: subscriptions, isLoading: subscriptionsLoading, isFetching: subscriptionsFetching } = useSubscriptions(sourceTopicName);
  const { data: replySubscriptions, isLoading: replySubscriptionsLoading, isFetching: replySubscriptionsFetching } = useSubscriptions(replyTopicName);

  // Load editing rule data
  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setDescription(editingRule.description || '');
      setEnabled(editingRule.enabled);
      setSourceType(editingRule.source.entityType);
      setSourceQueueName(editingRule.source.queueName || '');
      setSourceTopicName(editingRule.source.topicName || '');
      setSourceSubscriptionName(editingRule.source.subscriptionName || '');
      setPropertyConditions(editingRule.propertyConditions);
      setBodyConditions(editingRule.bodyConditions);
      setMatchMode(editingRule.matchMode);
      setReplyTargetType(editingRule.reply.target.targetType);
      setReplyQueueName(editingRule.reply.target.queueName || '');
      setReplyTopicName(editingRule.reply.target.topicName || '');
      setReplySubscriptionName(editingRule.reply.target.subscriptionName || '');
      setReplyDelayMs(editingRule.reply.delayMs);
      setReplyCount(editingRule.reply.replyCount ?? 1);
      setReplyTemplate(editingRule.reply.template);
      setReplyContentType(editingRule.reply.contentType);
    } else {
      resetForm();
    }
    setCurrentStep(0);
  }, [editingRule, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEnabled(true);
    setSourceType('queue');
    setSourceQueueName('');
    setSourceTopicName('');
    setSourceSubscriptionName('');
    setPropertyConditions([]);
    setBodyConditions([]);
    setMatchMode('all');
    setReplyTargetType('same');
    setReplyQueueName('');
    setReplyTopicName('');
    setReplySubscriptionName('');
    setReplyDelayMs(0);
    setReplyCount(1);
    setReplyTemplate('{\n  "status": "received",\n  "originalMessageId": "{{messageId}}"\n}');
    setReplyContentType('application/json');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        if (!name.trim()) {
          toast('Name is required', 'destructive');
          return false;
        }
        if (sourceType === 'queue' && !sourceQueueName) {
          toast('Select a source queue', 'destructive');
          return false;
        }
        if (sourceType === 'subscription' && (!sourceTopicName || !sourceSubscriptionName)) {
          toast('Select a source topic and subscription', 'destructive');
          return false;
        }
        return true;
      case 1: // Conditions
        if (propertyConditions.length === 0 && bodyConditions.length === 0) {
          toast('Add at least one condition', 'destructive');
          return false;
        }
        return true;
      case 2: // Reply
        if (!replyTemplate.trim()) {
          toast('Reply template is required', 'destructive');
          return false;
        }
        if (replyTargetType === 'queue' && !replyQueueName) {
          toast('Select a reply queue', 'destructive');
          return false;
        }
        if (replyTargetType === 'topic' && !replyTopicName) {
          toast('Select a reply topic', 'destructive');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const source: IAutoReplySource = {
        entityType: sourceType,
        queueName: sourceType === 'queue' ? sourceQueueName : undefined,
        topicName: sourceType === 'subscription' ? sourceTopicName : undefined,
        subscriptionName: sourceType === 'subscription' ? sourceSubscriptionName : undefined,
      };

      const target: IAutoReplyTarget = {
        targetType: replyTargetType,
        queueName: replyTargetType === 'queue' ? replyQueueName : undefined,
        topicName: replyTargetType === 'topic' ? replyTopicName : undefined,
        subscriptionName: replyTargetType === 'topic' && replySubscriptionName ? replySubscriptionName : undefined,
      };

      const replyConfig = {
        target,
        delayMs: replyDelayMs,
        replyCount,
        template: replyTemplate,
        contentType: replyContentType,
      };

      if (editingRule) {
        // Don't send connectionId on update - it's not allowed to change
        const updateData = {
          name,
          description: description || undefined,
          enabled,
          source,
          propertyConditions,
          bodyConditions,
          matchMode,
          reply: replyConfig,
        };
        await updateRule.mutateAsync({ id: editingRule.id, data: updateData });
        toast('Rule updated successfully', 'default');
      } else {
        // Include connectionId only on create
        const createData = {
          connectionId: activeConnection!.id,
          name,
          description: description || undefined,
          enabled,
          source,
          propertyConditions,
          bodyConditions,
          matchMode,
          reply: replyConfig,
        };
        await createRule.mutateAsync(createData);
        toast('Rule created successfully', 'default');
      }

      onClose();
    } catch (err) {
      toast(`Failed to save rule: ${(err as Error).message}`, 'destructive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]">
        <div className="w-[700px] max-h-[90vh] overflow-y-auto rounded-lg border bg-background shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">
              {editingRule ? 'Edit Auto-Reply Rule' : 'Create Auto-Reply Rule'}
            </h2>
            <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex border-b">
            {STEPS.map((step, index) => (
              <button
                key={step}
                onClick={() => {
                  if (index < currentStep || validateStep(currentStep)) {
                    setCurrentStep(index);
                  }
                }}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                  index === currentStep
                    ? 'border-b-2 border-primary text-primary'
                    : index < currentStep
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
                )}
              >
                {index + 1}. {step}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Rule Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Reply to Order Events"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description of what this rule does"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Source Entity Type *</label>
                  <Select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value as 'queue' | 'subscription')}
                    className="mt-1"
                  >
                    <SelectOption value="queue">Queue</SelectOption>
                    <SelectOption value="subscription">Topic Subscription</SelectOption>
                  </Select>
                </div>

                {sourceType === 'queue' ? (
                  <div>
                    <label className="text-sm font-medium">Source Queue *</label>
                    <Select
                      value={sourceQueueName}
                      onChange={(e) => setSourceQueueName(e.target.value)}
                      className="mt-1"
                    >
                      <SelectOption value="">Select a queue</SelectOption>
                      {queues?.map((q) => (
                        <SelectOption key={q.name} value={q.name}>
                          {q.name}
                        </SelectOption>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium">Source Topic *</label>
                      <Select
                        value={sourceTopicName}
                        onChange={(e) => {
                          setSourceTopicName(e.target.value);
                          setSourceSubscriptionName('');
                        }}
                        className="mt-1"
                      >
                        <SelectOption value="">Select a topic</SelectOption>
                        {topics?.map((t) => (
                          <SelectOption key={t.name} value={t.name}>
                            {t.name}
                          </SelectOption>
                        ))}
                      </Select>
                    </div>
                    {sourceTopicName && (
                      <div>
                        <label className="text-sm font-medium">Source Subscription *</label>
                        <Select
                          value={sourceSubscriptionName}
                          onChange={(e) => setSourceSubscriptionName(e.target.value)}
                          className="mt-1"
                          disabled={subscriptionsLoading || subscriptionsFetching}
                        >
                          <SelectOption value="">
                            {subscriptionsLoading || subscriptionsFetching
                              ? 'Loading subscriptions...'
                              : 'Select a subscription'}
                          </SelectOption>
                          {subscriptions?.map((s) => (
                            <SelectOption key={s.subscriptionName} value={s.subscriptionName}>
                              {s.subscriptionName}
                            </SelectOption>
                          ))}
                        </Select>
                        {!subscriptionsLoading && !subscriptionsFetching && subscriptions?.length === 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No subscriptions found for this topic
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="enabled" className="text-sm">
                    Enable rule after creation
                  </label>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Match Mode</label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="matchMode"
                        checked={matchMode === 'all'}
                        onChange={() => setMatchMode('all')}
                      />
                      <span className="text-sm">Match ALL conditions</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="matchMode"
                        checked={matchMode === 'any'}
                        onChange={() => setMatchMode('any')}
                      />
                      <span className="text-sm">Match ANY condition</span>
                    </label>
                  </div>
                </div>

                <ConditionBuilder
                  propertyConditions={propertyConditions}
                  bodyConditions={bodyConditions}
                  onPropertyConditionsChange={setPropertyConditions}
                  onBodyConditionsChange={setBodyConditions}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Reply Target</label>
                  <Select
                    value={replyTargetType}
                    onChange={(e) => setReplyTargetType(e.target.value as 'same' | 'queue' | 'topic')}
                    className="mt-1"
                  >
                    <SelectOption value="same">Same entity as source</SelectOption>
                    <SelectOption value="queue">Different queue</SelectOption>
                    <SelectOption value="topic">Different topic</SelectOption>
                  </Select>
                </div>

                {replyTargetType === 'queue' && (
                  <div>
                    <label className="text-sm font-medium">Reply Queue *</label>
                    <Select
                      value={replyQueueName}
                      onChange={(e) => setReplyQueueName(e.target.value)}
                      className="mt-1"
                    >
                      <SelectOption value="">Select a queue</SelectOption>
                      {queues?.map((q) => (
                        <SelectOption key={q.name} value={q.name}>
                          {q.name}
                        </SelectOption>
                      ))}
                    </Select>
                  </div>
                )}

                {replyTargetType === 'topic' && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Reply Topic *</label>
                      <Select
                        value={replyTopicName}
                        onChange={(e) => {
                          setReplyTopicName(e.target.value);
                          setReplySubscriptionName('');
                        }}
                        className="mt-1"
                      >
                        <SelectOption value="">Select a topic</SelectOption>
                        {topics?.map((t) => (
                          <SelectOption key={t.name} value={t.name}>
                            {t.name}
                          </SelectOption>
                        ))}
                      </Select>
                    </div>
                    {replyTopicName && (
                      <div>
                        <label className="text-sm font-medium">Reply Subscription</label>
                        <Select
                          value={replySubscriptionName}
                          onChange={(e) => setReplySubscriptionName(e.target.value)}
                          className="mt-1"
                          disabled={replySubscriptionsLoading || replySubscriptionsFetching}
                        >
                          <SelectOption value="">
                            {replySubscriptionsLoading || replySubscriptionsFetching
                              ? 'Loading subscriptions...'
                              : 'All subscriptions (none selected)'}
                          </SelectOption>
                          {replySubscriptions?.map((s) => (
                            <SelectOption key={s.subscriptionName} value={s.subscriptionName}>
                              {s.subscriptionName}
                            </SelectOption>
                          ))}
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Optional. Messages are sent to the topic and routed to all matching subscriptions.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="text-sm font-medium">Reply Delay (ms)</label>
                  <Input
                    type="number"
                    value={replyDelayMs}
                    onChange={(e) => setReplyDelayMs(parseInt(e.target.value) || 0)}
                    min={0}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delay before sending the reply message (0 = immediate)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Reply Count</label>
                  <Input
                    type="number"
                    value={replyCount}
                    onChange={(e) => setReplyCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Number of reply messages to send per matched message (default: 1)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Content Type</label>
                  <Select
                    value={replyContentType}
                    onChange={(e) => setReplyContentType(e.target.value)}
                    className="mt-1"
                  >
                    <SelectOption value="application/json">application/json</SelectOption>
                    <SelectOption value="text/plain">text/plain</SelectOption>
                    <SelectOption value="application/xml">application/xml</SelectOption>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Reply Template *</label>
                  <TemplateEditor
                    value={replyTemplate}
                    onChange={setReplyTemplate}
                    contentType={replyContentType}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t p-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
