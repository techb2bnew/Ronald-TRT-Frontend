"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
  Paper,
  List,
  ListItem,
  TextField,
  Button,
  FormLabel,
  InputAdornment
} from '@mui/material';
import Breadcrumb from '@/app/component/breadcrumb';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

interface JobDescriptionItem {
  jobDescription: string;
  cost: string;
}

interface VehicleRate {
  vehicleType: string;
  rate: string;
}

interface TechnicianDetails {
  id: string;
  firstName: string;
  lastName: string;
  payRate: string;
  payVehicleType: string;
  simpleFlatRate: string | Record<string, string>; // Can be string or object
  amountPercentage: string;
  vehicleRates: VehicleRate[];
}

interface JobPayload {
  id?: string;
  jobName: string;
  labourCost: string;
  assignTechnicians: string[];
  technicianId: string[];
  assignCustomer: string;
  createdBy: string;
  jobId?: string;
  role: string;
}

const vehicleTypes = ['SUV', 'Sedan', 'Truck', 'Van', 'Motorcycle'];

export default function JobForm() {
  const [formData, setFormData] = useState<JobPayload>({
    jobName: '',
    labourCost: '',
    assignTechnicians: [],
    technicianId: [],
    assignCustomer: '',
    createdBy: 'admin',
    jobId: '',
    role: '',
  });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any[]>([]);
  const [descriptionCostFields, setDescriptionCostFields] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEdit, setIsEdit] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState<TechnicianDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);

    if (searchParams) {
      const jobId = searchParams.get('jobId') || '';
      if (jobId) {
        setJobId(jobId);
        setIsEdit(true);
        fetchJobData(jobId);
      }
    }

    fetchTechnicians();
    fetchCustomers();
  }, [searchParams]);

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types');
      const response = await fetch(`/api/fetchJobCustomerTechnician?endpoint=fetchTechnicianJob&types=${roleType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTechnicians(data.technician?.technicians || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const response = await fetch(`/api/fetchJobCustomerTechnician?endpoint=fetchCustomer&userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCustomer(data.customers?.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

const fetchJobData = async (jobid: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/fetchSingleJobs?jobid=${jobid}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (response.ok && data.jobs) {
      const jobData = data.jobs;
      const techIds = jobData.technicians?.map((tech: any) => String(tech.id)) || [];

      const techDetails = jobData.technicians?.map((tech: any) => {
        // Get simpleFlatRate with priority to UserJob if available
        const rawSimpleFlatRate = tech.UserJob?.simpleFlatRate || tech.simpleFlatRate;
        
        // Parse the simpleFlatRate
        let parsedSimpleFlatRate: Record<string, string | number> = {};
        
        if (rawSimpleFlatRate) {
          try {
            // Handle string values (could be JSON or direct value)
            if (typeof rawSimpleFlatRate === 'string') {
              // Try to parse as JSON first
              try {
                const parsed = JSON.parse(rawSimpleFlatRate);
                if (parsed && typeof parsed === 'object') {
                  parsedSimpleFlatRate = parsed;
                } else if (!isNaN(Number(rawSimpleFlatRate))) {
                  // If it's a plain number string (like "56"), convert to object with default key
                  parsedSimpleFlatRate = { 'default': Number(rawSimpleFlatRate) };
                }
              } catch {
                // If JSON parsing fails, try to extract numeric value
                const numericValue = Number(rawSimpleFlatRate.replace(/[^0-9.]/g, ''));
                if (!isNaN(numericValue)) {
                  parsedSimpleFlatRate = { 'default': numericValue };
                }
              }
            } else if (typeof rawSimpleFlatRate === 'object') {
              // Already an object, use as is
              parsedSimpleFlatRate = rawSimpleFlatRate;
            } else if (typeof rawSimpleFlatRate === 'number') {
              parsedSimpleFlatRate = { 'default': rawSimpleFlatRate };
            }
          } catch (error) {
            console.error('Error parsing simpleFlatRate:', error);
          }
        }

        // Format the rates for display (convert all values to strings and clean up)
        const formattedRates: Record<string, string> = {};
        Object.entries(parsedSimpleFlatRate).forEach(([key, value]) => {
          // Convert number to string if needed, then clean
          const stringValue = typeof value === 'number' ? value.toString() : String(value || '');
          formattedRates[key] = stringValue.replace(/\$/g, '').trim();
        });

        return {
          id: String(tech.id),
          firstName: tech.firstName || '',
          lastName: tech.lastName || '',
          payRate: tech.UserJob?.payRate || tech.payRate || '',
          payVehicleType: tech.UserJob?.payVehicleType || tech.payVehicleType || '',
          simpleFlatRate: formattedRates, // Use the cleaned rates
          amountPercentage: tech.UserJob?.amountPercentage || tech.amountPercentage || '',
          vehicleRates: parseVehicleRates(
            tech.UserJob?.payVehicleType || tech.payVehicleType || '',
            formattedRates
          )
        };
      }) || [];

      setFormData({
        ...formData,
        assignCustomer: String(jobData.customer?.id || jobData.assignCustomer || ''),
        jobName: jobData.jobName || '',
        labourCost: jobData.labourCost || '',
        assignTechnicians: techIds,
        technicianId: techIds,
        createdBy: jobData.createdBy || 'admin',
      });
      setJobId(jobData.id);
      setSelectedTechnicians(techDetails);
    }
  } catch (error) {
    console.error('Error fetching job data:', error);
    toast.error('An error occurred while fetching job data');
  }
};

  const parseVehicleRates = (payVehicleType: string, simpleFlatRate: string | Record<string, string>): VehicleRate[] => {
    // If no payVehicleType is specified, check if we have a default rate
    if (!payVehicleType) {
      if (typeof simpleFlatRate === 'object' && simpleFlatRate['default']) {
        return [{ vehicleType: 'default', rate: simpleFlatRate['default'] }];
      }
      return [];
    }

    const vehicleTypes = payVehicleType.split(',').map(v => v.trim());
    const rates: VehicleRate[] = [];

    // Handle simpleFlatRate whether it's a string or object
    let rateObj: Record<string, string> = {};

    if (typeof simpleFlatRate === 'string') {
      try {
        rateObj = JSON.parse(simpleFlatRate);
      } catch {
        // If parsing fails, check if it's a plain number
        if (!isNaN(Number(simpleFlatRate))) {
          rateObj = { 'default': simpleFlatRate };
        } else {
          rateObj = {};
        }
      }
    } else if (typeof simpleFlatRate === 'object') {
      rateObj = simpleFlatRate;
    }

    // Create rates array
    vehicleTypes.forEach(vehicleType => {
      // Check for both exact match and case-insensitive match
      const rateKey = Object.keys(rateObj).find(
        key => key.toLowerCase() === vehicleType.toLowerCase()
      );

      rates.push({
        vehicleType,
        rate: rateKey ? rateObj[rateKey] : '0'
      });
    });

    // Add default rate if it exists and no vehicle rates were found
    if (rates.length === 0 && rateObj['default']) {
      rates.push({
        vehicleType: 'default',
        rate: rateObj['default']
      });
    }

    return rates;
  };

  const handleVehicleRateChange = (techId: string, vehicleType: string, value: string) => {
    setSelectedTechnicians(prev =>
      prev.map(tech => {
        if (tech.id === techId) {
          const updatedRates = tech.vehicleRates.map(vr =>
            vr.vehicleType === vehicleType ? { ...vr, rate: value } : vr
          );

          // Convert the updated rates back to simpleFlatRate format
          const rateObj = updatedRates.reduce((acc, curr) => {
            acc[curr.vehicleType] = curr.rate;
            return acc;
          }, {} as Record<string, string>);

          return {
            ...tech,
            vehicleRates: updatedRates,
            simpleFlatRate: rateObj // Store as object
          };
        }
        return tech;
      })
    );
  };

  const handleTechnicianChange = (techId: string) => {
    setFormData(prev => {
      const currentTechs = [...prev.assignTechnicians];
      const techIndex = currentTechs.indexOf(techId);

      if (techIndex === -1) {
        currentTechs.push(techId);
      } else {
        currentTechs.splice(techIndex, 1);
      }

      const updatedSelectedTechs = technicians
        .filter((tech: any) => currentTechs.includes(String(tech.id)))
        .map((tech: any) => {
          let simpleFlatRate: Record<string, string> = {};

          // Handle the incoming simpleFlatRate value
          if (tech.simpleFlatRate) {
            if (typeof tech.simpleFlatRate === 'string') {
              try {
                // Try to parse JSON string
                const parsed = JSON.parse(tech.simpleFlatRate.replace(/\\/g, ''));
                if (parsed && typeof parsed === 'object') {
                  simpleFlatRate = parsed;
                } else if (!isNaN(Number(tech.simpleFlatRate))) {
                  // If it's a plain number string, store as default
                  simpleFlatRate = { 'default': tech.simpleFlatRate };
                }
              } catch {
                if (!isNaN(Number(tech.simpleFlatRate))) {
                  simpleFlatRate = { 'default': tech.simpleFlatRate };
                }
              }
            } else if (typeof tech.simpleFlatRate === 'object') {
              simpleFlatRate = tech.simpleFlatRate;
            }
          }

          return {
            id: String(tech.id),
            firstName: tech.firstName,
            lastName: tech.lastName,
            payRate: tech.payRate || '',
            payVehicleType: tech.payVehicleType || '',
            simpleFlatRate, // Now consistently an object
            amountPercentage: tech.amountPercentage || '',
            vehicleRates: parseVehicleRates(tech.payVehicleType, simpleFlatRate)
          };
        });

      setSelectedTechnicians(updatedSelectedTechs);
      return {
        ...prev,
        assignTechnicians: currentTechs,
        technicianId: currentTechs
      };
    });
  };


  const handleTechnicianDetailChange = (techId: string, field: string, value: string) => {
    setSelectedTechnicians(prev =>
      prev.map(tech => {
        if (tech.id === techId) {
          if (field === 'payRate') {
            let updatedFields: Partial<TechnicianDetails> = {
              payRate: value,
              amountPercentage: '',
              simpleFlatRate: {},
              vehicleRates: [],
              payVehicleType: '',
            };

            if (value === 'Pay Per Vehicles') {
              updatedFields.payVehicleType = 'SUV, Sedan, Truck, Van, Motorcycle';
              updatedFields.vehicleRates = vehicleTypes.map(v => ({ vehicleType: v, rate: '0' }));
              updatedFields.simpleFlatRate = vehicleTypes.reduce((acc, curr) => {
                acc[curr] = '0';
                return acc;
              }, {} as Record<string, string>);
            }

            return { ...tech, ...updatedFields };
          }

          return { ...tech, [field]: value };
        }
        return tech;
      })
    );
  };

  const filteredTechnicians = technicians.filter(tech =>
    `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.jobName?.trim()) newErrors.jobName = 'Job Name is required';
    if (!formData.assignCustomer) newErrors.assignCustomer = 'Customer is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const technicianData = localStorage.getItem('technicianData');
      const roleType = localStorage.getItem('types');

      let estimatedByName = '';
      let labourCost = null;  
      let assignTechnician = null;
      if (technicianData) {
        try {
          const parsed = JSON.parse(technicianData);
          estimatedByName = `${parsed.firstName} ${parsed.lastName}`;
          labourCost = parsed.labourCost;
          assignTechnician = [parsed.id];
        } catch (err) {
          console.error('Failed to parse technicianData:', err);
        }
      }

      // Prepare the request body
      const requestBody = {
        jobName: formData.jobName,
        assignCustomer: formData.assignCustomer,
        assignTechnician: roleType === 'single-technician' ? assignTechnician : formData.technicianId, 
        createdBy: formData.createdBy,
        roleType: roleType,
        estimatedBy: estimatedByName,
        labourCost: labourCost,
        selectedTechnicians: selectedTechnicians.map(tech => ({
          id: tech.id,
          payRate: tech.payRate,
          payVehicleType: tech.payVehicleType,
          simpleFlatRate: typeof tech.simpleFlatRate === 'string' ? tech.simpleFlatRate : JSON.stringify(tech.simpleFlatRate),
          amountPercentage: tech.amountPercentage,
        })),
        jobId: jobId || undefined,
      };

      const endpoint = isEdit ? '/api/jobCreateUpdate' : '/api/jobCreateUpdate';
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(isEdit ? 'Job updated successfully' : 'Job created successfully');
        if (searchParams!.has('completeOrder')) {
          router.push('/jobs/complete-job/listing');
        } else if (searchParams!.has('vehicleInfo')) {
          router.push('/reporting/vehicle-info')
        } else if (searchParams!.has('groupjob')) {
          router.push('/jobs/job-group/listing')
        } else {
          router.push('/jobs/active-job');
        }
      } else {
        toast.error(result.error || 'Error saving job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('An error occurred while saving the job');
    } finally {
      setSubmitting(false);
    }
  };

  const CustomExpandIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transition: 'transform 0.2s' }}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const handleJobNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, jobName: value }));
    if (value.trim()) {
      setErrors(prev => ({ ...prev, jobName: '' }));
    }
  };

  const handleAssignCustomerChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, assignCustomer: value }));
    if (value) {
      setErrors(prev => ({ ...prev, assignCustomer: '' }));
    }
  };
  const isEmpty = (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      return value.trim() === '' || value === '{}' || value === '0';
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  };
  return (
    <div className='w-[60%] m-auto mb-5'>
      <Breadcrumb
        items={[
          isEdit
            ? { label: 'Edit Job' }
            : { label: 'Create New Job', href: '/jobs/create-job/create' },
        ]}
      />
      <h1 className="text-lg leading-6 font-bold text-gray-900">
        {isEdit ? 'Edit Job' : 'Create New Job'}
      </h1>

      <div className='bg-white p-4 mt-5'>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className='mb-2 items-start gap-3 relative'>
              <FormControl fullWidth size="small">
                <InputLabel id="assignCustomer" color="warning">Select customer *</InputLabel>
                <Select
                  labelId="assignCustomer"
                  id="select-assignCustomer"
                  color="warning"
                  value={formData.assignCustomer}
                  label="Select customer"
                  name="assignCustomer"
                  onChange={handleAssignCustomerChange}
                >
                  {customer.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.fullName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.assignCustomer && (
                  <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                    {errors.assignCustomer}
                  </div>
                )}
              </FormControl>
            </div>

            <div className='relative w-[100%]'>
              <TextField
                fullWidth
                name="jobName"
                id="outlined-basic"
                color="warning"
                label="Enter Job Name *"
                size="small"
                value={formData.jobName}
                onChange={handleJobNameChange}
              />
              {errors.jobName && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {errors.jobName}
                </div>
              )}
            </div>
          </div>

          {userType !== 'single-technician' && (
            <div className='mb-4 flex items-start gap-3 relative mt-3'>
              <FormControl fullWidth size="small">
                <FormLabel color="warning" className='mb-4'>Assign Technician(s) to this vehicle*</FormLabel>
                <TextField
                  label="Search Technician"
                  variant="outlined"
                  fullWidth
                  color="warning"
                  size="small"
                  type='search'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        🔍
                      </InputAdornment>
                    ),
                  }}
                />
                <Paper variant="outlined" style={{ maxHeight: 200, overflowY: "auto" }}>
                  <List dense>
                    {filteredTechnicians.map((tech) => {
                      const value = String(tech.id);
                      return (
                        <ListItem
                          key={value}
                          component="div"
                          onClick={() => handleTechnicianChange(value)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <Checkbox
                            edge="start"
                            color="warning"
                            checked={formData.assignTechnicians.includes(value)}
                            tabIndex={-1}
                            disableRipple
                          />
                          <ListItemText primary={`${tech.firstName} ${tech.lastName}`} />
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </FormControl>
            </div>
          )}

          {selectedTechnicians.length > 0 && userType !== 'single-technician' && (
            <h2 className='text-lg font-bold mb-3 text-[#000]'>Pay Rates</h2>
          )}
          {userType !== 'single-technician' && (
            <div>
          {selectedTechnicians.map((tech, techIndex) => (
            <Accordion key={tech.id} className="mb-4">
              <AccordionSummary
                expandIcon={<CustomExpandIcon />}
                aria-controls={`panel-${tech.id}-content`}
                id={`panel-${tech.id}-header`}
              >
                <h4 className='font-bold text-sm capitalize'>
                  {tech.firstName} {tech.lastName}
                </h4>
              </AccordionSummary>
              <AccordionDetails>
                <div className="space-y-4">
                  <div className="mb-4">
                    <FormControl fullWidth size="small">
                      <InputLabel id={`payRate-${techIndex}`} color="warning">Pay Rate</InputLabel>
                      <Select
                        labelId={`payRate-${techIndex}`}
                        color="warning"
                        id={`select-payRate-${techIndex}`}
                        value={tech.payRate}
                        label="Pay Rate"
                        onChange={(e) => handleTechnicianDetailChange(tech.id, 'payRate', e.target.value)}
                      >
                        <MenuItem value="Pay Per Vehicles">Pay Per Vehicle</MenuItem>
                        <MenuItem value="Pay Per Job">Pay Per Job</MenuItem>
                        <MenuItem value="Simple Flat Rate">Simple Flat Rate</MenuItem>
                        <MenuItem value="Simple Percentage">Simple Percentage</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  {tech.payRate === 'Pay Per Vehicles' && tech.vehicleRates.length > 0 && (
                    <div className="grid gap-4 mb-4">
                      <h5 className='font-medium text-xs'>Vehicle Rates:</h5>
                      {tech.vehicleRates.map((vehicleRate) => (
                        <div key={`${tech.id}-${vehicleRate.vehicleType}`} className="grid grid-cols-2 gap-4">
                          <div>
                            <TextField
                              fullWidth
                              label="Vehicle Type"
                              size="small"
                              color="warning"
                              value={vehicleRate.vehicleType}
                              disabled
                            />
                          </div>
                          <div>
                            <TextField
                              fullWidth
                              type="number"
                              label="Rate ($)"
                              size="small"
                              color="warning"
                              value={vehicleRate.rate}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Validate the input format (max 5 digits before decimal, exactly 2 after)
                                const regex = /^\d{0,5}(\.\d{0,2})?$/;
                                if (value === '' || regex.test(value)) {
                                  handleVehicleRateChange(tech.id, vehicleRate.vehicleType, value);
                                }
                              }}
                              inputProps={{
                                step: "0.01",
                                min: 0,
                                pattern: "\\d{0,5}(\\.\\d{0,2})?",
                                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                                  // Prevent invalid characters
                                  if (!/[0-9.]/.test(e.key) &&
                                    e.key !== 'Backspace' &&
                                    e.key !== 'Delete' &&
                                    e.key !== 'ArrowLeft' &&
                                    e.key !== 'ArrowRight') {
                                    e.preventDefault();
                                  }
                                },
                                onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                                  // Format to exactly 2 decimal places when leaving the field
                                  const value = e.target.value;
                                  if (value.includes('.')) {
                                    const [whole, decimal] = value.split('.');
                                    const formattedDecimal = decimal.padEnd(2, '0').slice(0, 2);
                                    const formattedValue = `${whole}.${formattedDecimal}`;
                                    handleVehicleRateChange(tech.id, vehicleRate.vehicleType, formattedValue);
                                  } else if (value) {
                                    // Add .00 if no decimal entered
                                    handleVehicleRateChange(tech.id, vehicleRate.vehicleType, `${value}.00`);
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(tech.payRate === 'Simple Percentage') && (
                    <div className="mb-4">
                      <TextField
                        fullWidth
                        type="number"
                        label="Percentage (%)"
                        size="small"
                        color="warning"
                        value={tech.amountPercentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Ensure value is between 0 and 100
                          if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
                            handleTechnicianDetailChange(tech.id, 'amountPercentage', value);
                          }
                        }}
                        inputProps={{
                          min: 0,
                          max: 100,
                          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                            // Prevent typing values greater than 100
                            if (e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                              const target = e.target as HTMLInputElement;
                              const newValue = Number(target.value + e.key);
                              if (newValue > 100) {
                                e.preventDefault();
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}

                  {(tech.payRate === 'Simple Flat Rate' || tech.payRate === 'Pay Per Job') && (
                    <div className="mb-4">
                      <TextField
                        fullWidth
                        type="number"
                        label="Flat Rate ($)"
                        size="small"
                        color="warning"
                        value={
                          typeof tech.simpleFlatRate === 'object'
                            ? tech.simpleFlatRate['technician'] || tech.simpleFlatRate['default'] || ''
                            : typeof tech.simpleFlatRate === 'string'
                              ? tech.simpleFlatRate
                              : ''
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          const regex = /^\d{0,5}(\.\d{0,2})?$/;
                          if (value === '' || regex.test(value)) {
                            setSelectedTechnicians(prev =>
                              prev.map(t => {
                                if (t.id === tech.id) {
                                  // Handle both string and object cases
                                  const currentSimpleFlatRate = typeof t.simpleFlatRate === 'string'
                                    ? { default: t.simpleFlatRate }
                                    : t.simpleFlatRate || {};

                                  return {
                                    ...t,
                                    simpleFlatRate: {
                                      ...currentSimpleFlatRate,
                                      technician: value
                                    }
                                  };
                                }
                                return t;
                              })
                            );
                          }
                        }}
                        inputProps={{
                          step: "0.01",
                          min: 0,
                          pattern: "\\d{0,5}(\\.\\d{0,2})?",
                          onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (!/[0-9.]/.test(e.key) &&
                              e.key !== 'Backspace' &&
                              e.key !== 'Delete' &&
                              e.key !== 'ArrowLeft' &&
                              e.key !== 'ArrowRight') {
                              e.preventDefault();
                            }
                          },
                          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                            const value = e.target.value;
                            if (value) {
                              let formattedValue = value;
                              if (value.includes('.')) {
                                const [whole, decimal] = value.split('.');
                                formattedValue = `${whole}.${decimal.padEnd(2, '0').slice(0, 2)}`;
                              } else {
                                formattedValue = `${value}.00`;
                              }

                              setSelectedTechnicians(prev =>
                                prev.map(t => {
                                  if (t.id === tech.id) {
                                    const currentSimpleFlatRate = typeof t.simpleFlatRate === 'string'
                                      ? { default: t.simpleFlatRate }
                                      : t.simpleFlatRate || {};

                                    return {
                                      ...t,
                                      simpleFlatRate: {
                                        ...currentSimpleFlatRate,
                                        technician: formattedValue
                                      }
                                    };
                                  }
                                  return t;
                                })
                              );
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
          </div>
          )}

          <div className="flex gap-4 justify-end mt-4 mb-4">
            <button
              type="submit"
              className="primary-bg pl-5 pr-5 p-2 rounded flex items-center justify-center gap-2 min-w-[100px]"
              color="primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="animate-spin">↻</span>
                  Submitting...
                </>
              ) : (
                isEdit ? 'Update Job' : 'Create Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}