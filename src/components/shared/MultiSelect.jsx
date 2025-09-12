import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

const MultiSelect = ({
  trigger,
  label,
  options,
  selectedValues,
  onSelectionChange,
}) => {
  const handleSelect = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-white/20 text-white max-h-60 overflow-y-auto">
        <DropdownMenuLabel className="text-gray-300">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(e) => {
              e.preventDefault();
              handleSelect(option.value);
            }}
            className="text-gray-200 focus:bg-slate-700 flex items-center"
          >
            <Checkbox
              checked={selectedValues.includes(option.value)}
              className="mr-2"
              aria-label={`Select ${option.label}`}
            />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MultiSelect;