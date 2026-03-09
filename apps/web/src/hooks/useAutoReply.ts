import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { autoReplyApi } from '@/services/api';
import { useConnectionStore } from '@/store/useConnectionStore';
import {
  IAutoReplyRule,
  IAutoReplyListenerStatus,
  IAutoReplyActivityLog,
  ICreateAutoReplyRule,
  IUpdateAutoReplyRule,
  ITemplateTestResponse,
  IAvailableVariables,
} from '@service-bus-explorer/shared';

// Rules hooks
export function useAutoReplyRules() {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyRule[]>({
    queryKey: ['auto-reply-rules', activeConnection?.id],
    queryFn: () => autoReplyApi.listRules(activeConnection?.id),
    enabled: !!activeConnection,
  });
}

export function useAutoReplyRule(id: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyRule>({
    queryKey: ['auto-reply-rule', id],
    queryFn: () => autoReplyApi.getRule(id),
    enabled: !!activeConnection && !!id,
  });
}

export function useCreateAutoReplyRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateAutoReplyRule) => autoReplyApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
    },
  });
}

export function useUpdateAutoReplyRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateAutoReplyRule }) =>
      autoReplyApi.updateRule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rule', id] });
    },
  });
}

export function useDeleteAutoReplyRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => autoReplyApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
    },
  });
}

// Enable/Disable hooks
export function useEnableAutoReplyRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => autoReplyApi.enableRule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rule', id] });
    },
  });
}

export function useDisableAutoReplyRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => autoReplyApi.disableRule(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rules'] });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-rule', id] });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-listener-statuses'] });
    },
  });
}

// Listener hooks
export function useStartListener() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => autoReplyApi.startListener(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-listener-statuses'] });
    },
  });
}

export function useStopListener() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => autoReplyApi.stopListener(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-listener-statuses'] });
    },
  });
}

export function useListenerStatuses() {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyListenerStatus[]>({
    queryKey: ['auto-reply-listener-statuses'],
    queryFn: autoReplyApi.getAllListenerStatuses,
    enabled: !!activeConnection,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useActiveListeners() {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyListenerStatus[]>({
    queryKey: ['auto-reply-active-listeners'],
    queryFn: autoReplyApi.getActiveListeners,
    enabled: !!activeConnection,
    refetchInterval: 5000,
  });
}

export function useListenerStatus(ruleId: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyListenerStatus>({
    queryKey: ['auto-reply-listener-status', ruleId],
    queryFn: () => autoReplyApi.getListenerStatus(ruleId),
    enabled: !!activeConnection && !!ruleId,
    refetchInterval: 5000,
  });
}

// Activity log hooks
export function useActivityLog(ruleId: string, limit = 100) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyActivityLog[]>({
    queryKey: ['auto-reply-activity-log', ruleId, limit],
    queryFn: () => autoReplyApi.getActivityLog(ruleId, limit),
    enabled: !!activeConnection && !!ruleId,
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

export function useRecentActivity(limit = 50) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IAutoReplyActivityLog[]>({
    queryKey: ['auto-reply-recent-activity', limit],
    queryFn: () => autoReplyApi.getRecentActivity(limit),
    enabled: !!activeConnection,
  });
}

export function useClearActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => autoReplyApi.clearActivityLog(ruleId),
    onSuccess: (_, ruleId) => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-activity-log', ruleId] });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-recent-activity'] });
    },
  });
}

export function useResendReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, logId }: { ruleId: string; logId: string }) =>
      autoReplyApi.resendReply(ruleId, logId),
    onSuccess: (_, { ruleId }) => {
      queryClient.invalidateQueries({ queryKey: ['auto-reply-activity-log', ruleId] });
      queryClient.invalidateQueries({ queryKey: ['auto-reply-recent-activity'] });
    },
  });
}

// Template hooks
export function useTestTemplate() {
  return useMutation({
    mutationFn: ({ template, sampleMessage }: { template: string; sampleMessage: any }) =>
      autoReplyApi.testTemplate(template, sampleMessage) as Promise<ITemplateTestResponse>,
  });
}

export function useAvailableVariables() {
  return useQuery<IAvailableVariables>({
    queryKey: ['auto-reply-available-variables'],
    queryFn: autoReplyApi.getAvailableVariables,
  });
}
