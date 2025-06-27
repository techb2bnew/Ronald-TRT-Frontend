import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import Edit from "../../../public/edit.svg";
import Eye from "../../../public/eye.svg";
import Delete from "../../../public/delete.svg";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface TableActionsProps {
  editRoute: string;
  deleteRoute: string;
  itemId: string;
  idKey: string;
  viewRoute: string;
  userRole: string; // 🔹 Pass the user role to filter permissions
  onDeleteSuccess?: () => void;
}

const TableActions: React.FC<TableActionsProps> = ({
  viewRoute,
  editRoute,
  deleteRoute,
  idKey,
  itemId,
  userRole,
  onDeleteSuccess,
}) => {
  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");

    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(Array.isArray(parsedPermissions) ? parsedPermissions : []);
        // console.log("✅ Loaded Permissions:", parsedPermissions);
      } catch (error) {
        console.error("❌ Failed to parse permissions:", error);
      }
    } else {
      console.log("⚠️ No permissions found in localStorage. Showing all icons.");
    }
  }, []);

  // ✅ Function to check permission based on role and action
  const hasPermission = (action: string) => {
    if (permissions.length === 0) return true; // If no permissions exist, show all icons

    return permissions.some(
      (perm) => perm.permissionName === userRole && perm.action === action && perm.isActive
    );
  };

  // ✅ Permission Checks
  const canEdit = hasPermission("edit");
  const canDelete = hasPermission("delete"); 

  // ✅ Delete Handler
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You can't undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const body = JSON.stringify({
        [idKey]: itemId,
        deletedStatus: true,
      });

      const response = await fetch(deleteRoute, {
        method: "POST",
        headers,
        body,
      });

      const data = await response.json();

      if (response.ok) {
        await Swal.fire("Deleted!", "Your item has been deleted.", "success");
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      }else {
      // If the error message is about associated jobs, show a specific alert
      if (data.error === "Customer has associated jobs. Please delete the jobs first before deleting the customer.") {
        Swal.fire("Error!", data.error, "error");
      } else {
        Swal.fire("Error!", data.message || "Failed to delete the item.", "error");
      }
    }
    } catch (error) {
      Swal.fire("Error!", "An error occurred while deleting the item.", "error");
    }
  };

  return (
    <div className="flex items-center space-x-1 laptop__icon">
      
        <Link className="p-1" href={viewRoute} data-tooltip-id="view"
        data-tooltip-content="View">
          <Image alt="eye" src={Eye} className="w-[16px]" />
        </Link>
        <Tooltip id="view" place="top" />
      {canEdit && (
        <Link className="p-1" href={editRoute} data-tooltip-id="edit"
        data-tooltip-content="Edit">
          <Image alt="edit" src={Edit} className="w-[14px]" />
        </Link>
      )}
      <Tooltip id="edit" place="top" />
      {canDelete && (
        <button className="p-2" onClick={handleDelete} data-tooltip-id="delete"
        data-tooltip-content="Delete">
          <Image alt="delete" src={Delete} className="w-[12px]" />
        </button>
      )}
      <Tooltip id="delete" place="top" />

    </div>
  );
};

export default TableActions;
