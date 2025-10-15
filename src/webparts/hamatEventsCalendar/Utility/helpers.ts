// import { CalendarDay, CalendarEvent, IEventData } from "../components/CalendarEvent";

// // Convert SharePoint UTC string to local Date
// export const convertUTCToLocalDate = (utcString?: string): Date | null => {
//     if (!utcString) return null;
//     const utc = new Date(utcString);
//     return new Date(
//         utc.getUTCFullYear(),
//         utc.getUTCMonth(),
//         utc.getUTCDate(),
//         utc.getUTCHours(),
//         utc.getUTCMinutes(),
//         utc.getUTCSeconds()
//     );
// };

// // Calendar helpers
// export const generateCalendarDays = (month: Date, events: IEventData[]): CalendarDay[] => {
//     const days: CalendarDay[] = [];
//     const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
//     const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
//     const prevMonthLastDay = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
//     const startDay = firstDayOfMonth.getDay();

//     // Previous month's trailing days
//     for (let i = startDay - 1; i >= 0; i--) {
//         days.push({
//             day: prevMonthLastDay - i,
//             otherMonth: true,
//             date: new Date(month.getFullYear(), month.getMonth() - 1, prevMonthLastDay - i)
//         });
//     }

//     // Current month days
//     for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
//         const date = new Date(month.getFullYear(), month.getMonth(), i);
//         days.push({
//             day: i,
//             otherMonth: false,
//             date,
//             isToday: isToday(date),
//             events: getEventsForDate(date, events)
//         });
//     }

//     // Next month's leading days
//     const totalCells = 42;
//     const nextMonthDays = totalCells - days.length;
//     for (let i = 1; i <= nextMonthDays; i++) {
//         days.push({
//             day: i,
//             otherMonth: true,
//             date: new Date(month.getFullYear(), month.getMonth() + 1, i)
//         });
//     }

//     return days;
// };

// export const isToday = (date: Date): boolean => {
//     const today = new Date();
//     return date.getDate() === today.getDate() &&
//         date.getMonth() === today.getMonth() &&
//         date.getFullYear() === today.getFullYear();
// };

// // Match events to calendar date
// export const getEventsForDate = (date: Date, events: IEventData[]): CalendarEvent[] | undefined => {
//     const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
//     const dateEvents: CalendarEvent[] = [];

//     events.forEach(event => {
//         if (!event.startDate || !event.endDate) return;

//         const eventStart = new Date(event.startDate);
//         const eventEnd = new Date(event.endDate);

//         const startDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()).getTime();
//         const endDay = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate(), 23, 59, 59, 999).getTime();

//         if (normalizedDate >= startDay && normalizedDate <= endDay) {
//             dateEvents.push({
//                 id: event.id.toString(),
//                 time: event.allDayEvent ? "כל היום" : formatEventTime(eventStart),
//                 title: event.title,
//                 location: event.location,
//                 type: event.category === "חג" ? "general-event" : "company-event",
//                 eventData: event
//             });
//         }
//     });

//     return dateEvents.length > 0 ? dateEvents : undefined;
// };

// // Display local time
// export const formatEventTime = (date?: Date | string | null): string => {
//     if (!date) return "";

//     const d = typeof date === "string" ? new Date(date) : new Date(date.getTime());

//     // Display in 24-hour format using local time
//     return d.toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit" });
// };


export const getMonthName = (monthNumber: number): string => {
    const months = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return months[monthNumber - 1] || '';
};

export const formatEventTime = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return ''; // handle null, undefined, or empty
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return ''; // handle invalid date
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};
