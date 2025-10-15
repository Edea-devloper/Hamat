import * as React from "react";
import styles from "./HamatGreetingsAndWishes.module.scss";
const ballonImage = require("../assets/baloon99.png")

// Utility functions to fetch data from SharePoint lists
import { getHamatMazalTovListitems, getHamatEmployeeListItemsByEmail } from '../Utility/utils'

// Web part props interface (defined in the parent web part)
import { IHamatGreetingsAndWishesWebPartProps } from "../HamatGreetingsAndWishesWebPart";

// FontAwesome icons for UI
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';

// For formatting dates
import dayjs from "dayjs";

// Interface representing a single greeting item
interface IGreetingItem {
  Id: number;
  Title: string;
  Details: string;
  cur_UserData?: any[]
  he_Name?: string; // Hebrew name of the employee

}

// Main React functional component for the Greetings and Wishes widget
const HamatGreetingsAndWishes: React.FC<IHamatGreetingsAndWishesWebPartProps> = (props) => {
  // State to store the list of greeting items
  const [greetingsAndWishesListData, setGreetingsAndWishesListData] = React.useState<IGreetingItem[]>([]);

  // State to store the ID of the greeting currently being "sent"
  const [sentGreetingId, setSentGreetingId] = React.useState<number | null>(null);

  // State to track which set of items is currently visible (for auto-switching)
  const [currentIndex, setCurrentIndex] = React.useState(0);


  // ---------------------- FETCH DATA ON COMPONENT LOAD ----------------------
  React.useEffect(() => {
    const fetch_GreetingsAndWishesList_Items = async () => {

      // Get current user data based on their email from Employee List
      const cur_UserData = await getHamatEmployeeListItemsByEmail(props.hamatEmployeeList, props.currentUserEmail, props.context, props.SeeAllEmployees)

      // Get all Mazal Tov (congrats/wishes) items
      const listItems = await getHamatMazalTovListitems(props.congratsAndGreetingList, props.context, cur_UserData, props.SeeAllEmployees);

      // Add Hebrew name to each list item (match user by email)
      const enrichedListItems = listItems?.map(item => {
        try {
          const workerEmail = item.WorkerPerson?.EMail?.toLowerCase();
          const matchedUser = cur_UserData?.find(u =>
            u.UserMail?.toLowerCase() === workerEmail
          );

          // Return item with added Hebrew name
          return {
            ...item,
            he_Name: matchedUser?.HebrewName || "שם לא נמצא" // fallback Hebrew name if not matched
          };
        } catch (innerError) {
          console.error("Error processing item:", item, innerError);
          return {
            ...item,
            he_Name: "שגיאה" // Means "Error"
          };
        }
      });


      // Save the processed items to component state
      setGreetingsAndWishesListData(enrichedListItems);
    };

    // Call data fetching function once when component mounts
    fetch_GreetingsAndWishesList_Items();
  }, []);



  // ---------------------- SEND GREETING EMAIL ----------------------
  const sendgreetingsAndWishesMail = (item: any) => {

    // Mark this greeting as "sent" (for temporary button color change)
    setSentGreetingId(item.Id);

    // Construct mailto link for sending email
    const to = encodeURIComponent(item.WorkerPerson?.EMail || "");
    const subject = encodeURIComponent('ברכות ואיחולים');
    const body = encodeURIComponent(item.Details || "");

    // Open mail client with prefilled data
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    // Reset button state after 2 seconds
    setTimeout(() => setSentGreetingId(null), 2000);
  };



  // ---------------------- AUTO SWITCH FEATURE ----------------------
  React.useEffect(() => {

    // If auto-switch is disabled, do nothing
    if (!props.enableAutoSwitch) {
      return;
    }

    // Validate auto-switch interval and items per page
    const intervalSeconds = Number(props.switchInterval) || 5; // Default 5s
    const itemsPerPage = Number(props.itemsPerPage) || 1; // Default 1 item

    // Automatically cycle through greetings
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev + itemsPerPage < greetingsAndWishesListData.length ? prev + itemsPerPage : 0
      );
    }, intervalSeconds * 1000);

    // Cleanup timer on component unmount
    return () => clearInterval(interval);

  }, [props.enableAutoSwitch, props.switchInterval, props.itemsPerPage, greetingsAndWishesListData.length]);

  // Determine which items should be visible on screen
  const itemsPerPage = Number(props.itemsPerPage) || 1;
  const visibleItems = props.enableAutoSwitch
    ? greetingsAndWishesListData.slice(currentIndex, currentIndex + itemsPerPage) // Auto-switch ON → paginate
    : greetingsAndWishesListData; // Auto-switch OFF → show all

  // ---------------------- RENDER COMPONENT UI ----------------------
  return (
    <div className={`${styles.GreetingsWidget} ${styles.widget}`} style={{ height: props.greetingWebpartHeight ? `${props.greetingWebpartHeight}px` : "700px", }}>

      {/* Header Section */}
      <div className={styles.widgetHeader}>
        <div className={styles.widgetHeaderLeft}>
          <div className={styles.widgetIcon}>
            <img src={ballonImage} alt="Balloon Icon" />
          </div>
          {/* Web part title (e.g. 'Greetings and Wishes') */}
          <div className={styles.widgetTitle}>{props.GreetingsAndWishes}</div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className={styles.widgetContent}>
        {/* If no greetings available, show empty div */}
        {greetingsAndWishesListData.length === 0 ? (
          <div></div>
        ) : (
          (props.enableAutoSwitch ? visibleItems : greetingsAndWishesListData)
            // Filter out empty or invalid items
            .filter((item) =>
              props.selectedColumns?.some((colKey) => {
                const val = (item as any)[colKey];
                return val !== null && val !== undefined && val !== "" && val !== "—";
              })
            )
            // Render each greeting card
            .map((item) => (
              <div key={item.Id} className={styles.greetingItem}>
                <div className={styles.greetingInfo}>

                  {/* Dynamically render selected columns */}
                  {props.selectedColumns.map((colKey, index) => {

                    // Define style class mapping for columns
                    const columnClassMap: Record<string, string> = {
                      Title: styles['greetingName'],
                      Details: styles['greetingDesc'],
                      WorkerPerson: styles['greetingDesc'],
                      UntilDate: styles['greetingDesc'],
                    };

                    let displayValue = "";

                    switch (colKey) {
                      case "Title":
                        displayValue = item.he_Name || (item as any)[colKey] || "";
                        break;
                      case "WorkerPerson":
                        displayValue = (item as any)[colKey]?.Title || "";
                        break;
                      case "UntilDate":
                        displayValue = (item as any)[colKey]
                          ? dayjs((item as any)[colKey]).format("MMMM D")
                          : "";
                        break;
                      default:
                        displayValue = (item as any)[colKey] || "";
                    }

                    // Don’t render empty field
                    if (!displayValue) return null;

                    const columnClass =
                      index === 0 ? styles['greetingName'] : (columnClassMap[colKey] || styles['greetingDesc']);

                    return (
                      <div
                        key={colKey}
                        className={columnClass}
                      >
                        {displayValue}
                      </div>
                    );
                  })}
                </div>
                <button
                  className={styles.greetingAction}
                  onClick={() => sendgreetingsAndWishesMail(item)}
                  style={{
                    backgroundColor: sentGreetingId === item.Id ? "rgb(76, 175, 80)" : "#ff6b6b",
                  }}
                >
                  {sentGreetingId === item.Id ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <FontAwesomeIcon icon={faEnvelopeOpenText} />
                  )}
                  <span className={styles.tooltip}>שליחת ברכה</span>
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default HamatGreetingsAndWishes;
