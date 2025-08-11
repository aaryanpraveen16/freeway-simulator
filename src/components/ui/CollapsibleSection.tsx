import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = true,
  className,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between py-2 text-sm font-medium transition-colors hover:text-foreground/80"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center">
          {isCollapsed ? (
            <ChevronRight className="mr-2 h-4 w-4" />
          ) : (
            <ChevronDown className="mr-2 h-4 w-4" />
          )}
          {title}
        </div>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isCollapsed ? 'max-h-0' : 'max-h-[2000px]',
        )}
      >
        <div className="pb-2">{children}</div>
      </div>
    </div>
  );
}
