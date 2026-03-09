import { create } from 'zustand';
import {
  IAutoReplyRule,
  IAutoReplyListenerStatus,
  IAutoReplyActivityLog,
} from '@service-bus-explorer/shared';

interface AutoReplyState {
  rules: IAutoReplyRule[];
  listenerStatuses: Map<string, IAutoReplyListenerStatus>;
  activityLogs: Map<string, IAutoReplyActivityLog[]>;
  selectedRuleId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setRules: (rules: IAutoReplyRule[]) => void;
  addRule: (rule: IAutoReplyRule) => void;
  updateRule: (id: string, rule: IAutoReplyRule) => void;
  removeRule: (id: string) => void;
  setListenerStatus: (ruleId: string, status: IAutoReplyListenerStatus) => void;
  setAllListenerStatuses: (statuses: IAutoReplyListenerStatus[]) => void;
  setActivityLog: (ruleId: string, logs: IAutoReplyActivityLog[]) => void;
  setSelectedRuleId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAutoReplyStore = create<AutoReplyState>((set) => ({
  rules: [],
  listenerStatuses: new Map(),
  activityLogs: new Map(),
  selectedRuleId: null,
  isLoading: false,
  error: null,

  setRules: (rules) => set({ rules }),

  addRule: (rule) =>
    set((state) => ({
      rules: [rule, ...state.rules],
    })),

  updateRule: (id, rule) =>
    set((state) => ({
      rules: state.rules.map((r) => (r.id === id ? rule : r)),
    })),

  removeRule: (id) =>
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== id),
      selectedRuleId: state.selectedRuleId === id ? null : state.selectedRuleId,
    })),

  setListenerStatus: (ruleId, status) =>
    set((state) => {
      const newStatuses = new Map(state.listenerStatuses);
      newStatuses.set(ruleId, status);
      return { listenerStatuses: newStatuses };
    }),

  setAllListenerStatuses: (statuses) =>
    set(() => {
      const newStatuses = new Map<string, IAutoReplyListenerStatus>();
      statuses.forEach((status) => newStatuses.set(status.ruleId, status));
      return { listenerStatuses: newStatuses };
    }),

  setActivityLog: (ruleId, logs) =>
    set((state) => {
      const newLogs = new Map(state.activityLogs);
      newLogs.set(ruleId, logs);
      return { activityLogs: newLogs };
    }),

  setSelectedRuleId: (id) => set({ selectedRuleId: id }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
