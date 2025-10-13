// components/ClientListing.tsx
"use client";
import React, { useState, useEffect } from "react";
import TableActions from "../../component/action";
import CommonHeader from "../../component/commonHeader";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Pagination from "../../component/pagination";
import Empty from "@/app/component/empty";
import Loader from "@/app/component/loader";
import Link from "next/link";
import Image from "next/image";
import Eye from "../../../../public/eye.svg";
import { ExportToCsv } from "export-to-csv-file";
import Breadcrumb from "@/app/component/breadcrumb";
import { useSidebar } from "@/app/component/SidebarContext";
import axios from "axios";
import Papa from "papaparse";
import CompletedJobs from "@/app/jobs/complete-job/listing/listing";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api"; // ✅ Get the base URL here
interface Customer {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
export default function ClientListing() {
  const [reoprts, setReports] = useState<any[]>([]); 

  const [sortBy, setSortBy] = useState<string>("id"); // Default sorting column is 'id'
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string[]>([
    "Customer Name",
  ]);

  const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setReports((prev) => prev.filter((cust) => cust.id !== deletedId));
  };

  const fetchCustomer = async (page = 1, query = "", limit = pageSize) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const techId = searchParams.get("technicianId") || "";
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userID");
      const roleType = localStorage.getItem("types");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const finalUserId = techId || userId;
      // Determine correct endpoint
      const endpoint = query.trim()
        ? `/api/customReports?searchQuery=${encodeURIComponent(
            query
          )}&roleType=${roleType}&userId=${finalUserId}`
        : `/api/customReports?page=${page}&userId=${finalUserId}&limit=${limit}&roleType=${roleType}`;

