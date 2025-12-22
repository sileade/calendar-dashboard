import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Event } from '../../../../drizzle/schema';
import { CALENDAR_COLORS } from '@shared/types';
import { MapPin, Clock, AlignLeft, Palette, Trash2 } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  initialDate?: Date;
  onSave: (eventData: {
    title: string;
    description?: string;
    location?: string;
    startTime: number;
    endTime: number;
    isAllDay: boolean;
    color: string;
  }) => void;
  onDelete?: (eventId: number) => void;
}

export function EventModal({ isOpen, onClose, event, initialDate, onSave, onDelete }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [color, setColor] = useState('#007AFF');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setIsAllDay(event.isAllDay);
      setColor(event.color || '#007AFF');
    } else if (initialDate) {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(format(initialDate, 'yyyy-MM-dd'));
      setStartTime(format(initialDate, 'HH:mm'));
      setEndDate(format(initialDate, 'yyyy-MM-dd'));
      const endHour = new Date(initialDate);
      endHour.setHours(endHour.getHours() + 1);
      setEndTime(format(endHour, 'HH:mm'));
      setIsAllDay(false);
      setColor('#007AFF');
    }
  }, [event, initialDate, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;

    const startDateTime = isAllDay
      ? new Date(`${startDate}T00:00:00`).getTime()
      : new Date(`${startDate}T${startTime}`).getTime();
    
    const endDateTime = isAllDay
      ? new Date(`${endDate}T23:59:59`).getTime()
      : new Date(`${endDate}T${endTime}`).getTime();

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      isAllDay,
      color,
    });
    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] apple-shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {event ? 'Edit Event' : 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Title */}
          <div>
            <Input
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="all-day" className="text-sm font-medium">All Day</Label>
            <Switch
              id="all-day"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
                {!isAllDay && (
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
                {!isAllDay && (
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <AlignLeft className="w-5 h-5 text-muted-foreground mt-2" />
            <Textarea
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 min-h-[80px] resize-none"
            />
          </div>

          {/* Color */}
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 flex gap-2 flex-wrap">
              {CALENDAR_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {event && onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {event ? 'Save' : 'Add'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
