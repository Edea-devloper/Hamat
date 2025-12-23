import moment from 'moment';
import { IEventData } from '../components/CalendarEvent';

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


export const getEventTimeText = (event: IEventData) => {
    if (!event) return '';

    if (event.allDayEvent) {
        return 'כל היום'; // "All day" in Hebrew
    }

    const startTime = moment(event.start).format('HH:mm');
    const endTime = moment(event.end).format('HH:mm');

    return `${startTime} - ${endTime}`;
}
