import React, { useState, useEffect, useMemo } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './EventsCalendar.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faCalendarAlt, faChevronLeft, faChevronRight, faClock } from '@fortawesome/free-solid-svg-icons';
import { IEventItem } from '../Utility/ISPInterface';
import { addToPersonalCalendar } from '../Utility/utils';
import EventModal from './EventModal';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { getEventTimeText } from '../Utility/helpers';
const localizer = momentLocalizer(moment);

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
}

// Hebrew weekday names
const hebrewWeekdays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

const Events: React.FC<IEvents> = ({ eventListData, addedCalendarEvent, setShowLoader }) => {
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [activeModal, setActiveModal] = useState<boolean>(false);
    const [currentEvent, setCurrentEvent] = useState<IEventData | null>(null);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [isMobile, setIsMobile] = useState<boolean>(false);
    // Updated Event Data comes form spo list 
    const [processedEvents, setProcessedEvents] = useState<any[]>([]);

    // Check if mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 480);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Handle Today button click
    const handleTodayClick = () => {
        const today = new Date();
        setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    // Btn Next, Prev, Today click for month navigation
    const navigateMonth = (direction: "next" | "prev" | "today") => {
        setCurrentMonth((prev) => {
            const newMonth = new Date(prev);
            if (direction === "next") newMonth.setMonth(prev.getMonth() + 1);
            else if (direction === "prev") newMonth.setMonth(prev.getMonth() - 1);
            else return new Date(); // today
            return newMonth;
        });
    };

    // Keep track of visible date range
    const handleRangeChange = (range: any) => {
        if (range.start) setCurrentMonth(range.start);
    };

    // Header 
    const CustomWeekHeader: React.FC = () => {
        return (
            <div className={styles.customWeekHeader}>
                {hebrewWeekdays.map((day, index) => (
                    <div
                        key={index}
                        className={styles.calendarHeaderCell}
                        style={{
                            borderLeft: index !== hebrewWeekdays.length - 1 ? "1px solid #ddd" : "none",
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>
        );
    };

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

    const handleSelectEvent = (event: IEventData, e: React.SyntheticEvent) => {
        handleEventClickToOpenModal(event.id.toString(), e as unknown as React.MouseEvent);
    };

    //  Custom Event Cell for Desktop/Tablet
    const CustomEvent: React.FC<{ event: IEventData }> = ({ event }) => {
        const eventDate = moment(event.start).format("DD/MM");

        return (
            <div
                className={`${styles.dayEvent} ${event.category === 'company-event' ? styles.companyEvent : ''
                    } ${event.category === 'general-event' ? styles.generalEvent : ''}`}
                style={{
                    borderColor: event.colorNumber,
                    backgroundColor: event.colorNumber,
                    padding: "4px 5px",
                    borderRadius: "4px"
                }}
                data-event={event.id}
                onClick={(e) => handleEventClickToOpenModal(event.id.toString(), e as unknown as React.MouseEvent)}
            >
                <span>{getEventTimeText(event)} </span>
                <span>{eventDate}</span>
                <span className={styles.eventTime}> {event.subject} </span>
                {event.location && <span className={styles.eventLocation}>{event.location}</span>}
            </div>
        );
    };

    // Custom Event Cell for Mobile - Shows Dots
    const MobileEventDots: React.FC<{ event: IEventData }> = ({ event }) => {
        return (
            <div
                className={styles.mobileDot}
                style={{
                    backgroundColor: event.colorNumber,
                }}
                data-event={event.id}
                onClick={(e) => {
                    e.stopPropagation();
                    handleEventClickToOpenModal(event.id.toString(), e as unknown as React.MouseEvent);
                }}
            />
        );
    };

    // Handle date cell click to show events modal
    const handleDateCellClick = (date: Date) => {
        if (!isMobile) return;

        // Filter events that span this date (including multi-day events)
        const dateEvents = processedEvents.filter((event: IEventData) => {
            const eventStart = moment(event.start).startOf('day');
            const eventEnd = moment(event.end).startOf('day');
            const cellDate = moment(date).startOf('day');

            // Check if the cell date falls between event start and end (inclusive)
            return cellDate.isSameOrAfter(eventStart) && cellDate.isSameOrBefore(eventEnd);
        });

        // If there's only one event, open it directly
        if (dateEvents.length === 1) {
            setCurrentEvent(dateEvents[0]);
            setActiveModal(true);
        }
        // If multiple events, you could show a list or open the first one
        else if (dateEvents.length > 1) {
            setCurrentEvent(dateEvents[0]); // Open first event, or you can create a list modal
            setActiveModal(true);
        }
    };

    // Custom Date Cell Wrapper
    const CustomDateCellWrapper = ({ children, value }: any) => {
        if (!isMobile) {
            return React.cloneElement(React.Children.only(children), {
                onDoubleClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                },
                onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                },
                style: {
                    ...children.props.style,
                    cursor: 'default',
                }
            });
        }

        // Mobile view - add dots under the date
        // Filter events that span this date (including multi-day events)
        const dateEvents = processedEvents.filter((event: IEventData) => {
            const eventStart = moment(event.start).startOf('day');
            const eventEnd = moment(event.end).startOf('day');
            const cellDate = moment(value).startOf('day');

            // Check if the cell date falls between event start and end (inclusive)
            return cellDate.isSameOrAfter(eventStart) && cellDate.isSameOrBefore(eventEnd);
        });

        const hasEvents = dateEvents.length > 0;

        return (
            <div
                className={`${styles.mobileDateCellWrapper} ${hasEvents ? styles.hasEvents : ''}`}
                onClick={() => hasEvents && handleDateCellClick(value)}
                style={{ cursor: hasEvents ? 'pointer' : 'default' }}
            >
                {children}
                {hasEvents && (
                    <div className={styles.mobileDotsContainer}>
                        {dateEvents.slice(0, 3).map((event: IEventData, index: number) => (
                            <div
                                key={event.id}
                                className={styles.mobileDot}
                                style={{
                                    backgroundColor: event.colorNumber,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClickToOpenModal(event.id.toString(), e as unknown as React.MouseEvent);
                                }}
                            />
                        ))}
                        {dateEvents.length > 3 && (
                            <span className={styles.moreEventsIndicator}>+{dateEvents.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const defaultDate = useMemo(() => new Date(2015, 3, 1), []);

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
        <div className={`${styles.eventsContainer} ${styles.eventsContainerGlobal} ${styles.showRtl} ${isMobile ? styles.mobileView : ''}`}>

            <div className={styles.eventsLayout}>
                <div className={styles.mainContent}>
                    <div className={styles.calendarSection}>
                        <div className={styles.calendarHeader}>
                            <h2 className={styles.calendarTitle}>
                                <FontAwesomeIcon icon={faCalendar} />
                                <span>  לוח שנה חודשי</span>
                            </h2>
                            <div className={styles.calendarNav}>
                                <button
                                    className={styles.navBtn}
                                    onClick={() => navigateMonth('next')}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                                <div className={styles.currentMonth}>
                                    {currentMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                                </div>
                                <button
                                    className={styles.navBtn}
                                    onClick={() => navigateMonth('prev')}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <button className={styles.navBtn} onClick={handleTodayClick}>
                                    היום
                                </button>
                            </div>
                        </div>

                        <>
                            <CustomWeekHeader />
                            <Calendar
                                defaultDate={defaultDate}
                                localizer={localizer}
                                events={isMobile ? [] : processedEvents} // Hide events in mobile, show dots via dateCellWrapper
                                startAccessor="start"
                                endAccessor="end"
                                view="month"
                                date={currentMonth}
                                onNavigate={setCurrentMonth}
                                onRangeChange={handleRangeChange}
                                onSelectEvent={handleSelectEvent}
                                style={{ height: '50vh' }}
                                toolbar={false}
                                popup={!isMobile} // Disable popup in mobile
                                views={{
                                    month: true,
                                }}
                                components={{
                                    header: () => null,
                                    event: isMobile ? MobileEventDots : CustomEvent,
                                    dateCellWrapper: CustomDateCellWrapper,
                                }}
                            />
                        </>
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            <EventModal
                isOpen={activeModal}
                eventData={currentEvent}
                onClose={closeModal}
                onAddToCalendar={handleAddToCalendar}
            />
        </div>
    );
};

export default Events;