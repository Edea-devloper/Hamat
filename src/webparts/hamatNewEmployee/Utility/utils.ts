import { getSP } from "./getSP";
import "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups";
import "@pnp/sp/files";
import "@pnp/sp/folders";

// sort by StartJobDate first, then alphabetically by HebrewName
const sortEmployees = (items: any[] = []) => {
  return items?.sort((a, b) => {
    const dateA = new Date(a?.StartJobDate ?? 0).getTime();
    const dateB = new Date(b?.StartJobDate ?? 0).getTime();

    // First sort by date (descending: newer first)
    if (dateA !== dateB) {
      return dateB - dateA;
    }

    // If same StartJobDate → sort alphabetically by HebrewName
    const nameA = (a?.HebrewName ?? "").toLowerCase();
    const nameB = (b?.HebrewName ?? "").toLowerCase();
    return nameA.localeCompare(nameB);
  }) ?? [];
};

// Helper function to normalize company values to an array
const normalizeCompanyValue = (companyValue: any): string[] => {
  if (!companyValue) {
    return [];
  }

  // If it's already an array (multi-select)
  if (Array.isArray(companyValue)) {
    return companyValue.map((item: any) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      // Handle lookup/choice objects with Title or Value property
      return (item?.Title || item?.Value || '').trim();
    }).filter(Boolean);
  }

  // If it's an object (single lookup/choice)
  if (typeof companyValue === 'object') {
    const value = (companyValue?.Title || companyValue?.Value || '').trim();
    return value ? [value] : [];
  }

  // If it's a string
  if (typeof companyValue === 'string') {
    return [companyValue.trim()];
  }

  return [];
};

