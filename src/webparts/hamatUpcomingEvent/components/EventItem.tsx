import React from 'react';

import { getEventTimeText, getMonthName } from "../Utility/helpers";
import styles from './HamatUpcomingEvent.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faCheck, faClock, faMapMarkerAlt, faVideo } from '@fortawesome/free-solid-svg-icons';
import { IEventData } from './CalendarEvent';

export interface EventItemProps {
    eventData: IEventData;
    onEventClick: (eventId: string, e: React.MouseEvent) => void;
    onAddToCalendar: (eventData: IEventData) => Promise<void>;
    defaultColor: string;
}


const EventItem: React.FC<EventItemProps> = ({ eventData, onEventClick, onAddToCalendar, defaultColor }) => {
    const [added, setAdded] = React.useState(false);

    // Handle click on "Add to Calendar" button in the sidebar items
    const handleOnBunClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        try {
            await onAddToCalendar(eventData);
            setAdded(true);
        } catch (err) {
            console.error("Error adding event:", err);
        }
    };

    const formatDate = (date: Date): { day: string; month: string } => {
        return {
            day: date.getDate().toString().padStart(2, '0'),
            month: getMonthName(date.getMonth() + 1)
        };
    };

    const { day, month } = eventData?.start ? formatDate(eventData.start) : { day: "--", month: "--" };

    return (
        <div
            className={styles.eventItem}
            style={{ borderLeft: `4px solid ${defaultColor}` }}
            data-event={eventData.id}
            onClick={(e) => onEventClick(eventData.id.toString(), e)}
        >
            {/* defaultColor is set on property pane */}
            <div className={styles.eventDate} style={{ background: defaultColor }}>
                <div className={styles.eventDay}>{day}</div>
                <div className={styles.eventMonth}>{month}</div>
            </div>

            <div className={styles.eventDetails}>
                <div className={styles.eventTitle}>{eventData.subject}</div>
                <div className={styles.eventMeta}>
                    <div className={styles.metaItem}>
                        <FontAwesomeIcon icon={faClock} />
                        <span>
                            {/* {eventData.allDayEvent ? 'כל היום' : `${formatEventTime(eventData?.start)} - ${formatEventTime(eventData?.end)}`} */}
                            {getEventTimeText(eventData)}
                        </span>
                    </div>

                    {eventData?.location && eventData.location.trim() !== "" && (
                        <div className={styles.metaItem}>
                            <FontAwesomeIcon
                                icon={
                                    eventData.location.toLowerCase().includes("zoom") ||
                                        eventData.location.toLowerCase().includes("teams")
                                        ? faVideo
                                        : faMapMarkerAlt
                                }
                                className={styles.metaIcon}
                            />
                            <span>
                                <a
                                    href={eventData.link?.Url || '#'}
                                    title={eventData.link?.Url || ''}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.eventLinkNoColor}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {eventData.location}
                                </a>
                            </span>
                        </div>
                    )}

                </div>
                <div className={styles.eventCompany}>
                    {eventData?.company?.map((comp, index) => (
                        <span key={index} className={styles.companyBadge}>{comp}</span>
                    ))}
                </div>
            </div>

            <div
                className={styles.eventActions}
                style={{
                    "--hoverBg": defaultColor
                } as any}
            >
                <button
                    className={styles.calendarBtn}
                    onClick={handleOnBunClick}
                    disabled={eventData.isAlreadyAdded || added}
                    style={
                        eventData.isAlreadyAdded || added
                            ? { background: "#4caf50", border: "1px solid #4caf50", color: "white", cursor: "not-allowed" }
                            : { color: defaultColor, border: `1px solid ${defaultColor}` }
                    }
                    title={
                        eventData.isAlreadyAdded || added ? "כבר נוסף ליומן" : "הוסף ליומן"
                    }
                >
                    <FontAwesomeIcon icon={eventData.isAlreadyAdded || added ? faCheck : faCalendarPlus} />
                    {eventData.isAlreadyAdded || added ? " נוסף!" : " הוסף ליומן"}
                </button>

            </div>
        </div>
    );
};

export default EventItem