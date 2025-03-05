import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Checkbox } from '@mui/material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

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

interface RolePayload {
  name: string;
  type: string;
  permissions: { PermissionId: number; permissionName: string; isActive: boolean }[];
  id?: string; // 👈 Make `id` optional
}


const RolesForm: React.FC = () => {
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState('');
    const router = useRouter();
  const [inactive, setInactive] = useState(false);
  const [isEdit, setIsEdit] = useState<boolean>(false); // To differentiate between create and edit 
  const [roleId, setRoleId] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
   const [permissions, setPermissions] = useState<Permissions>({
    technician: { create: false, edit: false, delete: false, approve: false },
    customer: { create: false, edit: false, delete: false, approve: false },
    workshop: { create: false, edit: false, delete: false, approve: false },
    workshopAdmin: { create: false, edit: false, delete: false, approve: false },
    jobs: { create: false, edit: false, delete: false, approve: false },
    enterprises: { create: false, edit: false, delete: false, approve: false },
  });
  console.log(permissions, 'permissionspermissions')
  const handlePermissionChange = (role: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [action]: !prev[role][action] },
    }));
  };

  const preparePayload = () => {
    const permissionsArray: { 
      RoleId?: number; 
      PermissionId: number; 
      permissionName: string; 
      actions: string; 
      isActive: boolean; 
    }[] = []; // Explicitly type the array with RoleId & PermissionId
  
    // Loop over roles and their actions
    Object.keys(permissions).forEach((role) => {
      Object.keys(permissions[role]).forEach((action) => {
        if (permissions[role][action]) {
          // Find the corresponding permission from `allPermissions`
          const permissionObj = allPermissions.find(
            (p) => p.permissionName.toLowerCase().trim() === role.toLowerCase().trim()
          );
  
          // Push the permission object with RoleId & PermissionId
          permissionsArray.push({
            RoleId: isEdit && roleId ? Number(roleId) : undefined, // Only send RoleId in edit mode
            PermissionId: permissionObj ? permissionObj.id : 0, // Get ID from API response
            permissionName: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize role
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
      id: isEdit ? roleId : undefined, // Send roleId only in edit mode
    };
  
    console.log("📤 Final Payload:", payload);
    return payload;
  };
  
  
  
  
  
  


  const handleSave = async () => {
    const payload = preparePayload();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''; // Use environment variable or empty string 
    const endpoint = isEdit ? `${apiUrl}/roles/updateRole` : `${apiUrl}/createRole`;

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
         toast.success(`Role ${isEdit ? 'updated' : 'created'} successfully!`);
         router.push('/role/listing');
    } catch (error) { 
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} role. Please try again.`);
    }
};


const fetchRoleData = async (roleId: string) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  try {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}/roles/getRoleById?roleId=${roleId}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    console.log('API Response:', data); // ✅ Check full API response

    if (!response.ok) throw new Error(data.error || 'Error fetching role data');

    if (!Array.isArray(data) || data.length === 0) {
      console.error('❌ API response is not an array or is empty:', data);
      return;
    }

    const roleData = data[0]; // ✅ Extract first object from the array
    console.log('Extracted Role Data:', roleData);

    setRoleName(roleData.name || ''); 
    setRoleType(roleData.type || ''); 
    setRoleId(roleData.id || ''); 
    setAllPermissions(roleData.Permissions || []);
    if (!roleData.Permissions || !Array.isArray(roleData.Permissions)) {
      console.error('❌ Permissions array is missing or invalid:', roleData.Permissions);
      return;
    }

    // ✅ Default permissions structure
    const updatedPermissions: Permissions = {
      technician: { create: false, edit: false, delete: false, approve: false },
      customer: { create: false, edit: false, delete: false, approve: false },
      workshop: { create: false, edit: false, delete: false, approve: false },
      workshopAdmin: { create: false, edit: false, delete: false, approve: false },
      jobs: { create: false, edit: false, delete: false, approve: false },
      enterprises: { create: false, edit: false, delete: false, approve: false },
    };

    roleData.Permissions.forEach((perm: any) => {
      console.log('🔹 Permission Object:', perm);

      if (!perm.permissionName || !perm.RolePermissions) {
        console.warn('⚠️ Missing permissionName or RolePermissions:', perm);
        return;
      }

      const roleKey = perm.permissionName.toLowerCase();
      console.log(roleKey, 'rolekey >>>>>>');

      if (perm.RolePermissions.isActive) {
        const action = perm.RolePermissions.action;
        console.log(`✅ Setting Permission: ${roleKey} -> ${action}`);

        if (updatedPermissions[roleKey]) {
          updatedPermissions[roleKey][action] = true;
        }
      }
    });

    setPermissions(updatedPermissions);
  } catch (error) {
    console.error('❌ Error fetching role data:', error);
    toast.error('An error occurred while fetching role data');
  }
};



 useEffect(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const roleId = searchParams.get('roleId') || '';
      console.log(roleId, 'roleIdroleId')
      if (roleId) {
        setIsEdit(true);  // Set to true if `roleId` exists in the URL 
        setRoleId(roleId);
        fetchRoleData(roleId);
      } else {
        setIsEdit(false); // Set to false if `roleId` is missing
      } 
    }, []);

  return (
    <div className="container mx-auto p-6 bg-gray-50">
      <div className="flex gap-12">
        {/* Create Roles */}
        <div className="w-[40%] bg-white p-6 shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{isEdit ? 'Edit Role' : 'Create Role'}</h2>

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
                <MenuItem value="ifs">IFS</MenuItem> 
              </Select>
            </FormControl>
          </div>
{/* 
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={inactive}
              onChange={() => setInactive(!inactive)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Inactive</label>
          </div> */}
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
