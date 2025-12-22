import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RecurrenceRule, RecurrenceFrequency } from '@shared/types';
import { toRRule, parseRRule, describeRecurrence } from '@shared/recurrence';
import { CalendarIcon, Repeat, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurrenceSelectorProps {
  value: string | null;
  onChange: (rrule: string | null) => void;
  eventStartDate?: Date;
}

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const WEEKDAYS = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

export function RecurrenceSelector({ value, onChange, eventStartDate }: RecurrenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rule, setRule] = useState<RecurrenceRule>(() => {
    if (value) {
      const parsed = parseRRule(value);
      if (parsed) return parsed;
    }
    return {
      frequency: 'weekly',
      interval: 1,
      byDay: eventStartDate ? [eventStartDate.getDay()] : [1],
    };
  });
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>(
    rule.endDate ? 'date' : rule.count ? 'count' : 'never'
  );

  useEffect(() => {
    if (value) {
      const parsed = parseRRule(value);
      if (parsed) {
        setRule(parsed);
        setEndType(parsed.endDate ? 'date' : parsed.count ? 'count' : 'never');
      }
    }
  }, [value]);

  const handleSave = () => {
    const finalRule: RecurrenceRule = {
      ...rule,
      endDate: endType === 'date' ? rule.endDate : undefined,
      count: endType === 'count' ? rule.count : undefined,
    };
    onChange(toRRule(finalRule));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const toggleDay = (day: number) => {
    const currentDays = rule.byDay || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    setRule({ ...rule, byDay: newDays.length > 0 ? newDays : undefined });
  };

  const description = value ? describeRecurrence(parseRRule(value)!) : null;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Repeat</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Repeat className="mr-2 h-4 w-4" />
            {description || 'Does not repeat'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Custom Recurrence</h4>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-auto p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Repeat every</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={rule.interval}
                  onChange={(e) => setRule({ ...rule, interval: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <Select
                  value={rule.frequency}
                  onValueChange={(v) => setRule({ ...rule, frequency: v as RecurrenceFrequency })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weekly day selector */}
            {rule.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Repeat on</Label>
                <div className="flex gap-1">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                        rule.byDay?.includes(day.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                      title={day.fullLabel}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly day selector */}
            {rule.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">On day</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={rule.byMonthDay?.[0] || eventStartDate?.getDate() || 1}
                  onChange={(e) => setRule({ 
                    ...rule, 
                    byMonthDay: [parseInt(e.target.value) || 1] 
                  })}
                  className="w-20"
                />
              </div>
            )}

            {/* End condition */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ends</Label>
              <RadioGroup value={endType} onValueChange={(v) => setEndType(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="end-never" />
                  <Label htmlFor="end-never" className="font-normal">Never</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="end-date" />
                  <Label htmlFor="end-date" className="font-normal">On date</Label>
                  {endType === 'date' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "ml-2 h-8",
                            !rule.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {rule.endDate 
                            ? format(new Date(rule.endDate), 'MMM d, yyyy')
                            : 'Pick date'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={rule.endDate ? new Date(rule.endDate) : undefined}
                          onSelect={(date) => setRule({ 
                            ...rule, 
                            endDate: date?.getTime() 
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="count" id="end-count" />
                  <Label htmlFor="end-count" className="font-normal">After</Label>
                  {endType === 'count' && (
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={rule.count || 10}
                        onChange={(e) => setRule({ 
                          ...rule, 
                          count: parseInt(e.target.value) || 10 
                        })}
                        className="w-16 h-8"
                      />
                      <span className="text-sm text-muted-foreground">occurrences</span>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
