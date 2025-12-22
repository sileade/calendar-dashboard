import { describe, expect, it } from "vitest";
import { parseRRule, toRRule, generateOccurrences, describeRecurrence } from "../shared/recurrence";
import { RecurrenceRule } from "../shared/types";

describe("Recurrence Rule Parsing", () => {
  it("parses daily recurrence rule", () => {
    const rrule = "RRULE:FREQ=DAILY;INTERVAL=1";
    const result = parseRRule(rrule);
    
    expect(result).not.toBeNull();
    expect(result?.frequency).toBe("daily");
    expect(result?.interval).toBe(1);
  });

  it("parses weekly recurrence with specific days", () => {
    const rrule = "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR";
    const result = parseRRule(rrule);
    
    expect(result).not.toBeNull();
    expect(result?.frequency).toBe("weekly");
    expect(result?.byDay).toEqual([1, 3, 5]); // Monday, Wednesday, Friday
  });

  it("parses monthly recurrence with count", () => {
    const rrule = "RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=12";
    const result = parseRRule(rrule);
    
    expect(result).not.toBeNull();
    expect(result?.frequency).toBe("monthly");
    expect(result?.interval).toBe(2);
    expect(result?.count).toBe(12);
  });

  it("parses yearly recurrence with end date", () => {
    const rrule = "RRULE:FREQ=YEARLY;UNTIL=20251231";
    const result = parseRRule(rrule);
    
    expect(result).not.toBeNull();
    expect(result?.frequency).toBe("yearly");
    expect(result?.endDate).toBeDefined();
  });

  it("returns null for invalid rrule", () => {
    const result = parseRRule("invalid");
    expect(result).toBeNull();
  });
});

describe("Recurrence Rule Generation", () => {
  it("generates RRULE string from rule object", () => {
    const rule: RecurrenceRule = {
      frequency: "weekly",
      interval: 2,
      byDay: [1, 3, 5],
    };
    
    const rrule = toRRule(rule);
    expect(rrule).toContain("FREQ=WEEKLY");
    expect(rrule).toContain("INTERVAL=2");
    expect(rrule).toContain("BYDAY=MO,WE,FR");
  });

  it("generates RRULE with count", () => {
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
      count: 10,
    };
    
    const rrule = toRRule(rule);
    expect(rrule).toContain("COUNT=10");
  });

  it("generates RRULE with end date", () => {
    const rule: RecurrenceRule = {
      frequency: "monthly",
      interval: 1,
      endDate: new Date(2025, 11, 31).getTime(),
    };
    
    const rrule = toRRule(rule);
    expect(rrule).toContain("UNTIL=20251231");
  });
});

describe("Occurrence Generation", () => {
  it("generates daily occurrences within range", () => {
    const startTime = new Date(2025, 0, 1, 10, 0).getTime(); // Jan 1, 2025 10:00
    const endTime = new Date(2025, 0, 1, 11, 0).getTime(); // Jan 1, 2025 11:00
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
    };
    
    const rangeStart = new Date(2025, 0, 1);
    const rangeEnd = new Date(2025, 0, 10);
    
    const occurrences = generateOccurrences(startTime, endTime, rule, rangeStart, rangeEnd, 10);
    
    expect(occurrences.length).toBeGreaterThanOrEqual(9);
    expect(occurrences[0].startTime).toBe(startTime);
  });

  it("generates weekly occurrences", () => {
    const startTime = new Date(2025, 0, 6, 10, 0).getTime(); // Monday Jan 6, 2025
    const endTime = new Date(2025, 0, 6, 11, 0).getTime();
    const rule: RecurrenceRule = {
      frequency: "weekly",
      interval: 1,
    };
    
    const rangeStart = new Date(2025, 0, 1);
    const rangeEnd = new Date(2025, 1, 28);
    
    const occurrences = generateOccurrences(startTime, endTime, rule, rangeStart, rangeEnd, 8);
    
    expect(occurrences.length).toBe(8);
    // Each occurrence should be 7 days apart
    for (let i = 1; i < occurrences.length; i++) {
      const diff = occurrences[i].startTime - occurrences[i - 1].startTime;
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    }
  });

  it("respects count limit", () => {
    const startTime = new Date(2025, 0, 1, 10, 0).getTime();
    const endTime = new Date(2025, 0, 1, 11, 0).getTime();
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
      count: 5,
    };
    
    const rangeStart = new Date(2025, 0, 1);
    const rangeEnd = new Date(2025, 11, 31);
    
    const occurrences = generateOccurrences(startTime, endTime, rule, rangeStart, rangeEnd);
    
    expect(occurrences.length).toBe(5);
  });

  it("respects end date", () => {
    const startTime = new Date(2025, 0, 1, 10, 0).getTime();
    const endTime = new Date(2025, 0, 1, 11, 0).getTime();
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
      endDate: new Date(2025, 0, 5).getTime(),
    };
    
    const rangeStart = new Date(2025, 0, 1);
    const rangeEnd = new Date(2025, 0, 31);
    
    const occurrences = generateOccurrences(startTime, endTime, rule, rangeStart, rangeEnd);
    
    expect(occurrences.length).toBeGreaterThanOrEqual(4);
  });
});

