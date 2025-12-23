import React from 'react';
import { IEventData } from './CalendarEvent';
import styles from './HamatUpcomingEvent.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCalendar, faCalendarPlus, faCheck, faClock, faInfoCircle, faLink, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { getEventTimeText } from '../Utility/helpers';

export interface EventModalProps {
    isOpen: boolean;
    eventData: IEventData | null;
    onClose: () => void;
    onAddToCalendar: (eventData: IEventData) => Promise<void>;
    defaultColor: string;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, eventData, onClose, onAddToCalendar, defaultColor }) => {
    if (!isOpen || !eventData) return null;

    const [added, setAdded] = React.useState(false);

    // Handle click on "Add to Calendar" button inside the modal
    const handleModalAddCalendarClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        try {
            await onAddToCalendar(eventData);
            setAdded(true);
        } catch (err) {
            console.error("Error adding event:", err);
        }
    };

    const formatDateRange = (startDate: Date | null): string => {
        if (!startDate) return "--/--/----";
        const day = String(startDate.getDate()).padStart(2, "0");
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const year = startDate.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const darkenColor = (hex: string, amount: number = 20) => {
        let col = hex.replace("#", "");
        if (col.length === 3) col = col.split("").map(c => c + c).join("");

        const num = parseInt(col, 16);
        let r = (num >> 16) - amount;
        let g = ((num >> 8) & 0x00FF) - amount;
        let b = (num & 0x0000FF) - amount;

        r = r < 0 ? 0 : r;
        g = g < 0 ? 0 : g;
        b = b < 0 ? 0 : b;

        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    };



    return (
        <div
            className={`${styles.modalOverlay} ${isOpen ? styles.active : ''}`}
            onClick={onClose}
        >
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{eventData.subject}</h2>
                    <button className={styles.modalClose} style={{ color: defaultColor }}
                        onClick={onClose}
                        onMouseEnter={(e) => {
                            if (!eventData.isAlreadyAdded && !added) {
                                (e.currentTarget as HTMLButtonElement).style.color = darkenColor(defaultColor);
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!eventData.isAlreadyAdded && !added) {
                                (e.currentTarget as HTMLButtonElement).style.color = defaultColor;
                            }
                        }}>
                        &times;
                    </button>
                </div>
                <div className={styles.modalDetails}>
                    <div className={styles.detailRow}>
                        <FontAwesomeIcon icon={faCalendar} className={styles.detailIcon} style={{ color: defaultColor }} />
                        <div className={styles.detailContent}>
                            <div className={styles.detailLabel}>תאריך</div>
                            <div className={styles.detailValue}>
                                {formatDateRange(eventData.start)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.detailRow}>
                        <FontAwesomeIcon icon={faClock} className={styles.detailIcon} style={{ color: defaultColor }} />
                        <div className={styles.detailContent}>
                            <div className={styles.detailLabel}>שעות</div>
                            <div className={styles.detailValue}>
                                {/* {formatEventTime(eventData.start)} {formatEventTime(eventData.end)} */}
                                {getEventTimeText(eventData)}
                            </div>
                        </div>
                    </div>

                    {eventData?.location && eventData.location.trim() !== "" && (
                        <div className={styles.detailRow}>
                            <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.detailIcon} style={{ color: defaultColor }} />
                            <div className={styles.detailContent}>
                                <div className={styles.detailLabel}>מיקום</div>
                                <div className={styles.detailValue}>
                                    <a href={eventData.link?.Url || '#'}
                                        title={eventData.link?.Url || ''} target="_blank" rel="noopener noreferrer"
                                        className={styles.eventLinkNoColor} >{eventData.location}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.detailRow}>
                        <FontAwesomeIcon icon={faBuilding} className={styles.detailIcon} style={{ color: defaultColor }} />
                        <div className={styles.detailContent}>
                            <div className={styles.detailLabel}>חברה</div>
                            <div className={styles.detailValue}>
                                {eventData?.company?.map((comp, index) => (
                                    <span key={index} className={styles.companyBadge} style={{ marginLeft: '0.5em' }}>
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {eventData.description && (
                        <div className={styles.detailRow}>
                            <FontAwesomeIcon icon={faInfoCircle} className={styles.detailIcon} style={{ color: defaultColor }} />
                            <div className={styles.detailContent}>
                                <div className={styles.detailLabel}>תיאור</div>
                                <div className={styles.detailValue}>{eventData.description}</div>
                            </div>
                        </div>
                    )}

                    {eventData.link && (
                        <div className={styles.detailRow}>
                            <FontAwesomeIcon icon={faLink} className={styles.detailIcon} style={{ color: defaultColor }} />
                            <div className={styles.detailContent}>
                                <div className={styles.detailLabel}>קישור</div>
                                <div className={styles.detailValue}>
                                    <a href={eventData.link.Url} title={eventData.link.Description} target="_blank" rel="noopener noreferrer" className={styles.eventLink}>
                                        {eventData.link.Url}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button
                            className={styles.btnPrimary}
                            onClick={handleModalAddCalendarClick}
                            disabled={eventData.isAlreadyAdded || added}
                            style={eventData.isAlreadyAdded || added
                                ? { background: "#4caf50", borderColor: "#4caf50", color: "white", cursor: "not-allowed" }
                                : { background: defaultColor, border: `1px solid ${defaultColor}` }
                            }
                            onMouseEnter={(e) => {
                                if (!eventData.isAlreadyAdded && !added) {
                                    (e.currentTarget as HTMLButtonElement).style.background = darkenColor(defaultColor);
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!eventData.isAlreadyAdded && !added) {
                                    (e.currentTarget as HTMLButtonElement).style.background = defaultColor;
                                }
                            }}
                        >
                            <FontAwesomeIcon
                                icon={eventData.isAlreadyAdded || added ? faCheck : faCalendarPlus}
                            />
                            {eventData.isAlreadyAdded || added ? " נוסף!" : " הוסף ליומן"}
                        </button>
                        <button className={styles.btnSecondary} onClick={onClose} style={{
                            "--hoverBg": defaultColor,
                        //    borderColor: defaultColor
                        } as any}>סגור</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventModal