import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Checkbox } from '@mui/material';

type Permissions = {
  [role: string]: {
    [action: string]: boolean;
  };
};

type Permission = {
  permissionName: string;
  actions: string;
  isActive: boolean;
};


const RolesForm: React.FC = () => {
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState('');
  const [inactive, setInactive] = useState(false);

   const [permissions, setPermissions] = useState<Permissions>({
    technician: { create: false, edit: false, delete: false, approve: false },
    customer: { create: false, edit: false, delete: false, approve: false },
    workshop: { create: false, edit: false, delete: false, approve: false },
    workshopAdmin: { create: false, edit: false, delete: false, approve: false },
    jobs: { create: false, edit: false, delete: false, approve: false },
    enterprises: { create: false, edit: false, delete: false, approve: false },
  });

  const handlePermissionChange = (role: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [action]: !prev[role][action] },
    }));
  };

  const preparePayload = () => {
   const permissionsArray: Permission[] = []; // Explicitly type the array

    // Loop over roles and their actions
    Object.keys(permissions).forEach((role) => {
      Object.keys(permissions[role]).forEach((action) => {
        if (permissions[role][action]) {
          permissionsArray.push({
            permissionName: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize the first letter of the role
            actions: action,
            isActive: true,
          });
        }
      });
    });
    const payload = {
      name: roleName || 'defaultRoleName',
      type: roleType,
      permissions: permissionsArray,
    };

    console.log(payload); // This is the payload you'd send to your API
    return payload;
  };

  const handleSave = async () => {
    const payload = preparePayload();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''; // Use environment variable or empty string
    const endpoint = `${apiUrl}/createRole`; // API Endpoint

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token") || ""}` // Optional Auth Token
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Success:", data); // Handle success response

        alert("Role updated successfully!");
    } catch (error) {
        console.error("Error updating role:", error);
        alert("Failed to update role. Please try again.");
    }
};


  return (
    <div className="container mx-auto p-6 bg-gray-50">
      <div className="flex gap-12">
        {/* Create Roles */}
        <div className="w-[40%] bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Create Roles</h2>

          <div className="mb-5">
            <TextField
              fullWidth
              size="small"
              name="roleName"
              id="outlined-basic"
              color="warning"
              label="Role Name *"
              variant="outlined"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>

          <div className="mb-5">
            <FormControl fullWidth size="small">
              <InputLabel id="role-type" color="warning">
                Role type*
              </InputLabel>
              <Select
                labelId="role-type"
                id="role-type"
                value={roleType}
                label="Role type"
                name="roleType"
                color="warning"
                onChange={(e) => setRoleType(e.target.value)}
              >
                <MenuItem value="enterprise">Enterprise</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={inactive}
              onChange={() => setInactive(!inactive)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Inactive</label>
          </div>
        </div>

        {/* Permissions */}
        <div className="w-[60%] bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Permissions</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 text-left">
              <div className="font-medium text-gray-700 text-left text-sm"> </div>
              <div className="font-medium text-gray-700 text-left text-sm">Create</div>
              <div className="font-medium text-gray-700 text-left text-sm">Edit</div>
              <div className="font-medium text-gray-700 text-left text-sm">Delete</div>
              <div className="font-medium text-gray-700 text-left text-sm">Approve</div>
            </div>

            {/* Repeat for other roles */}
            {['technician', 'customer', 'workshop', 'workshopAdmin', 'jobs', 'enterprises'].map((role) => (
              <div key={role} className="grid grid-cols-5 gap-5 text-left items-center">
                <div className='text-sm'>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                {['create', 'edit', 'delete', 'approve'].map((action) => (
                  <label key={`${role}-${action}`} className="flex items-center cursor-pointer relative">
                    <input
                      checked={permissions[role][action]}
                      onChange={() => handlePermissionChange(role, action)}
                      type="checkbox"
                      className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[#EF502E] checked:border-[#EF502E]"
                      id={`check-${role}-${action}`}
                    />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-right">
        <button onClick={handleSave} type="submit" className="primary-bg pl-5 pr-5 text-sm p-2 rounded">
          Submit
        </button>
      </div>
    </div>
  );
};

export default RolesForm;