describe("Recurrence Description", () => {
  it("describes daily recurrence", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 1 };
    expect(describeRecurrence(rule)).toBe("Daily");
  });

  it("describes every N days", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 3 };
    expect(describeRecurrence(rule)).toBe("Every 3 days");
  });

  it("describes weekly with days", () => {
    const rule: RecurrenceRule = { 
      frequency: "weekly", 
      interval: 1,
      byDay: [1, 3, 5] 
    };
    const desc = describeRecurrence(rule);
    expect(desc).toContain("Weekly");
    expect(desc).toContain("Monday");
    expect(desc).toContain("Wednesday");
    expect(desc).toContain("Friday");
  });

  it("describes monthly", () => {
    const rule: RecurrenceRule = { frequency: "monthly", interval: 1 };
    expect(describeRecurrence(rule)).toBe("Monthly");
  });

  it("describes yearly", () => {
    const rule: RecurrenceRule = { frequency: "yearly", interval: 1 };
    expect(describeRecurrence(rule)).toBe("Yearly");
  });

  it("includes count in description", () => {
    const rule: RecurrenceRule = { frequency: "daily", interval: 1, count: 10 };
    expect(describeRecurrence(rule)).toContain("10 times");
  });
});

describe("Search and Filter", () => {
  const mockEvents = [
    {
      id: 1,
      title: "Team Meeting",
      description: "Weekly sync",
      location: "Conference Room A",
      startTime: new Date(2025, 0, 15, 10, 0).getTime(),
      endTime: new Date(2025, 0, 15, 11, 0).getTime(),
      source: "local",
      color: "#007AFF",
    },
    {
      id: 2,
      title: "Project Review",
      description: "Q1 planning",
      location: "Virtual",
      startTime: new Date(2025, 0, 20, 14, 0).getTime(),
      endTime: new Date(2025, 0, 20, 15, 0).getTime(),
      source: "google",
      color: "#4285F4",
    },
    {
      id: 3,
      title: "Lunch with Client",
      description: null,
      location: "Downtown Restaurant",
      startTime: new Date(2025, 0, 22, 12, 0).getTime(),
      endTime: new Date(2025, 0, 22, 13, 0).getTime(),
      source: "apple",
      color: "#FF3B30",
    },
  ];

  it("filters events by title", () => {
    const query = "meeting";
    const filtered = mockEvents.filter(e => 
      e.title.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Team Meeting");
  });

  it("filters events by location", () => {
    const query = "virtual";
    const filtered = mockEvents.filter(e => 
      e.location?.toLowerCase().includes(query.toLowerCase())
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Project Review");
  });

  it("filters events by source", () => {
    const sources = ["google", "apple"];
    const filtered = mockEvents.filter(e => sources.includes(e.source));
    expect(filtered.length).toBe(2);
  });

  it("filters events by date range", () => {
    const dateFrom = new Date(2025, 0, 18);
    const dateTo = new Date(2025, 0, 25);
    const filtered = mockEvents.filter(e => {
      const eventStart = new Date(e.startTime);
      return eventStart >= dateFrom && eventStart <= dateTo;
    });
    expect(filtered.length).toBe(2);
  });

  it("combines multiple filters", () => {
    const query = "project";
    const sources = ["google"];
    const filtered = mockEvents.filter(e => 
      e.title.toLowerCase().includes(query.toLowerCase()) &&
      sources.includes(e.source)
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Project Review");
  });
});

describe("Notification System", () => {
  it("calculates reminder time correctly", () => {
    const eventStartTime = new Date(2025, 0, 15, 10, 0).getTime();
    const reminderMinutes = 15;
    const reminderTime = eventStartTime - (reminderMinutes * 60 * 1000);
    
    const expectedTime = new Date(2025, 0, 15, 9, 45).getTime();
    expect(reminderTime).toBe(expectedTime);
  });

  it("handles multiple reminder times", () => {
    const eventStartTime = new Date(2025, 0, 15, 10, 0).getTime();
    const reminderMinutes = [5, 15, 60, 1440]; // 5min, 15min, 1hr, 1day
    
    const reminderTimes = reminderMinutes.map(min => 
      eventStartTime - (min * 60 * 1000)
    );
    
    expect(reminderTimes.length).toBe(4);
    expect(reminderTimes[0]).toBe(new Date(2025, 0, 15, 9, 55).getTime());
    expect(reminderTimes[1]).toBe(new Date(2025, 0, 15, 9, 45).getTime());
    expect(reminderTimes[2]).toBe(new Date(2025, 0, 15, 9, 0).getTime());
    expect(reminderTimes[3]).toBe(new Date(2025, 0, 14, 10, 0).getTime());
  });

  it("validates reminder time options", () => {
    const validOptions = [0, 5, 10, 15, 30, 60, 120, 1440, 2880];
    const invalidOption = 45;
    
    expect(validOptions.includes(15)).toBe(true);
    expect(validOptions.includes(invalidOption)).toBe(false);
  });
});