export const getEmployeeListData = async (
  listId: string,
  context: any,
  startJobWithinDays: number,
  seeAllEmployees: boolean = false
): Promise<any[]> => {
  try {
    listId = listId?.replace(/[{}]/g, "");
    const _sp = getSP(context);

    if (!_sp) {
      console.error("SP object is null");
      return [];
    }

    // STEP 1: Get all fields to identify Person columns and multi-select columns
    const fields = await _sp?.web?.lists
      ?.getById(listId)
      ?.fields
      ?.select("InternalName,TypeAsString,FieldTypeKind,Title")();

    // STEP 2: Identify Person/Group columns (FieldTypeKind = 20)
    const personColumns = fields
      ?.filter((f: any) => f?.FieldTypeKind === 20)
      ?.map((f: any) => f?.InternalName) ?? [];

    // Identify multi-select lookup columns (FieldTypeKind = 7 for Lookup with AllowMultipleValues)
    const multiLookupColumns = fields
      ?.filter((f: any) => f?.TypeAsString?.includes("LookupMulti"))
      ?.map((f: any) => f?.InternalName) ?? [];

    // Identify multi-select choice columns
    const multiChoiceColumns = fields
      ?.filter((f: any) => f?.TypeAsString === "MultiChoice")
      ?.map((f: any) => f?.InternalName) ?? [];

    // Find the Company field
    const companyField = fields?.find((f: any) => f?.InternalName === "Company");

    const companyFieldName = companyField?.InternalName || "Company";
    const companyFieldType = companyField?.TypeAsString || "";
    const isCompanyMultiLookup = multiLookupColumns.includes(companyFieldName) || companyFieldType.includes("LookupMulti");
    const isCompanyMultiChoice = multiChoiceColumns.includes(companyFieldName) || companyFieldType === "MultiChoice";
    const isCompanyLookup = companyFieldType.includes("Lookup");

    // STEP 3: Build select and expand strings dynamically
    const selectFields = [
      "Id",
      "Title",
      "StartJobDate",
      "UserMail",
      "AttachmentFiles/FileName",
      "AttachmentFiles/ServerRelativeUrl",
      "*"
    ];

    const expandFields = ["AttachmentFiles"];

    // Add Company field based on its type
    if (companyFieldName) {
      if (isCompanyMultiLookup || isCompanyLookup) {
        // For Lookup fields (single or multi), need to expand
        selectFields.push(`${companyFieldName}/Title`);
        selectFields.push(`${companyFieldName}/Id`);
        if (!expandFields.includes(companyFieldName)) {
          expandFields.push(companyFieldName);
        }
      } else {
        // For Choice, MultiChoice, Text fields - just include the field
        selectFields.push(companyFieldName);
      }
    }

    // Add Person column fields to select and expand
    personColumns?.forEach((colName: string) => {
      if (colName && colName !== companyFieldName) {
        selectFields.push(`${colName}/Title`);
        selectFields.push(`${colName}/EMail`);
        selectFields.push(`${colName}/Id`);
        if (!expandFields.includes(colName)) {
          expandFields.push(colName);
        }
      }
    });

    // Add other multi-lookup columns
    multiLookupColumns?.forEach((colName: string) => {
      if (colName && colName !== companyFieldName && !expandFields.includes(colName)) {
        selectFields.push(`${colName}/Title`);
        selectFields.push(`${colName}/Id`);
        expandFields.push(colName);
      }
    });

    // Add any other fields that might be needed
    const additionalFields = ["HebrewName", "Department", "Position", "Email"];
    additionalFields.forEach(field => {
      if (fields?.some((f: any) => f?.InternalName === field) && !selectFields.includes(field)) {
        selectFields.push(field);
      }
    });

    const selectString = selectFields?.join(",") ?? "";
    const expandString = expandFields?.join(",") ?? "";

    // STEP 4: Fetch ALL data from the list with dynamic expansion
    const allItems = await _sp?.web?.lists
      ?.getById(listId)
      ?.items
      ?.top(5000)
      ?.select(selectString)
      ?.expand(expandString)() ?? [];

    // Calculate date range (past X days)
    const today = new Date();
    today?.setHours(23, 59, 59, 999);

    const pastDate = new Date();
    pastDate?.setDate(today?.getDate() - (startJobWithinDays ?? 0));
    pastDate?.setHours(0, 0, 0, 0);

    // Filter employees who joined within last X days
    let filteredItems = allItems?.filter((item: any) => {
      const startJobDate = item?.StartJobDate ? new Date(item?.StartJobDate) : null;
      return (
        startJobDate &&
        startJobDate >= pastDate &&
        startJobDate <= today
      );
    }) ?? [];

    // REMOVE employees with NO assigned company (blank/null/empty)
    filteredItems = filteredItems.filter((item: any) => {
      const employeeCompanies = normalizeCompanyValue(item?.[companyFieldName]);
      return employeeCompanies.length > 0;
    });

    // Get current user information
    const currentUserEmail = context?.pageContext?.user?.email?.toLowerCase() ?? "";

    const userItem = allItems?.find(
      (item: any) => item?.UserMail?.toLowerCase() === currentUserEmail
    );

    // Get user's companies (normalize to array)
    const userCompanies = normalizeCompanyValue(userItem?.[companyFieldName]);

    // CRITICAL CHECK: If current user has NO company → block everything
    // This applies regardless of "See All Employees" toggle
    if (userCompanies.length === 0) {
      console.warn("Current user has no company → no visibility");
      return [];
    }

    // Check if current user belongs to "All Company"
    const userIsAllCompany = userCompanies.some(
      (comp) => comp?.toLowerCase() === "all company" || comp === "כל החברות"
    );

    // If "See All Employees" is ON and user has a valid company → show all employees
    if (seeAllEmployees) {
      return sortEmployees(filteredItems);
    }

    // If user is from "All Company" → show all employees without filtering
    if (userIsAllCompany) {
      return sortEmployees(filteredItems);
    }

    // If no company field exists, return all filtered items
    if (!companyFieldName) {
      console.warn("No Company field found in the list. Returning all items within date range.");
      return sortEmployees(filteredItems);
    }

    // Apply company filtering for regular users
    filteredItems = filteredItems?.filter((item: any) => {
      // Get employee's companies (normalize to array)
      const employeeCompanies = normalizeCompanyValue(item?.[companyFieldName]);

      // If employee has no company assigned, exclude them
      if (employeeCompanies.length === 0) {
        return false;
      }

      // Check if there's any overlap between user's companies and employee's companies
      const hasMatchingCompany = employeeCompanies.some(empCompany =>
        userCompanies.some(userCompany =>
          userCompany.toLowerCase() === empCompany.toLowerCase()
        )
      );

      return hasMatchingCompany;
    }) ?? [];

    return sortEmployees(filteredItems);

  } catch (error) {
    console.error("Error fetching list by ID:", error);
    return [];
  }
};