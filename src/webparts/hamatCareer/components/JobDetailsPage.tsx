import * as React from 'react';
import styles from './JobDetailsPage.module.scss';
import { IJob } from '../Utility/ISPInterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBuilding, faClock, faHashtag, faMapMarkerAlt, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface IJobDetailsPageProps {
  job: IJob;
  onBack: () => void;
  HREmail: string;
  isApplyButtonVisible: string;
  context: WebPartContext;
}

const JobDetailsPage: React.FC<IJobDetailsPageProps> = ({ job, onBack, isApplyButtonVisible, HREmail, context }) => {
  // Helper: safely encode body text
  const encodeBody = (text: string) => encodeURIComponent(text);

  // Share Job handler
  const handleShareJob = () => {
    const jobUrl = `${window.location.origin}${window.location.pathname}?job=${job.Id}`;
    const subject = encodeURIComponent(`משרה מעניינת - ${job.Title} ב${job.Company}`);
    const body = encodeBody(
      `היי,\n\nמצאתי משרה שעשויה לעניין אותך:\n\n` +
      `${job.Title}\n` +
      `חברה: ${job.Company}\n` +
      `מיקום: ${job.Location}\n` +
      `היקף: ${job.JobTime}\n\n` +
      `קישור למשרה המלאה: ${jobUrl}\n\n` +
      `בהצלחה!`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Apply Job handler
  const handleApplyJob = () => {
    const subject = encodeURIComponent(`מועמדות למשרה ${job.Title} - מס' ${job.Id}`);
    const body = encodeBody(
      `שלום,\n\nברצוני להגיש מועמדות למשרה:\n\n` +
      `${job.Title}\n` +
      `מספר משרה: #${job.Id}\n` +
      `חברה: ${job.Company}\n\n` +
      `במקביל, אשלח את קורות החיים שלי.\n\n` +
      `תודה,`
    );

    // Use HR Email from job object
    window.location.href = `mailto:${HREmail || job.HRMail?.EMail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={styles['job-details-page']} id="jobDetailsPage">
      <button className={styles['back-button']} style={{ marginRight: "3.3em" }} onClick={onBack}>
        <FontAwesomeIcon icon={faArrowRight} className={styles.JobdetailsIcon} />
        חזרה לרשימת המשרות
      </button>

      <div className={styles['job-full-details']}>
        <div className={styles['job-full-header']}>
          <h3 className={styles['job-full-title']} id="jobFullTitle">
            {job?.Title}
          </h3>
          <div className={styles['job-full-meta']}>
            <div className={styles['job-meta-item']}>
              <FontAwesomeIcon icon={faHashtag} className={styles.JobdetailsIcon} />
              <span>
                מספר משרה: <span id="jobFullId">#{job.Id}</span>
              </span>
            </div>
            <div className={styles['job-meta-item']}>
              <FontAwesomeIcon icon={faBuilding} className={styles.JobdetailsIcon} />
              <span id="jobFullCompany">{job?.Company}</span>
            </div>
            <div className={styles['job-meta-item']}>
              <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.JobdetailsIcon} />
              <span id="jobFullLocation">{job?.Location}</span>
            </div>
            <div className={styles['job-meta-item']}>
              <FontAwesomeIcon icon={faClock} className={styles.JobdetailsIcon} />
              <span id="jobFullType">משרה מלאה</span>
            </div>
            <div className={styles['job-meta-item']}>
              <FontAwesomeIcon icon={faUserGraduate} className={styles.JobdetailsIcon} />
              <span id="jobFullExperience">{job?.Experience}</span>
            </div>
          </div>
        </div>

        <div className={styles['job-content']}>
          <div className={styles['job-section']}>
            <h3>תיאור התפקיד</h3>
            <div
              id="jobDescription"
              dangerouslySetInnerHTML={{ __html: job?.Details }}
            />
          </div>

          <div className={styles['job-section']}>
            <h3>דרישות התפקיד</h3>
            <div
              id="jobRequirements"
              dangerouslySetInnerHTML={{ __html: job.JobRequirements }}
            />
          </div>

          {/* currently not needed, so this code is commented out */}
          {/* <div className={styles['job-section']}>
            <h3>מה אנחנו מציעים</h3>
            <ul>
              <li>חבילת שכר ותנאים מעולים</li>
              <li>הזדמנויות קידום וצמיחה מקצועית</li>
              <li>סביבת עבודה דינמית ומאתגרת</li>
              <li>הכשרות והשתלמויות על חשבון החברה</li>
              <li>תנאים סוציאליים מעולים</li>
            </ul>
          </div> */}
        </div>

        <div className={styles['job-full-actions']}>
          <button className={styles['btn-apply']} onClick={handleShareJob} >
            <i className="fas fa-share"></i>
            שתף
          </button>
          {isApplyButtonVisible && (
            <button className={styles['btn-apply']} onClick={handleApplyJob} >
              <i className="fas fa-paper-plane"></i>
              הגשת מועמדות
            </button>
          )}
        </div>

        <div className={styles['email-contact']}>
          <h4>שליחת קורות חיים</h4>
          <p>
            לשליחת קורות חיים אנא פנו למייל:
            <a href={`mailto:${HREmail || job.HRMail?.EMail || ""}`} id="jobEmailContact">
              {HREmail || job.HRMail?.EMail || ""}
            </a>

          </p>
        </div>

        <button className={styles['back-button']} onClick={onBack} style={{ marginTop: '20px' }}>
          <i className="fas fa-arrow-right"></i>
          חזרה לרשימת המשרות
        </button>
      </div>
    </div>
  );
};

export default JobDetailsPage;
