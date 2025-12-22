import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REMINDER_OPTIONS, ReminderTime } from '@shared/types';
import { Bell, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderSelectorProps {
  value: ReminderTime[];
  onChange: (reminders: ReminderTime[]) => void;
  maxReminders?: number;
}

export function ReminderSelector({ value, onChange, maxReminders = 5 }: ReminderSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);

  const addReminder = (time: ReminderTime) => {
    if (!value.includes(time) && value.length < maxReminders) {
      onChange([...value, time].sort((a, b) => a - b));
    }
    setIsAdding(false);
  };

  const removeReminder = (time: ReminderTime) => {
    onChange(value.filter(t => t !== time));
  };

  const availableOptions = REMINDER_OPTIONS.filter(opt => !value.includes(opt.value));

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Reminders
      </Label>
      
      <div className="space-y-2">
        {value.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground">No reminders set</p>
        )}
        
        {value.map((time) => {
          const option = REMINDER_OPTIONS.find(o => o.value === time);
          return (
            <div
              key={time}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <span className="text-sm">{option?.label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeReminder(time)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}

        {isAdding ? (
          <div className="flex gap-2">
            <Select onValueChange={(v) => addReminder(parseInt(v) as ReminderTime)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          value.length < maxReminders && availableOptions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add reminder
            </Button>
          )
        )}
      </div>
    </div>
  );
}
