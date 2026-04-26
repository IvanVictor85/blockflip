'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Toggle theme"
          className="relative h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          {/* Sun — visible in light mode */}
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          {/* Moon — visible in dark mode */}
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[130px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {[
            { value: 'light', label: 'Light', Icon: Sun },
            { value: 'dark',  label: 'Dark',  Icon: Moon },
            { value: 'system',label: 'System', Icon: Monitor },
          ].map(({ value, label, Icon }) => (
            <DropdownMenu.Item
              key={value}
              onClick={() => setTheme(value)}
              className={[
                'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm cursor-pointer',
                'select-none outline-none transition-colors',
                'hover:bg-muted focus:bg-muted',
                theme === value ? 'text-[#14F195] font-medium' : 'text-foreground',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