      const response = await fetch(endpoint, { method: "GET", headers });
      if (response.status == 400) {
        localStorage.removeItem("token");
        router.push("/");
      }
      const data = await response.json();
      if (response.ok) {
        // Handle customers array for both APIs correctly
        const fetchedReports: Customer[] = query.trim()
          ? data.jobs || []
          : data.jobs || [];
        //  const filteredCustomers = fetchedCustomers.filter(reoprts => !reoprts.deletedStatus);
        setReports(fetchedReports);
        setTotalPages(data.customers?.totalPages || 1);
      } else {
        if (data.error === "Invalid Token") {
          router.push("/");
        } else {
          console.error("Error fetching customers:", data.error);
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    const direction = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(direction);
    setSortBy(column);

    const sortedCustomers = [...reoprts].sort((a, b) => {
      if (column === "name") {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return direction === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }

      if (a[column] < b[column]) return direction === "asc" ? -1 : 1;
      if (a[column] > b[column]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setReports(sortedCustomers);
  };
  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`); // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // Unified useEffect to handle both search and pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomer(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

  const handlePageSizeChange = (size: number) => {
    // Calculate the total number of pages based on the current totalJobs and the new pageSize
    const newTotalPages = Math.ceil(totalJobs / size);

    // If the current page is greater than the new total pages, reset it to the last page
    let newPage = currentPage;
    if (newPage > newTotalPages) {
      newPage = newTotalPages;
    }

    // Update the state with the new page size and set the current page accordingly
    setPageSize(size);
    setCurrentPage(newPage); // Set the current page to the last valid page
  };

  // const handleSearch = async (query: string) => {
  //   try {
  //     const token = localStorage.getItem('token');

  //     const headers: Record<string, string> = {
  //       'Content-Type': 'application/json',
  //     };

  //     if (token) {
  //       headers['Authorization'] = `Token ${token}`;
  //     }

  //     // Determine API endpoint based on search term
  //     const response = await fetch(
  //       `${apiUrl}/searchCustomers?searchQuery=${encodeURIComponent(query)}`,
  //       {
  //         method: 'GET',
  //         headers,
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error('Failed to fetch search results');
  //     }

  //     const data = await response.json();
  //     setReports(data.customers || []); // Set technicians or empty array if no data
  //   } catch (error) {
  //     console.error('Error fetching search results:', error);
  //     setReports([]); // Clear table on error
  //   }
  // };
  // CSV Export Functions
  const downloadCSV = () => {
    const selectedCustomers = reoprts.filter((c) => selectedIds.includes(c.id));

    if (selectedCustomers.length === 0) {
      toast.error("Please select at least job group to export.");
      return;
    }
    const csvOptions = {
      filename: "Custom Reports",
      fieldSeparator: ",",
      quoteStrings: '"',
      decimalSeparator: ".",
      showLabels: true,
      showTitle: true,
      title: "Custom Reports",
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    // const formattedData = selectedCustomers.map((jobData) => ({
    //   "Customer Name": `${jobData?.customer?.firstName} ${jobData?.customer?.lastName}`,
    //   "Customer Id": jobData?.customer?.id,
    //   "Technicians Name": jobData?.technicians
    //     .map((tech: any) => `${tech?.firstName} ${tech?.lastName}`)
    //     .join(", "),
    //   "Technicians Id": jobData?.technicians
    //     .map((tech: any) => `${tech?.id} `)
    //     .join(", "),
    //   "Job Id": jobData?.id,
    //   "Job Name": `${jobData?.jobName}`,
    //   "Job Status": jobData?.jobStatus,
    //   "Job Description": jobData?.jobDescription
    //     .map((jobDescription: any) => `${jobDescription?.jobDescription}`)
    //     .join(", "),
    //   "vehicle id": jobData?.customer?.vehicles
    //     .map((tech: any) => `${tech?.id}`)
    //     .join(", "),
    //   "Vehicle Type": jobData?.vehicleType,
    //   Vin: jobData?.vin,
    //   Make: jobData?.make,
    //   Model: jobData?.model,
    //   Color: jobData?.color,
    //   PayRate: jobData?.payRate,
    //   "Created By": jobData?.createdBy,
    // }));

    // csvExporter.generateCsv(formattedData);
    const formattedData = selectedCustomers.map((jobData) => {
      const totalCost = jobData?.jobDescription?.reduce(
        (sum: number, item: { cost: string }) =>
          sum + (parseFloat(item.cost) || 0),
        0
      );
      const row: any = {};

      if (selectedColumn.includes("Customer Name")) {
        row[
          "Customer Name"
        ] = `${jobData?.customer?.firstName} ${jobData?.customer?.lastName}`;
      }

      if (selectedColumn.includes("Customer Id")) {
        row["Customer Id"] = jobData?.customer?.id;
      }

      if (selectedColumn.includes("Techician Name")) {
        row["Technicians Name"] = jobData?.technicians
          .map((tech: any) => `${tech?.firstName} ${tech?.lastName}`)
          .join(", ");
      }

      if (selectedColumn.includes("Techician Id")) {
        row["Technicians Id"] = jobData?.technicians
          .map((tech: any) => `${tech?.id}`)
          .join(", ");
      }

      if (selectedColumn.includes("Job Id")) {
        row["Job Id"] = jobData?.id;
      }

      if (selectedColumn.includes("Job Name")) {
        row["Job Name"] = jobData?.jobName;
      }

      if (selectedColumn.includes("Job Status")) {
        row["Job Status"] = jobData?.jobStatus ? "Completed" : "Inprogress";
      }

      if (selectedColumn.includes("Job Description")) {
        row["Job Description"] = jobData?.jobDescription
          .map((jobDescription: any) => `${jobDescription?.jobDescription}`)
          .join(", ");
      }
      if (selectedColumn.includes("Job Description")) {
        row["Sub Total"] = totalCost;
      }
      if (selectedColumn.includes("Vehicle Id")) {
        row["Vehicle Id"] = jobData?.customer?.vehicles
          .map((v: any) => `${v?.id}`)
          .join(", ");
      }

      if (selectedColumn.includes("Vehicle Type")) {
        row["Vehicle Type"] = jobData?.vehicleType;
      }

      if (selectedColumn.includes("Vin")) {
        row["Vin"] = jobData?.vin;
      }

      if (selectedColumn.includes("Make")) {
        row["Make"] = jobData?.make;
      }

      if (selectedColumn.includes("Model")) {
        row["Model"] = jobData?.model;
      }

      if (selectedColumn.includes("Color")) {
        row["Color"] = jobData?.color;
      }

      if (selectedColumn.includes("Payrate")) {
        row["PayRate"] = jobData?.payRate;
      }

      if (selectedColumn.includes("Created By")) {
        row["Created By"] = jobData?.createdBy;
      }

      return row;
    });

    csvExporter.generateCsv(formattedData);
  };

  const handleImportCSV = (file: File) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const reader = new FileReader();

    reader.onload = async (e) => {
      let text = (e.target?.result as string)
        .replace(/^\uFEFF/, "") // Remove BOM
        .trimStart();

      const lines = text.split(/\r?\n/);

      // ✅ Remove garbage line like "Technicians,Data"
      if (lines[0].toLowerCase().includes("technician")) {
        lines.shift();
      }

      text = lines.join("\n");

      const manualHeaders = [
        "ID",
        "VIN",
        "Client Phone Number",
        "Start Date",
        "Vehicle ID",
        "Job Description",
        "Technician Name",
        "Job ID",
        "Client Name",
        "Tech ID",
        "Date Of Birth",
        "Email",
        "Job Name",
      ];

      Papa.parse(text, {
        header: false, // Don't use auto headers
        skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];

          const cleanedData = rows
            .slice(1) // Skip CSV's own header row
            .map((row) => {
              const obj: any = {};
              manualHeaders.forEach((key, idx) => {
                let value: any = row[idx];
                if (typeof value === "string") {
                  value = value.trim();
                  const lower = value.toLowerCase();
                  if (lower === "true") value = true;
                  else if (lower === "false") value = false;
                  else if (lower === "null" || lower === "") value = null;
                }
                obj[key] = value;
              });
              return obj;
            })
            .filter((row) => {
              // ✅ Skip row if all keys === values like { Id: "id", Name: "name", ... }
              const isHeaderRow = Object.entries(row).every(
                ([key, val]) =>
                  typeof val === "string" &&
                  val.trim().toLowerCase() === key.trim().toLowerCase()
              );

              const hasRealData = Object.values(row).some(
                (val) =>
                  (typeof val === "string" && val.trim() !== "") ||
                  (typeof val === "number" && !isNaN(val)) ||
                  typeof val === "boolean"
              );

              return !isHeaderRow && hasRealData;
            });

          console.log("✅ Final Cleaned Data:", cleanedData);

          try {
            const response = await axios.post(
              `${apiUrl}/importCustomer`,
              { data: cleanedData },
              { headers }
            );
            toast.success("CSV Import Successful!");
            fetchCustomer(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            console.error("❌ Import failed:", error);

            // Check if it's an Axios error with a response
            if (
              typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as any).response?.data?.error === "string"
            ) {
              toast.error((error as any).response.data.error);
            } else if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error(String(error));
            }
          }

          setLoading(false);
        },
        error: (err: any) => {
          console.error("❌ CSV Parse error:", err);
          alert("❌ Error parsing CSV file.");
        },
      });
    };

    reader.readAsText(file);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleColumnSelect = (columns: string[]) => {
    setSelectedColumn(columns); // Just update the selected columns
  };

  const handleColumnChange = (column: string) => {
    setSelectedColumn((prevSelected) => {
      const updatedColumns = prevSelected.includes(column)
        ? prevSelected.filter((col) => col !== column)
        : [...prevSelected, column];

      if (setSelectedColumn) setSelectedColumn(updatedColumns); // Notify parent
      return updatedColumns;
    });
  };

  const renderRow = (cust: any) => {
    const isChecked = selectedIds.includes(cust.id);
    return (
      <tr key={cust.id}>
        <td key="checkbox">
          <label className="flex items-center cursor-pointer relative">
            <input
              type="checkbox"
              className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]"
              checked={isChecked}
              onChange={() => handleCheckboxChange(cust.id)}
            />
            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </span>
          </label>
        </td>
        {selectedColumn.includes("Customer Name") && (
          <td>
            {cust.customer.firstName} {cust.customer.lastName}
          </td>
        )}
        {selectedColumn.includes("Customer Id") && (
          <td>{cust?.customer?.id}</td>
        )}

        {selectedColumn.includes("Techician Name") && (
          <td>
            {cust?.technicians
              ?.map(
                (
                  item: { firstName: string; lastName: string },
                  index: number
                ) => `${item?.firstName} ${item?.lastName}`
              )
              .join(", ")}
          </td>
        )}
        {selectedColumn.includes("Techician Id") && (
          <td>
            {cust?.technicians
              ?.map(
                (item: { id: string; lastName: string }, index: number) =>
                  `${item?.id}`
              )
              .join(", ")}
          </td>
        )}
        {selectedColumn.includes("Job Id") && <td>{cust?.id}</td>}
        {selectedColumn.includes("Job Name") && <td>{cust.jobName}</td>}
        {selectedColumn.includes("Job Status") && (
          <td>{cust.jobStatus == false ? "Inprogress" : "Completed"}</td>
        )}
        {selectedColumn.includes("Job Description") && (
          <td>
            {cust?.jobDescription
              ?.map(
                (
                  item: { cost: string; jobDescription: string },
                  index: number
                ) => item.jobDescription
              )
              .join(", ")}
          </td>
        )}
        {selectedColumn.includes("Job Description") && (
          <td>
            {(() => {
              const totalCost = cust?.jobDescription?.reduce(
                (sum: number, item: { cost: string }) => {
                  const cost = parseFloat(item.cost) || 0; // convert to number, fallback to 0
                  return sum + cost;
                },
                0
              );
              return totalCost;
            })()}
          </td>
        )}

        {selectedColumn.includes("Job Description") && (
          <td>
            {(() => {
              if (!cust) return null;

              // Step 1: Calculate subtotal from jobDescription
              const subtotalcost = cust.jobDescription.reduce(
                (sum: number, item: any) => {
                  return sum + Number(item.cost || 0);
                },
                0
              );

              // Step 2: Get flat rate and percentage — fallback to technician if job-level value is null/invalid
              const technician = cust.technicians?.[0] || {};
              const simpleFlatRate =
                !isNaN(Number(cust.simpleFlatRate)) &&
                Number(cust.simpleFlatRate) > 0
                  ? Number(cust.simpleFlatRate)
                  : !isNaN(Number(technician.simpleFlatRate))
                  ? Number(technician.simpleFlatRate)
                  : 0;
              const amountPercentage =
                !isNaN(Number(cust.amountPercentage)) &&
                Number(cust.amountPercentage) > 0
                  ? Number(cust.amountPercentage)
                  : !isNaN(Number(technician.amountPercentage))
                  ? Number(technician.amountPercentage)
                  : 0;

              // Step 3: Calculate percentage amount
              const percentageAmount = (amountPercentage * subtotalcost) / 100;

              // Step 4: Check if flat rate or percentage amount is missing and display accordingly
              if (simpleFlatRate === 0 && amountPercentage === 0) {
                // If no valid flat rate or percentage, just show the subtotal
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    ${subtotalcost.toFixed(2)}
                  </div>
                );
              }

              // Step 5: Calculate total = subtotal + flat rate + percentage amount
              const totalCost =
                subtotalcost + simpleFlatRate + percentageAmount;

              // Step 6: Show red dot tooltip if neither flat rate nor percentage are valid

              // Step 7: Return total cost
              return (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  ${totalCost.toFixed(2)}
                </div>
              );
            })()}
          </td>
        )}

        {selectedColumn.includes("Vehicle Id") && (
          <td>
            {cust?.customer?.vehicles
              ?.map(
                (item: { id: string; jobDescription: string }, index: number) =>
                  item?.id
              )
              .join(", ")}
          </td>
        )}
        {selectedColumn.includes("Vehicle Type") && <td>{cust.vehicleType}</td>}
        {selectedColumn.includes("Vin") && <td>{cust.vin}</td>}
        {selectedColumn.includes("Model") && <td>{cust.model}</td>}
        {selectedColumn.includes("Make") && <td>{cust.make}</td>}
        {selectedColumn.includes("Color") && <td>{cust.color}</td>}
        {selectedColumn.includes("Payrate") && <td>{cust.payRate}</td>}
        {selectedColumn.includes("Created By") && <td>{cust.createdBy}</td>}
        {/* <td> */}
        {/* <Link href={`/all-reoprts/view?customerId=${cust.id}&allTrtCustomer`}>
            <Image alt="eye" src={Eye} className="w-[16px]" />
          </Link> */}
        {/* </td> */}
      </tr>
    );
  };

  return (
    <div
      className={`mobile_listing mobile_listing mx-auto mt-4 transition-all duration-300 ${
        isCollapsed ? "w-full pl-[5rem]" : "container"
      }`}
    >
      <Breadcrumb
        items={[{ label: "All Customer", href: "/all-reoprts/listing" }]}
      />
      <CommonHeader
        heading="All Customer"
        onPageSizeChange={handlePageSizeChange}
        // onColumnSelect={setSelectedColumn}
        onSearch={(term) => setSearchTerm(term)}
        onExport={downloadCSV}
        // onImport={handleImportCSV}
        userRole=""
        buttonLabel=""
        buttonLink=""
      />
      {/* <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          "Assign Customer",
          "Job Name",
          "Vin",
          "Make",
          "Model",
          "Job Id",
          "Vehicle Type",
          "Color",
          "Created By",
          "Job Description",
          "Vehicle Id",
          "Payrate",
          "Techician Name",
          "Job Status",
        ].map((col) => (
          <div key={col} className="flex items-center space-x-2">
            <label className="flex items-center cursor-pointer relative">
              <input
                type="checkbox"
                checked={selectedColumn.includes(col)}
                onChange={() => handleColumnChange(col)}
                className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"
              />
              <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </span>
            </label>
            <span className="font-medium">{col}</span>
          </div>
        ))}
      </div> */}

      <div className="flex gap-40 mb-10">
        {[
          ["Customer Name", "Customer Id", "Techician Name", "Techician Id"],
          ["Job Id", "Job Name", "Job Status", "Job Description"],
          ["Vehicle Id", "Vehicle Type", "Vin", "Model"],
          ["Make", "Color", "Payrate", "Created By"],
        ].map((group, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4">
            {group.map((col) => (
              <div key={col} className="flex items-center space-x-2">
                <label className="flex items-center cursor-pointer relative">
                  <input
                    type="checkbox"
                    checked={selectedColumn.includes(col)}
                    disabled={col === "Customer Name"}
                    onChange={() => handleColumnChange(col)}
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"
                  />
                  <span className="absolute text-white opacity-9 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </label>
                <span className="font-medium">{col}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md">
        {selectedColumn.length === 0 ? (
          <div className="text-center p-10 bg-gray-100 rounded-md">
            <p>Please select checkbox to display Custom Reports Data</p>
          </div>
        ) : (
          <table className="table w-full table-fixed">
            <thead>
              <tr>
                {/* {selectedColumn.includes("Checkbox") && ( */}
                <th className="w-[50px]">
                  <label className="flex items-center cursor-pointer relative">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === reoprts.length}
                      className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.length === reoprts.length
                            ? []
                            : reoprts.map((cust) => cust.id)
                        )
                      }
                    />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                  </label>
                </th>
                {/* )} */}
                <th
                  className="w-[150px]"
                  onClick={() => handleSort("Customer Name")}
                >
                  Customer Name
                </th>
                {selectedColumn.includes("Customer Id") && (
                  <th
                    className="w-[120px]"
                    onClick={() => handleSort("Customer Id")}
                  >
                    Customer Id
                  </th>
                )}
                {selectedColumn.includes("Techician Name") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Techician Name")}
                  >
                    Technician Name
                  </th>
                )}
                {selectedColumn.includes("Techician Id") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Techician Id")}
                  >
                    Technician Id
                  </th>
                )}
                {selectedColumn.includes("Job Id") && (
                  <th className="w-[100px]" onClick={() => handleSort("job id")}>
                    Job Id
                  </th>
                )}
                {selectedColumn.includes("Job Name") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Job Name")}
                  >
                    Job Title
                  </th>
                )}
                {selectedColumn.includes("Job Status") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Job Status")}
                  >
                    Job Status
                  </th>
                )}
                {selectedColumn.includes("Job Description") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Job Description")}
                  >
                    Job Description
                  </th>
                )}
                {selectedColumn.includes("Job Description") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Job Description")}
                  >
                    Sub Total
                  </th>
                )}
                {selectedColumn.includes("Job Description") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Job Description")}
                  >
                    Total
                  </th>
                )}
                {selectedColumn.includes("Vehicle Id") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Vehicle Id")}
                  >
                    Vehicle Id
                  </th>
                )}
                {selectedColumn.includes("Vehicle Type") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Vehicle Type")}
                  >
                    Vehicle Type
                  </th>
                )}
                {selectedColumn.includes("Vin") && (
                  <th className="w-[200px]" onClick={() => handleSort("Vin")}>
                    Vin
                  </th>
                )}
                {selectedColumn.includes("Model") && (
                  <th className="w-[150px]" onClick={() => handleSort("Model")}>
                    Model
                  </th>
                )}
                {selectedColumn.includes("Make") && (
                  <th className="w-[150px]" onClick={() => handleSort("Make")}>
                    Make
                  </th>
                )}
                {selectedColumn.includes("Color") && (
                  <th className="w-[150px]" onClick={() => handleSort("Color")}>
                    Color
                  </th>
                )}

                {selectedColumn.includes("Payrate") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Payrate")}
                  >
                    Pay Rate
                  </th>
                )}
                {selectedColumn.includes("Created By") && (
                  <th
                    className="w-[150px]"
                    onClick={() => handleSort("Created By")}
                  >
                    Created by
                  </th>
                )}
                {/* {selectedColumn.includes("Assign Customer") && ( */}

                {/* // )} */}

                {/* <th className="w-[160px]">Action</th> */}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Loader />
                  </td>
                </tr>
              ) : reoprts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <Empty />
                  </td>
                </tr>
              ) : (
                reoprts.map((cust) => renderRow(cust))
              )}
            </tbody>
          </table>
        )}
      </div>
      {reoprts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
