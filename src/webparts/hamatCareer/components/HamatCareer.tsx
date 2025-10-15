import * as React from "react";
import styles from "./HamatCareer.module.scss";
import { IHamatCareerProps } from "./IHamatCareerProps";
import "@fortawesome/fontawesome-free/css/all.min.css";
import JobDetailsPage from "./JobDetailsPage";
import { getcareerListData, getCurrentUserPermission } from "../Utility/utils";
import { ICareerUserProfile, IJob } from "../Utility/ISPInterface";
import Loader from "./Loader/Loader";
import { DisplayMode } from "@microsoft/sp-core-library";

// Event and user defult value filter 
const filterDefaultValue = "כל החברות";
// Filter 
const companiesFilter = ["כל החברות", "חמת", "חזיבנק", "אלוני", "מטבחי זיו", "פורמקס"];
const citiesFilter = ["כל הערים", "תל אביב", "חיפה", "ירושלים", "באר שבע", "אשדוד"];

const HamatCareer: React.FC<IHamatCareerProps> = ({ Title, careerList, employeePermissionList, isApplyButtonVisible, HREmail, context, showAllCompany, isPropertyPaneOpen, displayMode }) => {

  const [showDetails, setShowDetails] = React.useState(false);
  const [careerListData, setCareerListData] = React.useState<IJob[]>([]);
  const [filteredJobs, setFilteredJobs] = React.useState<IJob[]>([]);
  const [selectedJob, setSelectedJob] = React.useState<IJob | null>(null);
  const [showLoader, setShowLoader] = React.useState<boolean>(false);


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
    setSelectedJob(job);
    setShowDetails(true);
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


  const handleBack = () => setShowDetails(false);

  return (
    <div className={styles["hamatCareer"]}>

      {/* Header  */}

      {/* Web part title — currently not needed, so this code is commented out */}

      {/* <div className={styles["header-section"]}>
        <h1>{Title}</h1>
        <p>מצאו את העבודה המושלמת עבורכם במגוון רחב של חברות מובילות</p>
      </div> */}

      {/* Loader  */}
      <Loader visible={showLoader} />

      {showDetails ? (
        <JobDetailsPage job={selectedJob!} onBack={handleBack} isApplyButtonVisible={isApplyButtonVisible} HREmail={HREmail} context={context} />
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
                  <div className={styles["job-title"]}>{job.Title}</div>
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
                        handleShareJob(job);
                      }}
                    >
                      <i className="fas fa-share"></i> שתף
                    </button>
                    {/* Applying Btn  */}
                    {
                      isApplyButtonVisible &&
                      (<button
                        className={`${styles["job-btn"]} ${styles["secondary"]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // shareAndApplyForJob(job);
                          handleApplyJob(job, HREmail)
                        }}
                      >
                        <i className="fas fa-paper-plane"></i> הגשת מועמדות
                      </button>)
                    }
                    <button
                      className={`${styles["job-btn"]} ${styles["secondary"]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowDetails(job)
                      }}
                    >
                      <i className="fas fa-info-circle"></i> פרטים
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HamatCareer;

// Helper: safely encode body text
const encodeBody = (text: string) => encodeURIComponent(text);

// Share Job handler
const handleShareJob = (job: IJob) => {
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
const handleApplyJob = (job: IJob, HREmail: string) => {
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