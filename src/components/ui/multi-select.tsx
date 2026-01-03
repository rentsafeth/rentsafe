'use client';

import * as React from 'react';
import { Check, X, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export type OptionType = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: OptionType[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export default function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleDeselect = (value: string) => {
        onChange(selected.filter((s) => s !== value));
    };

    const handleSelect = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((s) => s !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-h-[40px] h-auto"
                >
                    <div className="flex gap-1 flex-wrap">
                        {selected.length === 0 && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {selected.slice(0, 3).map((value) => {
                            const option = options.find((o) => o.value === value);
                            return (
                                <Badge
                                    variant="secondary"
                                    key={value}
                                    className="mr-1 mb-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeselect(value);
                                    }}
                                >
                                    {option?.label}
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleDeselect(value);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleDeselect(value)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            );
                        })}
                        {selected.length > 3 && (
                            <Badge variant="secondary" className="mr-1 mb-1">
                                +{selected.length - 3} more
                            </Badge>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => handleSelect(option.value)}
                            >
                                <div
                                    className={cn(
                                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                        selected.includes(option.value)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'opacity-50 [&_svg]:invisible'
                                    )}
                                >
                                    <Check className={cn('h-4 w-4')} />
                                </div>
                                <span>{option.label}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
