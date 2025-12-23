import * as React from "react";
import styles from "./HamatCareer.module.scss";
import { IHamatCareerProps } from "./IHamatCareerProps";
import "@fortawesome/fontawesome-free/css/all.min.css";
import JobDetailsPage from "./JobDetailsPage";
import { getcareerListData, getCurrentUserPermission } from "../Utility/utils";
import { ICareerUserProfile, IJob } from "../Utility/ISPInterface";
import Loader from "./Loader/Loader";
import { DisplayMode } from "@microsoft/sp-core-library";
import ShareJobModal from "./JobShareModal";

// Event and user defult value filter 
const filterDefaultValue = "כל החברות";
// Filter 
let companiesFilter = ["כל החברות", "חמת", "חזיבנק", "אלוני", "מטבחי זיו", "פורמקס"];
let citiesFilter = ["כל הערים", "תל אביב", "חיפה", "ירושלים", "באר שבע", "אשדוד"];

const HamatCareer: React.FC<IHamatCareerProps> = ({ Title,
  careerList,
  employeePermissionList,
  isApplyButtonVisible,
  HREmail,
  context,
  showAllCompany,
  isPropertyPaneOpen,
  displayMode,
  ShareBtnText,
  ApplyBtnText,
  DetailsBtnText,
  applyJobEmailSubject,
  applyJobEmailBody,
  shareJobEmailSubject,
  shareJobEmailBody,
  flowAPIUrl
}) => {

  const [showDetails, setShowDetails] = React.useState(false);
  const [careerListData, setCareerListData] = React.useState<IJob[]>([]);
  const [filteredJobs, setFilteredJobs] = React.useState<IJob[]>([]);
  const [selectedJob, setSelectedJob] = React.useState<IJob | null>(null);
  const [showLoader, setShowLoader] = React.useState<boolean>(false);
  const [savedScroll, setSavedScroll] = React.useState(0);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [jobId, setJobId] = React.useState(0);

  function getScrollParent(element: HTMLElement): HTMLElement | Window {
    let parent: any = element.parentElement;

    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;

      if (overflowY === "auto" || overflowY === "scroll") {
        return parent;
      }

      parent = parent.parentElement;
    }

    return window;
  }

  // Filter State: start as blank
  const [selectedCompany, setSelectedCompany] = React.useState("כל החברות");
  const [selectedCity, setSelectedCity] = React.useState("כל הערים");

  const applyFilters = () => {
    const filtered = careerListData.filter(job => {
      // Skip records with empty Company or Location
      if (!job.Company || !job.Location) return false;

      return (
        (!selectedCompany || selectedCompany === "כל החברות" || job.Company === selectedCompany) &&
        (!selectedCity || selectedCity === "כל הערים" || job.Location === selectedCity)
      );
    });

    setFilteredJobs(filtered);
  };

  const handleShowDetails = (job: IJob) => {
    // Save current scroll position BEFORE changing state
    const container = document.querySelector(`.${styles.hamatCareer}`) as HTMLElement;
    if (container) {
      const scrollParent: any = getScrollParent(container);
      const scrollTop = scrollParent instanceof Window ? window.scrollY : scrollParent.scrollTop;
      setSavedScroll(scrollTop);
    }

    setIsNavigating(true);
    setSelectedJob(job);
    setShowDetails(true);

    // Use timeout to ensure state updates are processed
    setTimeout(() => {
      setIsNavigating(false);
    }, 100);
  };

  const handleBack = () => {
    setIsNavigating(true);
    setShowDetails(false);

    // Restore scroll position after a brief delay to ensure DOM is updated
    setTimeout(() => {
      const container = document.querySelector(`.${styles.hamatCareer}`) as HTMLElement;
      if (container) {
        const scrollParent: any = getScrollParent(container);

        if (scrollParent === window) {
          window.scrollTo(0, savedScroll);
        } else {
          scrollParent.scrollTop = savedScroll;
        }
      }
      setIsNavigating(false);
    }, 50);
  };

  // get icons based on company type
  function getIcon(cName: string): string {
    const icons: { [key: string]: string } = {
      "חמת": 'fas fa-building',
      "חזיבנק": "fas fa-wrench",
      "מטבחי זיו": "fas fa-home",
      "אלוני": "fas fa-chart-line"
    };

    return icons[cName] || "fas fa-building";
  }

  // Get data from SPO list
  const getCareer = async () => {
    try {
      setShowLoader(true);

      const userProfiles: ICareerUserProfile[] = await getCurrentUserPermission(context, employeePermissionList);
      if (!userProfiles.length) {
        console.warn("No user profile found");
        setShowLoader(false);
        return;
      }

      const currentUser = userProfiles[0];
      let userCompanies: string[] = [];

      // Handle both single-select and multi-select values safely
      if (Array.isArray(currentUser.Company)) {
        userCompanies = currentUser.Company.filter((c: string) => c && c.trim() !== "");
      } else if (typeof currentUser.Company === "string" && currentUser.Company.trim() !== "") {
        userCompanies = [currentUser.Company.trim()];
      }

      // If userCompanies is empty → no valid company assigned
      if (userCompanies.length === 0) {
        console.warn("User has no valid company assigned.");
        setCareerListData([]);
        setFilteredJobs([]);
        setShowLoader(false);
        return;
      }

      const allCareerData: IJob[] = await getcareerListData(careerList);
      const isAllCompanyUser = userCompanies.includes(filterDefaultValue);

      const filteredCareer = allCareerData.filter((ev: IJob) => {
        if (!ev.Company || ev.Company.length === 0) return false;

        const evCompanies = Array.isArray(ev.Company) ? ev.Company : [ev.Company];

        if (userCompanies.length > 0 && (showAllCompany || isAllCompanyUser)) return true;

        return evCompanies.some((company) => userCompanies.includes(company));
      });

      // Set both raw and filtered data only if userCompanies has valid data
      setCareerListData(allCareerData);
      setFilteredJobs(filteredCareer);

      companiesFilter = Array.from(
        new Set(
          allCareerData
            .map((item: { Company: string; }) => item.Company?.trim())
            .filter((company: any) => company)
        )
      );

      citiesFilter = Array.from(
        new Set(
          allCareerData
            .map((item: { Location: string; }) => item.Location?.trim())
            .filter((location: any) => location)
        )
      );

      // Get current URL
      const urlParams = new URLSearchParams(window.location.search);
      // Get 'job' query parameter
      const jobIdParam = urlParams.get("job");
      // Convert to number safely
      const jobId = jobIdParam ? Number(jobIdParam) : null;

      if (jobId) {
        const job = filteredCareer.find((a) => a.Id === jobId);
        if (job) {
          handleShowDetails(job);
        }
      }
    } catch (error) {
      console.error("Error fetching career data:", error);
    } finally {
      setShowLoader(false);
    }
  };

  // Hide loader whenever property pane is open OR in Edit mode
  React.useEffect(() => {
    if (isPropertyPaneOpen || displayMode === DisplayMode.Edit) {
      setShowLoader(false);
    }
  }, [isPropertyPaneOpen, displayMode]);

  // Re-run getCareer when showAllCompany changes
  React.useEffect(() => {
    getCareer();
  }, [showAllCompany]);

  // Scroll to top when showing details, but only if we're not restoring a previous position
  React.useEffect(() => {
    if (showDetails && !isNavigating) {
      const container = document.querySelector(`.${styles.hamatCareer}`) as HTMLElement;
      if (!container) return;

      const scrollParent = getScrollParent(container);

      if (scrollParent === window) {
        window.scrollTo({ top: 0, behavior: "auto" });
      } else {
        scrollParent.scrollTo({ top: 0, behavior: "auto" });
      }
    }
  }, [showDetails, isNavigating]);

  return (<>
    <div className={styles["hamatCareer"]}>
      <Loader visible={showLoader} />

      {showDetails ? (
        <JobDetailsPage
          job={selectedJob!}
          onBack={handleBack}
          isApplyButtonVisible={isApplyButtonVisible}
          HREmail={HREmail}
          context={context}
          applyJobEmailBody={applyJobEmailBody}
          applyJobEmailSubject={applyJobEmailSubject}
          shareJobEmailBody={shareJobEmailBody}
          shareJobEmailSubject={shareJobEmailSubject}
          flowAPIUrl={flowAPIUrl}
          ShareBtnText={ShareBtnText}
          ApplyBtnText={ApplyBtnText}
          DetailsBtnText={DetailsBtnText}

        />
      ) : (
        <div className={styles["career-container"]}>
          {/* Filters */}
          <div className={styles["filters-section"]}>
            <div className={styles["filters-title"]}>
              <i className="fas fa-filter"></i>
              <span>סינון משרות</span>
            </div>
            <div className={styles["filters-grid"]}>
              {/* Company Filter */}
              <div className={styles["filter-group"]}>
                <label className={styles["filter-label"]}>חברה</label>
                <select
                  className={styles["filter-select"]}
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                >
                  <option key={0} value="כל החברות">כל החברות</option>
                  {companiesFilter.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div className={styles["filter-group"]}>
                <label className={styles["filter-label"]}>עיר</label>
                <select
                  className={styles["filter-select"]}
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option key={0} value="כל הערים">כל הערים</option>
                  {citiesFilter.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Apply Filter Button */}
              <div className={styles["filter-group"]}>
                <button className={styles["search-button"]} onClick={applyFilters}>
                  <i className="fas fa-search"></i>
                  חיפוש משרות
                </button>
              </div>
            </div>
          </div>

          {/* Jobs */}
          <div className={styles["jobs-section"]}>
            <div className={styles["section-header"]}>
              <h2 className={styles["section-title"]}>משרות פתוחות</h2>
              <span className={styles["results-count"]}>
                נמצאו {filteredJobs.length} משרות
              </span>
            </div>

            <div className={styles["jobs-grid"]}>
              {filteredJobs.map((job) => (
                <div
                  key={job.Id}
                  className={styles["job-card"]}
                  onClick={() => handleShowDetails(job)}
                >
                  <div className={styles["status-indicator"]}></div>
                  <div className={styles["job-header"]}>
                    <div className={styles["job-id"]}>#{job.Id}</div>
                  </div>
                  <div className={styles["job-title"]}>{job.JobTitle}</div>
                  <div className={styles["job-company"]}>
                    <div className={styles["company-icon"]}>
                      <i className={getIcon(job.Company)}></i>
                    </div>
                    {job.Company}
                  </div>
                  <div className={styles["job-details"]}>
                    <div className={styles["job-detail"]}>
                      <i className="fas fa-map-marker-alt"></i> {job.Location}
                    </div>
                    <div className={styles["job-detail"]}>
                      <i className="fas fa-clock"></i> {job.JobTime}
                    </div>
                    <div className={styles["job-detail"]}>
                      <i className="fas fa-user-graduate"></i> {job.Experience}
                    </div>
                  </div>
                  <div className={styles["job-actions"]}>
                    <button
                      className={styles["job-btn"]}
                      onClick={(e) => {
                        e.stopPropagation();
                        //handleShareJob(job, HREmail, shareJobEmailBody, shareJobEmailSubject, context);
                        setIsShareOpen(true); setJobId(job?.Id);
                      }}
                    >
                      <i className="fas fa-share"></i>{ShareBtnText || "שתף"}
                    </button>
                    {/* Applying Btn  */}
                    {
                      isApplyButtonVisible &&
                      (<button
                        className={`${styles["job-btn"]} ${styles["secondary"]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyJob(job, HREmail, applyJobEmailSubject, applyJobEmailBody, context)
                        }}
                      >
                        <i className="fas fa-paper-plane"></i> {ApplyBtnText || "הגשת מועמדות"}
                      </button>)
                    }
                    <button
                      className={`${styles["job-btn"]} ${styles["secondary"]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowDetails(job)
                      }}
                    >
                      <i className="fas fa-info-circle"></i> {DetailsBtnText || "פרטים"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    <ShareJobModal
      isOpen={isShareOpen}
      jobId={jobId}
      onClose={() => setIsShareOpen(false)}
      senderMail={context.pageContext.user.email}
      flowAPIUrl={flowAPIUrl}
    /></>
  );
};



export default HamatCareer;

// Helper: safely encode body text
const encodeBody = (text: string) => encodeURIComponent(text);

// Share Job handler
const handleShareJob = (job: IJob, HREmail: string, shareJobEmailBody: string, shareJobEmailSubject: string, context: unknown) => {
  const subject = encodeURIComponent(processUserData(shareJobEmailSubject || '', job, context));
  const body = encodeBody(processUserData(shareJobEmailBody || '', job, context));
  window.location.href = `mailto:${job.HRMail?.EMail || HREmail}?subject=${subject}&body=${body}`;
};

// Apply Job handler
const handleApplyJob = (job: IJob, HREmail: string, applyJobEmailSubject: string, applyJobEmailBody: string, context: unknown) => {
  const subject = encodeURIComponent(processUserData(applyJobEmailSubject || '', job, context));
  const body = encodeBody(processUserData(applyJobEmailBody || '', job, context));
  // Use HR Email from job object
  window.location.href = `mailto:${job.HRMail?.EMail || HREmail}?subject=${subject}&body=${body}`;
};

export const processUserData = (text: string, item?: any, context?: any): string => {

  const Title = item?.Title || "";
  const JobTitle = item?.JobTitle || "";
  const Details = item.Details?.replace(/<[^>]+>/g, '');
  const JobRequirements = item.JobRequirements?.replace(/<[^>]+>/g, '');
  const HRMail = item?.HRMail?.EMail || "";
  const Company = item?.Company || "";
  const Location = item?.Location || "";
  const Experience = item?.Experience || "";
  const jobTime = item?.JobTime || "";
  const Id = item?.Id || "";


  const Url = `${window.location.origin}${window.location.pathname}?job=${item.Id}`;
  const currentUserEmail = context.pageContext.user.email || '';
  const currentUserName = context.pageContext.user.displayName || '';


  return text
    .replace(/\{Id\}/gi, Id || "")
    .replace(/\{Url\}/gi, Url || "")
    .replace(/\{Company\}/gi, Company || "")
    .replace(/\{Location\}/gi, Location)
    .replace(/\{JobName\}/gi, JobTitle)
    .replace(/\{jobTime\}/gi, jobTime)
    .replace(/\{currentUserEmail\}/gi, currentUserEmail)
    .replace(/\{currentUserName\}/gi, currentUserName)
    .replace(/\{Title\}/gi, Title)
    .replace(/\{Details\}/gi, Details)
    .replace(/\{JobRequirements\}/gi, JobRequirements)
    .replace(/\{HRMail\}/gi, HRMail)
    .replace(/\{Experience\}/gi, Experience);
};