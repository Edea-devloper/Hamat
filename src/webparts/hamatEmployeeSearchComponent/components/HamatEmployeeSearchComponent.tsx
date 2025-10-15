import React, { useEffect, useState } from "react";
import styles from "./HamatEmployeeSearchComponent.module.scss";
const SearchImage = require("../assets/Search.svg");
import { getListItemsBySearch } from "../Utility/utils";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface IHamatEmployeeSearchComponentProps {
  EmployeeList: IListInfo;
  context: WebPartContext;
  selectedColumns: string[];
  selectedPhoneColumns: string[];
  Columns: any[];
  EmployeeSearchComponentTitle?: string;
  EmployeeSearchComponentWebpartHeight?: number;
}
interface IListInfo { id?: string; title?: string }

const HamatEmployeeSearchComponent: React.FC<IHamatEmployeeSearchComponentProps> = ({
  EmployeeList,
  context,
  selectedColumns,
  selectedPhoneColumns,
  Columns,
  EmployeeSearchComponentTitle,
  EmployeeSearchComponentWebpartHeight,

}) => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  // Fetch items on search or prop change
  useEffect(() => {
    if (!EmployeeList || !Array.isArray(selectedColumns) || selectedColumns.length === 0) {
      setItems([]);
      return;
    }

    const trimmed = search.trim();
    if (trimmed === "") {
      setItems([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getListItemsBySearch(EmployeeList, trimmed);
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [search, EmployeeList, context, selectedColumns]);

  // Handle contact button click
  const handleEmailButtonClick  = (index: number, item: any) => {
    setClickedIndex(index);

    const email = item?.Email || item?.UserMail;
    if (email) {
      const subject = encodeURIComponent("יצירת קשר מהחברה");
      const body = encodeURIComponent("שלום, מקווה שהכל טוב. פונים אליך מהחברה.");
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    } else {
      alert("No email address found for this user.");
    }

    setTimeout(() => {
      setClickedIndex(null);
    }, 1500);
  };

  // Map column names to definitions for rendering
  const columnMap = React.useMemo(() => {
    return Columns?.reduce((acc: any, c: any) => {
      acc[c.colInfo.InternalName] = c;
      acc[c.colInfo.EntityPropertyName] = c;
      return acc;
    }, {}) || {};
  }, [Columns]);

  // Render field value based on column type
  const renderFieldValue = (item: any, colName: string) => {
    const column = columnMap[colName];
    if (!column) return null;

    const fieldValue = item[column.key];
    const fieldType = column.colInfo.TypeAsString;

    let content: string | JSX.Element = "";

    if (column.colInfo.RichText && fieldValue) {
      content = <div dangerouslySetInnerHTML={{ __html: fieldValue }} />;
    } else if (fieldValue !== undefined && fieldValue !== null) {
      if (Array.isArray(fieldValue)) {
        content = fieldValue
          .map((x: any) => x?.Email || x?.Mobile || x?.Title || x?.Name || x)
          .filter((v: any) => v)
          .join(", ");
      } else if (typeof fieldValue === "object") {
        content = fieldValue.Email || fieldValue.Mobile || fieldValue.Title || fieldValue.Name || "";
      } else if (typeof fieldValue === "boolean") {
        content = fieldValue ? "Yes" : "No";
      } else if (fieldType === "DateTime") {
        content = new Date(fieldValue).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      } else {
        content = fieldValue.toString();
      }
    }

    if (!content) return null;

    // Make phone fields clickable
    const isPhoneCol = selectedPhoneColumns?.includes(colName);
    if (isPhoneCol && typeof content === "string") {
      return (
        <div className={styles["directory-field"]}>
          <a href={`tel:${content.replace(/\s+/g, "")}`} className={styles["phoneLink"]}>
            {content}
          </a>
        </div>
      );
    }

    return <div className={styles["directory-field"]}>{content}</div>;
  };


  return (
    <div className={styles["widget"] + " " + styles["directory-widget"]} style={{ height: EmployeeSearchComponentWebpartHeight ? `${EmployeeSearchComponentWebpartHeight}px` : "700px", }}>
      <div className={styles["widget-header"]}>
        <div className={styles["widget-header-left"]}>
          <div className={styles["widget-icon"]}>
            <img src={SearchImage} alt="Search Icon" />
          </div>
          <div className={styles["widget-title"]}>{EmployeeSearchComponentTitle}</div>
        </div>
      </div>

      <div className={styles["widget-content"]}>
        <input
          type="text"
          className={styles["search-box"]}
          placeholder="חפש עובד..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          null
        ) : !Array.isArray(selectedColumns) || selectedColumns.length === 0 ? (
          null
        ) : search.trim() === "" ? (
          null
        ) : items.length === 0 ? (
          null
        ) : (
          Array.isArray(items) &&
          items.map((item, i) => (
            <div className={styles["directory-item"]} key={i}>
              <div className={styles["directory-info"]}>
                {Array.isArray(selectedColumns) && selectedColumns.length > 0 && (
                  selectedColumns.map((colKey, colIdx) => {
                    let className: string;

                    if (colIdx === 0) {
                      className = styles["directory-name"];
                    } else if (colIdx === 1) {
                      className = styles["directory-company"];
                    } else if (colIdx === 2) {
                      className = styles["directory-dept"];
                    } else if (colIdx === 3) {
                      className = styles["directory-role"];
                    } else if (colIdx === 4) {
                      className = styles["directory-phone"];
                    }
                    else {
                      className = styles["directory-role"];
                    }

                    return (
                      <div
                        key={colKey}
                        className={className}
                        title={(() => {
                          const fieldValue = item[colKey];
                          if (!fieldValue) return "";

                          if (Array.isArray(fieldValue)) {
                            return fieldValue
                              .map((x: any) => x?.Email || x?.Mobile || x?.Title || x?.Name || x)
                              .filter(Boolean)
                              .join(", ");
                          } else if (typeof fieldValue === "object") {
                            return (
                              fieldValue.Email ||
                              fieldValue.Mobile ||
                              fieldValue.Title ||
                              fieldValue.Name ||
                              ""
                            );
                          } else if (typeof fieldValue === "boolean") {
                            return fieldValue ? "Yes" : "No";
                          } else if (
                            typeof fieldValue === "string" &&
                            /^\d{4}-\d{2}-\d{2}T/.test(fieldValue)
                          ) {
                            // Format ISO string date
                            const d = new Date(fieldValue);
                            const day = String(d.getDate()).padStart(2, "0");
                            const month = String(d.getMonth() + 1).padStart(2, "0");
                            const year = d.getFullYear();
                            return `${day}-${month}-${year}`;
                          } else if (fieldValue instanceof Date) {
                            // Format Date objects
                            const d = fieldValue;
                            const day = String(d.getDate()).padStart(2, "0");
                            const month = String(d.getMonth() + 1).padStart(2, "0");
                            const year = d.getFullYear();
                            return `${day}-${month}-${year}`;
                          } else {
                            return fieldValue.toString();
                          }
                        })()}
                      >
                        {renderFieldValue(item, colKey) || ""}
                      </div>
                    );
                  })
                )}

              </div>
              <button className={styles["contact-btn"]}
                onClick={() => handleEmailButtonClick (i, item)}
                style={{
                  background: clickedIndex === i ? "#00d084" : undefined,
                }}>
                {clickedIndex === i ? (
                  <i className="fas fa-paper-plane"></i>
                ) : (
                  <i className="fas fa-envelope"></i>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HamatEmployeeSearchComponent;