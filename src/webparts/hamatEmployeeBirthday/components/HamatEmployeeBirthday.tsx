import * as React from 'react';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import styles from './HamatEmployeeBirthday.module.scss';
import type { IHamatEmployeeBirthdayProps } from './IHamatEmployeeBirthdayProps';
import { getListItems } from '../Utility/utils';

const AllCompany = "כל החברות";
const HamatEmployeeBirthday: React.FC<IHamatEmployeeBirthdayProps> = (props) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [changeGiftIconIntoCheckIcon, setChangeGiftIconIntoCheckIcon] = useState<{ [id: string]: boolean }>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const daysBefore = Number(props.daysBefore) || 7;
  const daysAfter = Number(props.daysAfter) || 30;

  // Auto-switch effect
  useEffect(() => {
    if (!props.enableAutoSwitch) {
      setCurrentIndex(0);
      return;
    }

    const intervalSeconds = Number(props.switchInterval) || 5;
    const itemsPerPage = Number(props.itemsPerPage) || 1;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev + itemsPerPage < employees.length ? prev + itemsPerPage : 0
      );
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [props.enableAutoSwitch, props.switchInterval, props.itemsPerPage, employees.length]);

  // Decade check
  const isDecade = (birthday: string) => {
    const birthDate = dayjs(birthday);
    const today = dayjs();
    const ageThisYear = today.year() - birthDate.year();
    return ageThisYear > 0 && ageThisYear % 10 === 0;
  };

  useEffect(() => {
    // If no columns selected, clear data and skip fetching
    if (!props.selectedColumns || props.selectedColumns.length === 0) {
      setEmployees([]);
      return;
    }

    const fetchAndFilterEmployees = async () => {
      try {
        const allEmployees = await getListItems(
          props.EmployeeList,
          props.context,
          props.SeeAllEmployees
        );

        const currentUserEmail = props.context.pageContext.user.email?.toLowerCase();

        // --- Get current user's companies (handles both string or array) ---
        const currentUserCompanies = allEmployees
          .filter(emp => emp.UserMail?.toLowerCase() === currentUserEmail)
          .reduce((acc, emp) => {
            if (Array.isArray(emp.Company)) {
              return acc.concat(emp.Company);
            } else if (typeof emp.Company === "string" && emp.Company.trim() !== "") {
              acc.push(emp.Company.trim());
            }
            return acc;
          }, [] as string[]);

        // Normalize for comparison
        const normalizedUserCompanies = currentUserCompanies.map((c: string) => c.toLowerCase());
        const isAllCompaniesUser = normalizedUserCompanies.includes(AllCompany.toLowerCase());

        // --- Filter employees by company access ---
        const companyFilteredEmployees = allEmployees.filter(emp => {
          // Normalize employee companies
          const empCompanies = Array.isArray(emp.Company)
            ? emp.Company.map((c: string) => c.toLowerCase())
            : typeof emp.Company === "string" && emp.Company.trim() !== ""
              ? [emp.Company.toLowerCase()]
              : [];

          // Skip employees with blank company
          if (empCompanies.length === 0) return false;

          // If current user has no company → show nothing
          if (normalizedUserCompanies.length === 0) return false;

          // Toggle ON → show all employees with company
          if (props.SeeAllEmployees) return true;

          // AllCompany user → show all employees with a company
          if (isAllCompaniesUser) return true;

          // Regular user → show employees sharing same company
          return empCompanies.some((c: any) => normalizedUserCompanies.includes(c));
        });

        // --- Birthday calculation section ---
        const today = dayjs().startOf("day");
        const todayMonth = today.month();
        const todayDate = today.date();

        let filteredByDate = companyFilteredEmployees.map(emp => {
          const birthday = dayjs(emp.BirthDayDate).startOf("day");
          const birthdayThisYear = birthday.year(today.year());
          const daysUntilBirthday = birthdayThisYear.diff(today, "day");

          let nextBirthdayForSort = birthdayThisYear;
          if (daysUntilBirthday < 0) {
            nextBirthdayForSort = birthdayThisYear.add(1, "year");
          }

          // Check if birthday is today (compare only month and day)
          const isBirthdayToday = birthday.month() === todayMonth && birthday.date() === todayDate;

          return {
            ...emp,
            BirthdayThisYear: birthdayThisYear,
            DaysUntilBirthday: daysUntilBirthday,
            NextBirthdayForSort: nextBirthdayForSort,
            IsBirthdayToday: isBirthdayToday,
          };
        });

        // --- Apply birthday filters ---
        if (showAll) {
          filteredByDate = filteredByDate
            .filter(emp => emp.BirthdayThisYear.month() === today.month())
            .sort((a, b) => {
              // First, sort by whether birthday is today
              if (a.IsBirthdayToday && !b.IsBirthdayToday) return -1;
              if (!a.IsBirthdayToday && b.IsBirthdayToday) return 1;
              
              // Then by date within the month (day of month)
              return a.BirthdayThisYear.date() - b.BirthdayThisYear.date();
            });
        } else {
          filteredByDate = filteredByDate
            .filter(emp => emp.DaysUntilBirthday >= -daysBefore && emp.DaysUntilBirthday <= daysAfter)
            .sort((a, b) => {
              // First, sort by whether birthday is today
              if (a.IsBirthdayToday && !b.IsBirthdayToday) return -1;
              if (!a.IsBirthdayToday && b.IsBirthdayToday) return 1;
              
              // Then by birthday date in ascending order
              return a.BirthdayThisYear.diff(b.BirthdayThisYear, "day");
            })
            .map((emp, index) => ({
              ...emp,
              SequenceNumber: index + 1,
            }));
        }

        setEmployees(filteredByDate);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchAndFilterEmployees();
  }, [
    showAll,
    props.context,
    daysBefore,
    daysAfter,
    props.EmployeeList,
    props.SeeAllEmployees,
    props.selectedColumns,
  ]);


  const handleSendMail = (id: string) => {
    setChangeGiftIconIntoCheckIcon((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setChangeGiftIconIntoCheckIcon((prev) => ({ ...prev, [id]: false }));
    }, 1000);
  };

  // Determine visible employees based on enableAutoSwitch
  const itemsPerPage = Number(props.itemsPerPage) || 1;
  const visibleEmployees = props.enableAutoSwitch
    ? employees.slice(currentIndex, currentIndex + itemsPerPage)
    : employees;

  return (

    <div className={`${styles['widget']} ${styles['birthday-widget']}`} style={{ height: props.birthdayWebpartHeight ? `${props.birthdayWebpartHeight}px` : "700px", }}>
      <div className={styles['widget-header']}>
        <div className={styles['widget-header-left']}>
          <div className={styles['widget-icon']}>
            <img src={require('../assets/Gift.svg')} alt="Gift Icon" />
          </div>
          <div className={styles['widget-title']}>{props.BirthDayTitle}</div>
        </div>
      </div>

      <div className={styles['widget-content']}>
        {/* Only show the "View All" button when SeeAllEmployees is OFF */}
        <button
          className={styles['view-all-btn']}
          style={{
            marginBottom: '16px',
            width: '100%',
            background: '#ff4081',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'הצג ימי הולדת בטווח' : 'כל ימי הולדת החודש'}
        </button>

        {(!props.selectedColumns || props.selectedColumns.length === 0) ? (
          <div style={{ direction: "rtl", textAlign: "right", color: "#888", fontStyle: "italic" }}>
            נא לבחור לפחות עמודה אחת בהגדרות הרכיב
          </div>
        ) : employees.length === 0 ? (
          <div style={{ direction: "rtl", textAlign: "right" }}>
            אין ימי הולדת {props.SeeAllEmployees ? '' : 'בתקופה זו'}
          </div>
        ) : (
          visibleEmployees.map((emp) => (
            <div key={emp.Id} className={styles['birthday-item']}>
              <button
                className={`${styles['birthday-action']} ${changeGiftIconIntoCheckIcon[emp.Id] ? styles['birthday-action-checked'] : ''
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  // open mail client with subject/body
                  const email = emp.UserMail || "";
                  const subject = emp.HebrewName ? `יום הולדת שמח ${emp.HebrewName}!` : "יום הולדת שמח!";
                  const body = emp.HebrewName
                    ? `שלום ${emp.HebrewName},\n\nמאחלים לך יום הולדת שמח!\nתיהנה מהיום המיוחד שלך!\nבברכה,\n\n[שמך]`
                    : `מאחלים לך יום הולדת שמח!\nתיהנה מהיום המיוחד שלך!\nבברכה,\n\n[שמך]`;
                  // Use JavaScript to open mailto so browser preview is clean
                  window.location.href = `mailto:${email}?subject=${encodeURIComponent(
                    subject
                  )}&body=${encodeURIComponent(body)}`;
                  // mark clicked
                  setChangeGiftIconIntoCheckIcon((prev) => ({ ...prev, [emp.Id]: true }));
                  setTimeout(() => {
                    setChangeGiftIconIntoCheckIcon((prev) => ({ ...prev, [emp.Id]: false }));
                  }, 1000);
                }}
              >
                {changeGiftIconIntoCheckIcon[emp.Id] ? (
                  <i className="fa-solid fa-check"></i>
                ) : (
                  <i
                    className="fas fa-gift"
                    title={emp.UserMail} // tooltip on hover
                    style={{ cursor: "pointer", color: "inherit" }}
                  ></i>
                )}
              </button>
              <div className={styles['birthday-info']}>
                {props.selectedColumns && props.selectedColumns.length > 0 ? (
                  props.selectedColumns.map((colKey) => {
                    let displayValue: any = emp[colKey];

                    // Skip this column entirely if value is null or undefined
                    if (displayValue === undefined || displayValue === null) {
                      return null;
                    }

                    // Handle boolean columns
                    if (typeof displayValue === "boolean") {
                      displayValue = displayValue ? "Yes" : "No";
                    }
                    // Handle multi-person or multi-lookup (array)
                    else if (Array.isArray(displayValue) && displayValue.length > 0) {
                      if (displayValue[0]?.Title) {
                        displayValue = displayValue.map((v: any) => v.Title).join(", ");
                      } else {
                        displayValue = displayValue.join(", ");
                      }
                    }
                    // Handle single Person or Lookup column (object)
                    else if (typeof displayValue === "object" && displayValue !== null) {
                      if (displayValue.Title) {
                        displayValue = displayValue.Title;
                      } else if (displayValue.EMail || displayValue.Email) {
                        displayValue = displayValue.EMail || displayValue.Email;
                      } else {
                        return null; // skip if object has no usable value
                      }
                    }
                    // Handle Date columns
                    else if (typeof displayValue === "string" && !isNaN(Date.parse(displayValue)) && displayValue.includes("-")) {
                      switch (colKey) {
                        case "BirthDayDate":
                          displayValue = dayjs(displayValue).format('MMMM D');
                          break;
                        case "StartJobDate":
                        case "BirthDayDateCurrentYear":
                          displayValue = dayjs(displayValue).format('MMMM D, YYYY');
                          break;
                        case "ManualUpdate":
                          if (emp[colKey] !== undefined && emp[colKey] !== null) {
                            displayValue = emp[colKey] ? "Yes" : "No";
                          } else {
                            displayValue = "N/A";
                          }
                        case "Company":
                          //  Handle "Company" multi-choice column specifically
                          if (colKey === "Company" && Array.isArray(displayValue)) {
                            displayValue = displayValue.join(", "); // join multiple choices
                          }
                          break;

                        default:
                          displayValue = dayjs(displayValue).format('MMMM D, YYYY');
                      }
                    }
                    // Handle email formatting
                    else if (colKey === "UserMail" && typeof displayValue === "string") {
                      displayValue = displayValue.toLowerCase();
                    }
                    // Handle text/number
                    else if (typeof displayValue === "string" || typeof displayValue === "number") {
                      displayValue = displayValue.toString();
                    } else {
                      return null; // skip unknown/unhandled types
                    }

                    const columnClassMap: Record<string, string> = {
                      HebrewName: styles['birthday-name'],
                      Department: styles['birthday-role'],
                      JobTitle: styles['birthday-role'],
                      BirthDayDate: styles['birthday-date'],
                      UserMail: styles['birthday-email'],
                      StartJobDate: styles['birthday-date'],
                      BirthDayDateCurrentYear: styles['birthday-date']
                    };

                    const className = columnClassMap[colKey] || styles['birthday-email'];

                    return (
                      <div key={colKey} className={className} title={displayValue}>
                        {displayValue}
                      </div>
                    );
                  })

                ) : null}

                {/* Decade celebration */}
                {isDecade(emp.BirthDayDate) && (
                  <div className={styles['decade-celebration']}>{props.decadeMessage}</div>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HamatEmployeeBirthday;