'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllStates, normalizeStateName, searchStates } from '@/lib/utils/state-selector';

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  id?: string;
  label?: string;
}

export function StateSelector({ 
  value, 
  onChange, 
  required = false,
  placeholder = "Select or search state...",
  id = "state",
  label = "State"
}: StateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allStates = useMemo(() => getAllStates(), []);
  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return allStates;
    return searchStates(searchQuery);
  }, [searchQuery, allStates]);

  const selectedStateName = value ? normalizeStateName(value) : '';

  const handleSelect = (state: string) => {
    const normalized = normalizeStateName(state);
    onChange(normalized);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            id={id}
            type="button"
          >
            {selectedStateName || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredStates.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No states found. Try a different search.
              </div>
            ) : (
              filteredStates.map((state) => (
                <button
                  key={state}
                  onClick={() => handleSelect(state)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                    selectedStateName === state && "bg-accent"
                  )}
                >
                  {state}
                  {selectedStateName === state && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      {/* Hidden input for form submission */}
      <input type="hidden" name={id} value={selectedStateName} />
    </div>
  );
}

