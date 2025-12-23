import * as React from 'react';
import styles from './JobDetailsPage.module.scss';
import { IJob } from '../Utility/ISPInterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBuilding, faClock, faHashtag, faMapMarkerAlt, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { processUserData } from './HamatCareer';
import ShareJobModal from './JobShareModal';

interface IJobDetailsPageProps {
  job: IJob;
  onBack: () => void;
  HREmail: string;
  isApplyButtonVisible: string;
  context: WebPartContext;
  applyJobEmailBody: string;
  applyJobEmailSubject: string;
  shareJobEmailSubject: string;
  shareJobEmailBody: string;
  flowAPIUrl: string;
  ShareBtnText:string;
  ApplyBtnText: string;
  DetailsBtnText: string;
}

const JobDetailsPage: React.FC<IJobDetailsPageProps> = ({ job, onBack, isApplyButtonVisible, HREmail, context, applyJobEmailBody, applyJobEmailSubject, shareJobEmailBody, shareJobEmailSubject, flowAPIUrl,ShareBtnText , ApplyBtnText,DetailsBtnText}) => {
  // Helper: safely encode body text
  const encodeBody = (text: string) => encodeURIComponent(text);

  // Share Job handler
  const handleShareJob = (job: IJob, shareJobEmailBody: string, shareJobEmailSubject: string, context: unknown) => {
    const subject = encodeURIComponent(processUserData(shareJobEmailSubject || '', job, context));
    const body = encodeBody(processUserData(shareJobEmailBody || '', job, context));
    window.location.href = `mailto:${job.HRMail?.EMail || HREmail}?subject=${subject}&body=${body}`;
  };

   const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [jobId, setJobId] = React.useState(0);
  
  // Apply Job handler
  const handleApplyJob = (job: IJob, HREmail: string, applyJobEmailSubject: string, applyJobEmailBody: string, context: WebPartContext) => {

    const subject = encodeURIComponent(processUserData(applyJobEmailSubject || '', job, context));
    const body = encodeBody(processUserData(applyJobEmailBody || '', job, context));
    // Use HR Email from job object
    window.location.href = `mailto:${job.HRMail?.EMail || HREmail}?subject=${subject}&body=${body}`;
  };

  return (
    <>
    <div className={styles["career-container"]}>
      <div className={styles['job-details-page']} id="jobDetailsPage">
        <button className={styles['back-button']} style={{ marginRight: "3.3em" }} onClick={onBack}>
          <FontAwesomeIcon icon={faArrowRight} className={styles.JobdetailsIcon} />
          חזרה לרשימת המשרות
        </button>

        <div className={styles['job-full-details']}>
          <div className={styles['job-full-header']}>
            <h3 className={styles['job-full-title']} id="jobFullTitle">
              {job?.JobTitle}
            </h3>
            <div className={styles['job-full-meta']}>
              <div className={styles['job-meta-item']}>
                <FontAwesomeIcon icon={faHashtag} className={styles.JobdetailsIcon} />
                <span>
                  מספר משרה: <span id="jobFullId">{job.Id}</span>
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
            <button className={styles['btn-apply']} 

            onClick={(e) => {
                        e.stopPropagation();
                        //handleShareJob(job, HREmail, shareJobEmailBody, shareJobEmailSubject, context);
                        setIsShareOpen(true); setJobId(job?.Id);
                      }}
             >
              <i className="fas fa-share"></i>
              {/* שתף */}{ShareBtnText}
            </button>
            {isApplyButtonVisible && (
              <button className={styles['btn-apply']} onClick={(e) => {
                e.stopPropagation();
                handleApplyJob(job, HREmail, applyJobEmailSubject, applyJobEmailBody, context)
              }} >
                <i className="fas fa-paper-plane"></i>
                {/* הגשת מועמדות */}{ApplyBtnText}
              </button>
            )}
          </div>

          <div className={styles['email-contact']}>
            <h4>שליחת קורות חיים</h4>
            <p>
              לשליחת קורות חיים אנא פנו למייל:&ensp;
              <a href={`mailto:${job.HRMail?.EMail || HREmail || ""}`} id="jobEmailContact">
                {job.HRMail?.EMail || HREmail || ""}
              </a>

            </p>
          </div>

          <button className={styles['back-button']} onClick={onBack} style={{ marginTop: '20px' }}>
            <i className="fas fa-arrow-right"></i>
            חזרה לרשימת המשרות
          </button>
        </div>
      </div>
    </div>
    <ShareJobModal
      isOpen={isShareOpen}
      jobId={jobId}
      onClose={() => setIsShareOpen(false)}
      senderMail={context.pageContext.user.email}
      flowAPIUrl={flowAPIUrl}
    />
    </>
  );
  
};

export default JobDetailsPage;