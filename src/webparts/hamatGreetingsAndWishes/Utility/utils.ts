import { getSP } from "./getSP";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export const getCurrentUserEmail = async (context: WebPartContext): Promise<string> => {
  try {

    // Get current user information
    const currentUser = context.pageContext.user.email || "";

    // Return the email address
    return currentUser;
  } catch (error) {
    console.error("Error fetching current user email:", error);
    throw error;
  }
};


export const getHamatMazalTovListitems = async (congratsAndGreetingList: string, context: WebPartContext, cur_UserData: any[], isSeeAllEmployees: boolean): Promise<any[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const _sp = getSP(context);

    // MazalTov list — apply only UntilDate filter
    const showUntilDateFilter = `UntilDate ge datetime'${todayIso}'`;

    // Remove duplicate emails from cur_UserData
    const uniqueUserData = cur_UserData?.filter((user, index, self) =>
      index === self?.findIndex(u => u?.UserMail === user?.UserMail)
    );

    // Return empty array when seeAllEmployee is false and
    // cur_Userdata is empty (means does not select any company in employee list)
    if (isSeeAllEmployees == false && cur_UserData?.length == 0) {
      return [];
    }

    // If isSeeAllEmployees true and compant is empty
    if (cur_UserData?.length == 0) {
      return []
    }

    if(cur_UserData?.length !== 0 && cur_UserData[0].isSelectedCompanyEmpty == true){
      return []
    }


    // All employees — apply only UntilDate filter
    const items = await _sp.web.lists
      .getById(congratsAndGreetingList)
      .items
      .select(
        "*",
        "WorkerPerson/Id",
        "WorkerPerson/Title",
        "WorkerPerson/EMail"
      ).expand("WorkerPerson").filter(showUntilDateFilter).orderBy("Created", false).top(5000)();


    if (isSeeAllEmployees == true && cur_UserData?.length !== 0) {
      return items
    }

    if (cur_UserData?.length !== 0 && cur_UserData[0].inSelectedCompanyHaveAllCompany == true) {
      return items
    }

    // Filter items based on unique user emails
    const userEmails = uniqueUserData?.map(user => user.UserMail?.trim()?.toLowerCase());

    // Filter items where WorkerPerson email matches any of the user emails
    const filteredItems = items?.filter(item => {
      const email = item?.WorkerPerson?.EMail?.trim().toLowerCase();
      return email && userEmails?.includes(email);
    });

    return filteredItems;

  } catch (error) {
    console.error(`Error fetching items from list "Hamat_EmployeeList":`, error);
    throw error;
  }
};


export const getHamatEmployeeListItemsByEmail = async (hamatEmployeeList: string, userEmail: string, context: WebPartContext, isSeeAllEmployees: boolean): Promise<any[]> => {
  try {
    const _sp = getSP(context);

    // First call: Get distinct companies for this user
    const userCompanies = await _sp.web.lists
      .getById(hamatEmployeeList)
      .items
      .select("*") // Select all fields or specify specific columns you need
      .filter(`UserMail eq '${userEmail}'`) // Filter by UserMail column
      .orderBy("Created", false).top(5000)() // Optional: Order by creation date descending

    // Extract unique company values using Array.from()
    const uniqueCompanies = Array.from(new Set(userCompanies.map(item => item.Company)));

    // Build the filter condition for second call
    const expandedCompanies: string[] = [];

    uniqueCompanies.forEach(company => {
      if (Array.isArray(company)) {
        // If company is already an array, add its values directly
        expandedCompanies.push(...company.map(c => c.trim()).filter(Boolean));
      } else if (typeof company === "string") {
        // If it's a string, split by comma (for cases like 'פורמקס,חמת')
        const parts = company.split(",").map(c => c.trim()).filter(Boolean);
        expandedCompanies.push(...parts);
      }
    });

    // Remove duplicates (optional)
    const finalCompanyList = Array.from(new Set(expandedCompanies));

    // This condition is also satisfied when the email is empty
    // If any company is not selected
    if (finalCompanyList.length === 0) {
      // Fetch all list items
      const allItems = await _sp.web.lists
        .getById(hamatEmployeeList)
        .items
        .select("Company", "UserMail", "HebrewName", "JobTitle", "Department", "CompanyName","UserName")
        .orderBy("Created", false).top(5000)();

      // Append a property and return
      return allItems.map(item => ({
        ...item,
        isSelectedCompanyEmpty: true,
        inSelectedCompanyHaveAllCompany: false
      }));
    }

    // Check is current user have 'all company' choice
    const isSelectedAllCompany = finalCompanyList?.includes('כל החברות')

    // If "All Companies" is selected, fetch all items and add a flag
    if (isSelectedAllCompany || isSeeAllEmployees) {
      const allItems = await _sp.web.lists
        .getById(hamatEmployeeList)
        .items
        .select("Company", "UserMail", "HebrewName", "JobTitle", "Department", "CompanyName","UserName")
        .orderBy("Created", false).top(5000)();

      return allItems.map(item => ({
        ...item,
        inSelectedCompanyHaveAllCompany: true,
        isSelectedCompanyEmpty: false
      }));
    }

    // Build filter query like: Company eq 'חמת' or Company eq 'פורמקס'
    const companyFilters = finalCompanyList.map(c => `Company eq '${c}'`).join(" or ");

    // Combine with the default 'כל החברות' condition
    // const selectedCompanyBasedFilterQuery = `(Company eq 'כל החברות' or ${companyFilters})`;
    const selectedCompanyBasedFilterQuery = `(${companyFilters})`;

    // Filter query when isSelectedAllCompany is true (get all data not need to apply any filter)
    const noAnyFilterGetAllItems = ''

    // Add conditional filter query
    const finelFilterQueryForEmpList = isSelectedAllCompany ? noAnyFilterGetAllItems : selectedCompanyBasedFilterQuery;

    // Second call: Get all matching items with single filter
    const items = await _sp.web.lists
      .getById(hamatEmployeeList)
      .items
      .select("Company", "UserMail", "HebrewName", "JobTitle", "Department", "CompanyName","UserName")
      .filter(finelFilterQueryForEmpList)
      .orderBy("Created", false).top(5000)();

    // return items;
    // Add the indicator property to each item
    return items.map(item => ({
      ...item,
      inSelectedCompanyHaveAllCompany: false,
      isSelectedCompanyEmpty: false
    }));

  } catch (error) {
    console.error(`Error fetching items from list "Hamat_EmployeeList" for email ${userEmail}:`, error);
    throw error;
  }
};