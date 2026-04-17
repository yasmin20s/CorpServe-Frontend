import { useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

export default function ThemeToggleButton({ className = '' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => mounted && resolvedTheme === 'dark', [mounted, resolvedTheme]);

  const ariaLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}
