import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queuesApi, topicsApi, subscriptionsApi, rulesApi } from '@/services/api';
import { useConnectionStore } from '@/store/useConnectionStore';
import { IQueue, ITopic, ISubscription, IRule, IReceivedMessage } from '@service-bus-explorer/shared';

// Queues hooks
export function useQueues() {
  const { activeConnection } = useConnectionStore();

  return useQuery<IQueue[]>({
    queryKey: ['queues'],
    queryFn: queuesApi.list,
    enabled: !!activeConnection,
  });
}

export function useQueue(name: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IQueue>({
    queryKey: ['queue', name],
    queryFn: () => queuesApi.get(name),
    enabled: !!activeConnection && !!name,
  });
}

export function useCreateQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: queuesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
  });
}

export function useUpdateQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => queuesApi.update(name, data),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      queryClient.invalidateQueries({ queryKey: ['queue', name] });
    },
  });
}

export function useDeleteQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: queuesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
  });
}

export function useQueueMessages(name: string, count = 10) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IReceivedMessage[]>({
    queryKey: ['queue-messages', name, count],
    queryFn: () => queuesApi.peekMessages(name, count),
    enabled: !!activeConnection && !!name,
    refetchOnWindowFocus: false,
  });
}

export function useQueueDLQMessages(name: string, count = 10) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IReceivedMessage[]>({
    queryKey: ['queue-dlq-messages', name, count],
    queryFn: () => queuesApi.peekDLQ(name, count),
    enabled: !!activeConnection && !!name,
    refetchOnWindowFocus: false,
  });
}

export function useSendQueueMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, message }: { name: string; message: any }) =>
      queuesApi.sendMessage(name, message),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['queue', name] });
      queryClient.invalidateQueries({ queryKey: ['queue-messages', name] });
    },
  });
}

export function usePurgeQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, includeDeadLetter }: { name: string; includeDeadLetter?: boolean }) =>
      queuesApi.purge(name, includeDeadLetter),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['queue', name] });
      queryClient.invalidateQueries({ queryKey: ['queue-messages', name] });
    },
  });
}

// Topics hooks
export function useTopics() {
  const { activeConnection } = useConnectionStore();

  return useQuery<ITopic[]>({
    queryKey: ['topics'],
    queryFn: topicsApi.list,
    enabled: !!activeConnection,
  });
}

export function useTopic(name: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<ITopic>({
    queryKey: ['topic', name],
    queryFn: () => topicsApi.get(name),
    enabled: !!activeConnection && !!name,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: topicsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: topicsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useSendTopicMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, message }: { name: string; message: any }) =>
      topicsApi.sendMessage(name, message),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['topic', name] });
    },
  });
}

// Subscriptions hooks
export function useSubscriptions(topicName: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<ISubscription[]>({
    queryKey: ['subscriptions', topicName],
    queryFn: () => subscriptionsApi.list(topicName),
    enabled: !!activeConnection && !!topicName,
  });
}

export function useSubscription(topicName: string, name: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<ISubscription>({
    queryKey: ['subscription', topicName, name],
    queryFn: () => subscriptionsApi.get(topicName, name),
    enabled: !!activeConnection && !!topicName && !!name,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicName, data }: { topicName: string; data: any }) =>
      subscriptionsApi.create(topicName, data),
    onSuccess: (_, { topicName }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', topicName] });
      queryClient.invalidateQueries({ queryKey: ['topic', topicName] });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicName, name }: { topicName: string; name: string }) =>
      subscriptionsApi.delete(topicName, name),
    onSuccess: (_, { topicName }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', topicName] });
      queryClient.invalidateQueries({ queryKey: ['topic', topicName] });
    },
  });
}

export function useSubscriptionMessages(topicName: string, name: string, count = 10) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IReceivedMessage[]>({
    queryKey: ['subscription-messages', topicName, name, count],
    queryFn: () => subscriptionsApi.peekMessages(topicName, name, count),
    enabled: !!activeConnection && !!topicName && !!name,
    refetchOnWindowFocus: false,
  });
}

// Rules hooks
export function useRules(topicName: string, subscriptionName: string) {
  const { activeConnection } = useConnectionStore();

  return useQuery<IRule[]>({
    queryKey: ['rules', topicName, subscriptionName],
    queryFn: () => rulesApi.list(topicName, subscriptionName),
    enabled: !!activeConnection && !!topicName && !!subscriptionName,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      topicName,
      subscriptionName,
      data,
    }: {
      topicName: string;
      subscriptionName: string;
      data: any;
    }) => rulesApi.create(topicName, subscriptionName, data),
    onSuccess: (_, { topicName, subscriptionName }) => {
      queryClient.invalidateQueries({ queryKey: ['rules', topicName, subscriptionName] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      topicName,
      subscriptionName,
      name,
    }: {
      topicName: string;
      subscriptionName: string;
      name: string;
    }) => rulesApi.delete(topicName, subscriptionName, name),
    onSuccess: (_, { topicName, subscriptionName }) => {
      queryClient.invalidateQueries({ queryKey: ['rules', topicName, subscriptionName] });
    },
  });
}
