import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/store/useConnectionStore';
import { connectionsApi } from '@/services/api';

export function useInitialize() {
  const [isInitialized, setIsInitialized] = useState(false);
  const store = useConnectionStore();

  useEffect(() => {
    async function initialize() {
      try {
        // Fetch connections from backend (source of truth)
        const backendConnections = await connectionsApi.list();

        // Replace local connections with backend data
        const currentIds = new Set(store.connections.map((c) => c.id));

        for (const conn of backendConnections) {
          if (!currentIds.has(conn.id)) {
            store.addConnection(conn);
          } else {
            store.updateConnection(conn.id, conn);
          }
        }

        // Get the persisted activeConnectionId from store
        const { activeConnectionId, activeConnection } = useConnectionStore.getState();

        // Check if there's an active connection on the server
        try {
          const active = await connectionsApi.getActive();
          if (active) {
            store.setActiveConnection(active);
          }
        } catch {
          // No active connection on server - try to restore from persisted ID
          if (activeConnectionId && !activeConnection) {
            const savedConnection = backendConnections.find((c) => c.id === activeConnectionId);
            if (savedConnection) {
              // Activate the connection on the server
              try {
                await connectionsApi.activate(activeConnectionId);
                store.setActiveConnection(savedConnection);
              } catch {
                // Failed to activate, clear the persisted ID
                store.setActiveConnection(null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize connections:', error);
      } finally {
        setIsInitialized(true);
      }
    }

    initialize();
  }, []);

  return { isInitialized };
}
