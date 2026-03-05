import { Link } from 'react-router-dom';
import { Settings, Moon, Sun, Plug, PlugZap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useTheme } from '@/components/common/ThemeProvider';
import { useConnectionStore } from '@/store/useConnectionStore';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { activeConnection } = useConnectionStore();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Service Bus Explorer</h1>
        {activeConnection && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PlugZap className="h-4 w-4 text-green-500" />
            <span>{activeConnection.namespace || activeConnection.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link to="/connections">
          <Button variant="ghost" size="icon" title="Connections">
            <Plug className="h-5 w-5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        <Link to="/settings">
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
