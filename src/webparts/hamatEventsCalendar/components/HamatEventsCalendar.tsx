import * as React from 'react';
import type { IHamatEventsCalendarProps } from './IHamatEventsCalendarProps';
import { getCurrentUserPermission, getListData, getUserCalendarEvents } from '../Utility/utils';
import { IEventItem, IUserProfile } from '../Utility/ISPInterface';
import Events from './CalendarEvent';
import Loader from './Loader/Loader';
import { DisplayMode } from '@microsoft/sp-core-library';

// Event and user defult value filter 
const filterDefaultValue = "כל החברות";

const HamatEventsCalendar: React.FC<IHamatEventsCalendarProps> = ({ eventList, employeePermissionList, previousDays, upcomingDays, showAllCompany, displayMode, context }) => {

  // List Data
  const [eventListData, setEventListData] = React.useState<IEventItem[]>([]);
  const [addedCalendarEvent, setAddedCalendarEventData] = React.useState([]);

  const [showLoader, setShowLoader] = React.useState<boolean>(false);

  const getEvents = async () => {
    try {
      setShowLoader(true);

      // Get current user profile
      const userProfiles: IUserProfile[] = await getCurrentUserPermission(context, employeePermissionList);
      const addedUserCalendarData: any = await getUserCalendarEvents();
      setAddedCalendarEventData(addedUserCalendarData);

      if (!userProfiles.length) {
        console.warn("No user profile found");
        setShowLoader(false);
        return;
      }

      // Prepare date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(today);
      startDate.setDate(today.getDate() - parseInt(previousDays.toString()));

      const endDate = new Date(today);
      endDate.setDate(today.getDate() + parseInt(upcomingDays.toString()));
      endDate.setHours(23, 59, 59, 999);

      // Normalize current user company list
      const currentUser = userProfiles[0];
      const userCompanies: string[] = Array.isArray(currentUser.Company)
        ? currentUser.Company
        : currentUser.Company
          ? [currentUser.Company]
          : [];

      if (userCompanies.length === 0) {
        console.warn("Current user has no company assigned");
        setShowLoader(false);
        return;
      }

      // Fetch all events in date range
      const allEvents: IEventItem[] = await getListData(eventList, startDate, endDate);

      // Apply company-based filtering
      const filteredEvents = allEvents.filter(ev => {
        const eventCompanies: string[] = Array.isArray(ev.Company)
          ? ev.Company
          : ev.Company
            ? [ev.Company]
            : [];

        if (eventCompanies.length === 0) return false;

        // Show all if "showAllCompany" is true
        if (showAllCompany) return true;

        // If user belongs to "כל החברות" (All Company) → show everything
        if (userCompanies.includes(filterDefaultValue)) return true;

        // Otherwise, show events that are for "כל החברות" or overlap with user's companies
        return (
          // this filter to show Default show all company
          // eventCompanies.includes(filterDefaultValue) || 
          eventCompanies.some(c => userCompanies.includes(c))
        );
      });

      //  Save results
      setEventListData(filteredEvents);
      setShowLoader(false);
    } catch (error) {
      console.error("Error in getEvents", error);
      setShowLoader(false);
    }
  };

  // Hide loader whenever Display Edit mode
  React.useEffect(() => {
    if (displayMode === DisplayMode.Edit) {
      setShowLoader(false);
    }
  }, [displayMode]);

  React.useEffect(() => {
    getEvents();
  }, []);

  return (
    <section>
      <Loader visible={showLoader} />
      <Events eventListData={eventListData} addedCalendarEvent={addedCalendarEvent} previousDays={previousDays} upcomingDays={upcomingDays} setShowLoader={setShowLoader} />
    </section>
  );
};

export default HamatEventsCalendar;
