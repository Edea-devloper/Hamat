import React, { useState, useEffect, useMemo } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './HamatUpcomingEvent.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { IEventItem } from '../Utility/ISPInterface';
import { addToPersonalCalendar } from '../Utility/utils';
import EventItem from './EventItem';
import EventModal from './EventModal';

// Type definitions
export interface IEventData {
    id: number;
    title: string;
    subject: string;
    start: Date | null;
    end: Date | null;
    location: string;
    company: string[];
    description: string | null;
    link: ILink;
    additionalInfo: string;
    allDayEvent: boolean;
    category: string;
    colorName: string;
    colorNumber: string;
    author: string;
    durationDays: number;
    isAlreadyAdded: boolean;
}

interface ILink {
    Description: string,
    Url: string
}
export interface CalendarDay {
    day: number;
    otherMonth: boolean;
    date: Date;
    isToday?: boolean;
    events?: CalendarEvent[];
}
export interface CalendarEvent {
    id: string;
    time: string;
    title: string;
    location: string;
    type?: string;
    eventData?: IEventData;
}
export interface IEvents {
    eventListData: IEventItem[];
    addedCalendarEvent: any;
    upcomingDays: any;
    previousDays: any;
    setShowLoader: React.Dispatch<React.SetStateAction<boolean>>;
    eventDisplayTitle: string;
    defaultColor: string;
}

const Events: React.FC<IEvents> = ({ eventListData, addedCalendarEvent, setShowLoader, eventDisplayTitle, defaultColor }) => {
    const [activeModal, setActiveModal] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<IEventData | null>(null);
    // Updated Event Data comes form spo list 
    const [processedEvents, setProcessedEvents] = useState<any[]>([]);

    useEffect(() => {
        setShowLoader(true);

        const processed = eventListData.map(item => {

            const start = item?.StartDate
                ? new Date(item.StartDate) // Convert UTC → local automatically
                : item?.EndDate
                    ? new Date(new Date(item.EndDate).getTime() - 60 * 60 * 1000) // 1 hour before End
                    : new Date();

            const end = item?.EndDate
                ? new Date(item.EndDate)
                : start
                    ? new Date(start.getTime() + 60 * 60 * 1000) // 1 hour after Start
                    : new Date();

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                console.warn('Skipping invalid event date:', item);
                return null;
            }
            // Check if already added
            const isAlreadyAdded = addedCalendarEvent.some((ev: any) =>
                ev.categories.includes(item.Id.toString())
            );

            return {
                id: item.Id,
                title: item?.Title,
                start,
                end,
                allDay: false,
                subject: item?.Subject,
                location: item?.Location,
                company: item?.Company,
                description: item?.Details,
                link: item?.Link,
                additionalInfo: item?.Subject || "",
                allDayEvent: item?.AllDayEvent,
                category: item?.Category,
                colorName: item?.ColorCode?.ColorName || "Default",
                colorNumber: item?.ColorCode?.ColorNumber || "#007bff",
                author: item?.Author?.Title || "Unknown",
                isAlreadyAdded,
            } as any;
        });

        setProcessedEvents(processed);
        setShowLoader(false);
    }, [eventListData, addedCalendarEvent]);


    const handleAddToCalendar = async (eventData: IEventData): Promise<void> => {
        try {
            // Show Loader
            setShowLoader(true);

            // Call your Graph API add function
            await addToPersonalCalendar(eventData);

            // Update the processedEvents state: mark the event as added
            setProcessedEvents((prevEvents: any) =>
                prevEvents.map((ev: any) =>
                    ev.id === eventData.id ? { ...ev, isAlreadyAdded: true } : ev
                )
            );

            // Hide Loader
            setShowLoader(false);
        } catch (error) {
            // Hide Loader
            setShowLoader(false);

            console.error("Error adding event:", error);
            throw error;
        }
    };

    // Close modal
    const closeModal = (): void => {
        setActiveModal(false);
        setCurrentEvent(null);
    };

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && activeModal) {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [activeModal]);

    // Event click to Open a Modal 
    const handleEventClickToOpenModal = (eventId: string, e?: React.MouseEvent): void => {
        if (e && e.target instanceof Element && e.target.closest('.calendar-btn')) {
            return;
        }

        const event = processedEvents.find((evt: any) => evt.id.toString() === eventId);
        if (event) {
            setCurrentEvent(event);
            setActiveModal(true);
        }
    };


    // Add this CSS to close popup on scroll
    useEffect(() => {
        const handleScrollOrClick = (e: Event) => {
            const overlay = document.querySelector('.rbc-overlay') as HTMLElement;
            const moreLink = document.querySelector('.rbc-show-more');

            if (overlay) {
                // If scrolling, hide the popup
                if (e.type === 'scroll') {
                    overlay.style.display = 'none';
                }
                // If clicking outside, hide the popup
                if (e.type === 'click' &&
                    !overlay.contains(e.target as Node) &&
                    !moreLink?.contains(e.target as Node)) {
                    overlay.style.display = 'none';
                }
            }
        };

        // Add event listeners
        window.addEventListener('scroll', handleScrollOrClick, true);
        document.addEventListener('click', handleScrollOrClick, true);

        return () => {
            window.removeEventListener('scroll', handleScrollOrClick, true);
            document.removeEventListener('click', handleScrollOrClick, true);
        };
    }, []);

    return (
        <div className={`${styles.eventsContainer} ${styles.Upcoming_Events_Container} ${styles.showRtl}`}>
            <div className={styles.eventsLayout}>
                <div className={styles.sidebar}>
                    <div className={styles.upcomingEvents}>
                        <div className={styles.widgetHeader}>
                            <h3 className={styles.widgetTitle}>
                                <FontAwesomeIcon icon={faClock} />
                                {eventDisplayTitle}
                            </h3>
                        </div>

                        {/* Upcoming Events Item  */}
                        <div className={styles.eventsList}>
                            {processedEvents.map((eventData: any) => (
                                <EventItem
                                    key={eventData.id}
                                    eventData={eventData}
                                    onEventClick={handleEventClickToOpenModal}
                                    onAddToCalendar={handleAddToCalendar}
                                    defaultColor={defaultColor}
                                />
                            ))}
                            {processedEvents.length === 0 && (
                                <div dir="rtl">
                                    {`אין ${eventDisplayTitle}`}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            <EventModal
                isOpen={activeModal}
                eventData={currentEvent}
                onClose={closeModal}
                onAddToCalendar={handleAddToCalendar}
                defaultColor={defaultColor}
            />
        </div>
    );
};

export default Events;