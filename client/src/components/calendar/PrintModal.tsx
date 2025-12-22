import { useState, useRef } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Event } from '../../../../drizzle/schema';
import { Printer, Download } from 'lucide-react';
import { PrintFormat, PrintOrientation } from '@shared/types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  events: Event[];
}

export function PrintModal({ isOpen, onClose, currentDate, events }: PrintModalProps) {
  const [paperFormat, setPaperFormat] = useState<PrintFormat>('A4');
  const [orientation, setOrientation] = useState<PrintOrientation>('portrait');
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [includeEventDetails, setIncludeEventDetails] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @page {
          size: ${paperFormat} ${orientation};
          margin: 1cm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .calendar-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .calendar-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .calendar-header p {
          font-size: 14px;
          color: #666;
          margin: 5px 0 0;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }
        .weekday-header {
          background: #f5f5f7;
          padding: 10px;
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #666;
          border-bottom: 1px solid #e5e5e5;
        }
        .day-cell {
          min-height: ${paperFormat === 'A3' ? '120px' : '80px'};
          padding: 8px;
          border-right: 1px solid #e5e5e5;
          border-bottom: 1px solid #e5e5e5;
          background: white;
        }
        .day-cell:nth-child(7n) {
          border-right: none;
        }
        .day-cell.other-month {
          background: #fafafa;
          opacity: 0.5;
        }
        .day-cell.today {
          background: #f0f7ff;
        }
        .day-number {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .day-number.today {
          background: #007AFF;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .event-item {
          font-size: 9px;
          padding: 2px 4px;
          margin-bottom: 2px;
          border-radius: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .week-number {
          font-size: 10px;
          color: #999;
          margin-top: 4px;
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calendar - ${format(currentDate, 'MMMM yyyy')}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getDaysForMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return isSameDay(eventStart, date);
    });
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = getDaysForMonth();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Options */}
          <div className="space-y-4">
            <div>
              <Label>Paper Size</Label>
              <Select value={paperFormat} onValueChange={(v) => setPaperFormat(v as PrintFormat)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="A3">A3 (297 × 420 mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Orientation</Label>
              <Select value={orientation} onValueChange={(v) => setOrientation(v as PrintOrientation)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Show Week Numbers</Label>
              <Switch checked={showWeekNumbers} onCheckedChange={setShowWeekNumbers} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Include Event Details</Label>
              <Switch checked={includeEventDetails} onCheckedChange={setIncludeEventDetails} />
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-3 bg-muted/30 overflow-hidden">
            <div className="text-xs text-muted-foreground mb-2">Preview</div>
            <div
              className={`bg-white rounded shadow-sm overflow-hidden ${
                orientation === 'landscape' ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'
              }`}
              style={{ maxHeight: '200px' }}
            >
              <div className="p-2 text-center border-b">
                <div className="text-[8px] font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200 p-px">
                {weekDays.map((day) => (
                  <div key={day} className="bg-gray-100 text-[4px] text-center py-0.5">
                    {day.slice(0, 1)}
                  </div>
                ))}
                {days.slice(0, 35).map((day, idx) => (
                  <div
                    key={idx}
                    className={`bg-white text-[4px] p-0.5 ${
                      !isSameMonth(day, currentDate) ? 'opacity-30' : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden print content */}
        <div className="hidden">
          <div ref={printRef}>
            <div className="calendar-header">
              <h1>{format(currentDate, 'MMMM yyyy')}</h1>
              <p>Printed on {format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
            <div className="calendar-grid">
              {weekDays.map((day) => (
                <div key={day} className="weekday-header">
                  {day}
                </div>
              ))}
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={idx}
                    className={`day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isCurrentDay ? 'today' : ''}`}
                  >
                    <div className={`day-number ${isCurrentDay ? 'today' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    {includeEventDetails && dayEvents.slice(0, paperFormat === 'A3' ? 5 : 3).map((event) => (
                      <div
                        key={event.id}
                        className="event-item"
                        style={{
                          backgroundColor: `${event.color}20`,
                          color: event.color || '#007AFF',
                          borderLeft: `2px solid ${event.color || '#007AFF'}`,
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > (paperFormat === 'A3' ? 5 : 3) && (
                      <div className="event-item" style={{ color: '#666' }}>
                        +{dayEvents.length - (paperFormat === 'A3' ? 5 : 3)} more
                      </div>
                    )}
                    {showWeekNumbers && idx % 7 === 0 && (
                      <div className="week-number">W{getWeekNumber(day)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
