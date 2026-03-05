import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IConnection } from '@service-bus-explorer/shared';

interface ConnectionState {
  connections: IConnection[];
  activeConnectionId: string | null;
  activeConnection: IConnection | null;
  isConnecting: boolean;

  // Actions
  addConnection: (connection: IConnection) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (connection: IConnection | null) => void;
  setConnecting: (connecting: boolean) => void;
  updateConnection: (id: string, updates: Partial<IConnection>) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      connections: [],
      activeConnectionId: null,
      activeConnection: null,
      isConnecting: false,

      addConnection: (connection) =>
        set((state) => ({
          connections: [...state.connections, connection],
        })),

      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
          activeConnection: state.activeConnectionId === id ? null : state.activeConnection,
        })),

      setActiveConnection: (connection) =>
        set({
          activeConnectionId: connection?.id || null,
          activeConnection: connection,
        }),

      setConnecting: (connecting) =>
        set({ isConnecting: connecting }),

      updateConnection: (id, updates) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
          activeConnection:
            state.activeConnectionId === id
              ? { ...state.activeConnection!, ...updates }
              : state.activeConnection,
        })),
    }),
    {
      name: 'sbe-connections',
      partialize: (state) => ({
        connections: state.connections,
        activeConnectionId: state.activeConnectionId,
      }),
    }
  )
);
