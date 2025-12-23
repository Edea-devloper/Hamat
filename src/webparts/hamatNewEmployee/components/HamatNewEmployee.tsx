import * as React from "react";
import { useEffect, useState } from "react";
import styles from "./HamatNewEmployee.module.scss";
import { IHamatNewEmployeeProps } from "./IHamatNewEmployeeProps";
const Heart = require("../assets/Heart.svg");
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getEmployeeListData } from "../Utility/utils";

const HamatNewEmployee: React.FC<IHamatNewEmployeeProps> = (props) => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [clickedIndex, setClickedIndex] = useState<number | null>(null);

    // For auto-switch
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-switch effect
    useEffect(() => {
        if (!props.enableAutoSwitch) {
            return; // Do nothing when auto-switch is disabled
        }

        // Validate switchInterval and itemsPerPage
        const intervalSeconds = Number(props.switchInterval) || 5; // Default 5s
        const itemsPerPage = Number(props.itemsPerPage) || 1; // Default 1 item

        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev + itemsPerPage < employees.length ? prev + itemsPerPage : 0
            );
        }, intervalSeconds * 1000);

        return () => clearInterval(interval);
    }, [props.enableAutoSwitch, props.switchInterval, props.itemsPerPage, employees.length]);

    // Determine visible employees
    const itemsPerPage = Number(props.itemsPerPage) || 1;
    const visibleEmployees = props.enableAutoSwitch
        ? employees.slice(currentIndex, currentIndex + itemsPerPage) // Auto-switch ON → paginate
        : employees; // Auto-switch OFF → show all


    useEffect(() => {
        // If no columns are selected, clear employees and skip loading
        if (!props.selectedColumns || props.selectedColumns.length === 0) {
            setEmployees([]);
            return;
        }

        if (props?.EmployeeList) {
            loadEmployees();
        }
    }, [props.EmployeeList, props.selectedColumns, props.startJobWithinDays, props.SeeAllEmployees]);

    // const processUserData = (text: string, item?: any): string => {
    //     const userNameFromItem = item?.UserName || "";
    //     const userMailFromItem = item?.UserMail || "";

    //     return text
    //         .replace(/\{displayName\}/gi, props.userDisplayName || "")
    //         .replace(/\{userEmail\}/gi, props.userEmail || "")
    //         .replace(/\{userName\}/gi, userNameFromItem)
    //         .replace(/\{userMail\}/gi, userMailFromItem);
    // };

    const formatDateOnly = (dateValue: string) => {
        if (!dateValue) return "";
        return new Date(dateValue).toISOString().split("T")[0];
    };

    const processUserData = (text: string, item?: any): string => {

        const ID = item?.ID || "";
        const Title = item?.Title || "";
        const CompanyName = item?.CompanyName || "";
        const Company = item?.Company || "";
        const UserAzureID = item?.UserAzureID || "";
        const UserName = item?.UserName || "";
        const UserMail = item?.UserMail || "";
        const JobTitle = item?.JobTitle || "";
        const Department = item?.Department || "";
        const HebrewName = item?.HebrewName || "";
        const MobilePhone = item?.MobilePhone || "";
        const OfficePhone = item?.OfficePhone || "";
        const StartJobDate = formatDateOnly(item?.StartJobDate || "");
        const BirthDayDate = formatDateOnly(item?.BirthDayDate);
        const BirthDayDateCurrentYear = formatDateOnly(item?.BirthDayDateCurrentYear);
        const BirthDayDayofMonth = item?.BirthDayDayofMonth || "";
        const BirthDayMonthofYear = item?.BirthDayMonthofYear || "";
        const UserPerson = item?.UserPerson.Title || "";
        const UserPersonEmail = item?.UserPerson.EMail || "";




        return text
            .replace(/\{displayName\}/gi, props.userDisplayName || "")
            .replace(/\{userEmail\}/gi, props.userEmail || "")
            .replace(/\{ID\}/gi, ID)
            .replace(/\{Title\}/gi, Title)
            .replace(/\{CompanyName\}/gi, CompanyName)
            .replace(/\{Company\}/gi, Company)
            .replace(/\{UserAzureID\}/gi, UserAzureID)
            .replace(/\{UserName\}/gi, UserName)
            .replace(/\{UserMail\}/gi, UserMail)
            .replace(/\{JobTitle\}/gi, JobTitle)
            .replace(/\{Department\}/gi, Department)
            .replace(/\{HebrewName\}/gi, HebrewName)
            .replace(/\{MobilePhone\}/gi, MobilePhone)
            .replace(/\{OfficePhone\}/gi, OfficePhone)
            .replace(/\{StartJobDate\}/gi, StartJobDate)
            .replace(/\{BirthDayDate\}/gi, BirthDayDate)
            .replace(/\{BirthDayDateCurrentYear\}/gi, BirthDayDateCurrentYear)
            .replace(/\{BirthDayDayofMonth\}/gi, BirthDayDayofMonth)
            .replace(/\{UserPerson\}/gi, UserPerson)
            .replace(/\{UserPersonEmail\}/gi, UserPersonEmail)
            .replace(/\{BirthDayMonthofYear\}/gi, BirthDayMonthofYear);
    };

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const items = await getEmployeeListData(
                props.EmployeeList,
                props.context,
                props.startJobWithinDays,
                props.SeeAllEmployees // Pass SeeAllEmployees to the utility function
            );
            setEmployees(items);
            if (items.length === 0) {
                setError("");
            }
        } catch (err) {
            console.error("Error fetching employee data:", err);
            setError("Failed to load employee data. Please check the list configuration.");
        } finally {
            setLoading(false);
        }
    };

    // Handle button click effect
    const handleActionClick = (idx: number) => {
        setClickedIndex(idx);

        // Reset back after 1.5s
        setTimeout(() => {
            setClickedIndex(null);
        }, 1500);
    };

    const handleEmailClick = (emp: any) => {
        if (emp?.UserMail) {
            const subject = encodeURIComponent(processUserData(props.EmailSubject || "", emp));
            const body = encodeURIComponent(props.EmailBody || "");

            window.location.href = `mailto:${emp.UserMail}?subject=${subject}&body=${body}`;
        } else {
            alert("No email address found for this employee.");
        }
    };

    return (
        <div className={styles["widget"] + " " + styles["new-employees-widget"]} style={{ height: props.NewEmployeeWebpartHeight ? `${props.NewEmployeeWebpartHeight}px` : "700px", }}>
            <div className={styles["widget-header"]} style={{ background: props.backgroundColor }}>
                <div className={styles["widget-header-left"]}>
                    <div className={styles["widget-icon"]}>
                        <img src={Heart} alt="Heart Icon" />
                    </div>
                    <div className={styles["widget-title"]} style={{ color: props.themeColorForFont }}>{props.EmployeeTitle}</div>
                </div>
            </div>

            <div className={styles["widget-content"]}>
                {loading}
                {error && <p className={styles["error-message"]}>{error}</p>}
                {!loading && !error && employees.length === 0 && (
                    props.selectedColumns?.length === 0 ? (
                        <p> נא לבחור לפחות עמודה אחת בהגדרות הרכיב</p>
                    ) : (
                        <p className={styles["no-employees-message"]}>{props.TextForNoEmployee || "לא נמצאו עובדים"}</p>
                    )
                )}

                {!loading &&
                    !error &&

                    employees.length > 0 &&
                    visibleEmployees.map((emp, idx) => (
                        <div key={idx} className={styles["new-employee-item"]} style={{ borderRight: `3px solid ${props.backgroundColor}` }}>
                            <div className={styles["new-employee-info"]}>
                                {props.selectedColumns?.map((colKey, colIdx) => {
                                    let value: any = emp?.[colKey];

                                    // Check if value is null or undefined - SKIP rendering this column
                                    if (value === undefined || value === null) {
                                        return null;
                                    }

                                    // Handle boolean columns
                                    if (typeof value === "boolean") {
                                        value = value ? "Yes" : "No";
                                    }
                                    // Handle multi-person or multi-lookup (array)
                                    else if (Array.isArray(value)) {
                                        if (value.length === 0) {
                                            return null; // Skip empty arrays
                                        }
                                        if (value[0]?.Title) {
                                            value = value.map((v: any) => v.Title).join(", ");
                                        } else {
                                            value = value.join(", ");
                                        }
                                    }
                                    // Handle single Person or Lookup column (object)
                                    else if (typeof value === "object") {
                                        if (value.Title) {
                                            value = value.Title;
                                        } else if (value.EMail || value.Email) {
                                            value = value.EMail || value.Email;
                                        } else {
                                            return null; // Skip if no valid property found
                                        }
                                    }
                                    // Handle Date columns
                                    else if (typeof value === "string" && !isNaN(Date.parse(value)) && value.includes("-")) {
                                        const date = new Date(value);
                                        value = date.toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric"
                                        });
                                    }
                                    // Handle text and number columns
                                    else if (typeof value === "string" || typeof value === "number") {
                                        // Skip empty strings
                                        if (typeof value === "string" && value.trim() === "") {
                                            return null;
                                        }
                                        value = value.toString();
                                    }
                                    else {
                                        return null; // Skip any other unhandled types
                                    }

                                    // Assign CSS class based on the column index
                                    let className: string;
                                    if (colIdx === 0) {
                                        className = styles["new-employee-name"];
                                    } else if (colIdx === 1) {
                                        className = styles["new-employee-dept"];
                                    } else if (colIdx === 2) {
                                        className = styles["new-employee-role"];
                                    } else {
                                        className = styles["new-employee-role"];
                                    }

                                    return (
                                        <div key={colKey} className={className} title={value}>
                                            {value}
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                className={styles["new-employee-action"]}
                                onClick={() => {
                                    handleActionClick(idx);
                                    handleEmailClick(emp);
                                }}
                                style={{
                                    background: clickedIndex === idx ? "#4caf50" : props.backgroundColor,
                                    color: props.themeColorForFont
                                }}
                            >
                                {clickedIndex === idx ? (
                                    <i className="fas fa-check"></i>
                                ) : (
                                    <i className="fas fa-envelope"></i>
                                )}
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default HamatNewEmployee;