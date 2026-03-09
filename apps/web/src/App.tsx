import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { QueuesPage } from './pages/QueuesPage';
import { QueueDetailsPage } from './pages/QueueDetailsPage';
import { TopicsPage } from './pages/TopicsPage';
import { TopicDetailsPage } from './pages/TopicDetailsPage';
import { SubscriptionDetailsPage } from './pages/SubscriptionDetailsPage';
import { EventHubsPage } from './pages/EventHubsPage';
import { AutoReplyPage } from './pages/AutoReplyPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from './components/common/Toaster';
import { ThemeProvider } from './components/common/ThemeProvider';
import { useInitialize } from './hooks/useInitialize';

function AppContent() {
  const { isInitialized } = useInitialize();

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="queues" element={<QueuesPage />} />
        <Route path="queues/:queueName" element={<QueueDetailsPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="topics/:topicName" element={<TopicDetailsPage />} />
        <Route path="topics/:topicName/subscriptions/:subscriptionName" element={<SubscriptionDetailsPage />} />
        <Route path="event-hubs" element={<EventHubsPage />} />
        <Route path="auto-reply" element={<AutoReplyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="sbe-theme">
      <BrowserRouter>
        <AppContent />
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
