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
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
interface SelectedTechnician {
  userId: string;
  techFlatRate?: string;
  rRate?: string;
}
interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  techType: string;
}

interface JobPayload {
  id?: string;
  jobName: string;
  labourCost: string;
  estimatedCost: string;
  techFlatRate: string;
  rRate: string;
  assignTechnicians: string[];
  technicianId: string[];
  assignCustomer: string;
  notes:string;
  assignManager: string;
  createdBy: string;
  jobId?: string;
  startDate?: string;
  endDate?: string;
  role: string;
}

export default function JobForm() {
  const [formData, setFormData] = useState<JobPayload>({
    jobName: '',
    labourCost: '',
    estimatedCost: '',
    techFlatRate: '',
    rRate: '',
    assignTechnicians: [],
    technicianId: [],
    assignCustomer: '',
    notes: '',
    assignManager: '',
    createdBy: 'admin',
    jobId: '',
    startDate: '',
    endDate: '',
    role: '',
  });

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [manager, setManager] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any[]>([]);
  const [descriptionCostFields, setDescriptionCostFields] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEdit, setIsEdit] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTechTerm, setTechSearchTerm] = useState('');
  const router = useRouter();
  const [totalPages, setTotalPages] = useState(1);
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedNormalTechnicians, setSelectedNormalTechnicians] = useState<any[]>([]);
  const [selectedRrTechnicians, setSelectedRrTechnicians] = useState<any[]>([]);
  const [simpleFlatRate, setSimpleFlatRate] = useState<string>(''); // For normal technicians
  const [rirValue, setRirValue] = useState<string>(''); // For R/I/R/R technicians
  const [page, setPage] = useState(1);

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
    fetchCustomers(page);
  }, [searchParams]);

  const fetchTechnicians = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types');
      const response = await fetch(`/api/fetchJobCustomerTechnician?endpoint=fetchTechnicianJob&types=${roleType}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      // Ensure we only get technicians (both regular and R/I/R/R)
      const allTechs = data.technician?.technicians || [];
      setTechnicians(allTechs.filter((tech: any) =>
        tech.techType === "technician" || tech.techType === "R/I/R/R"
      ));
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const fetchCustomers = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');

      const response = await fetch(`/api/fetchJobCustomerTechnician?endpoint=fetchCustomer&userId=${userId}&roleType=${roleType}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCustomer((prevCustomers) => [...prevCustomers, ...data.customers?.customers || []]);

    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCustomerScroll = (e: any) => {
    console.log(e, 'eeeeeeeeeee');

    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom) {
      setPage((prevPage) => {
        const newPage = prevPage + 1;
        fetchCustomers(newPage);
        return newPage;
      });
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
        const technicians = jobData.technicians || [];

        // Separate normal techs and R/I/R/R techs
        const normalTechs = technicians.filter((tech: any) => tech.techType === "technician");
        const rirrTechs = technicians.filter((tech: any) => tech.techType === "R/I/R/R");

        // Set selected technicians
        setSelectedNormalTechnicians(normalTechs);
        setSelectedRrTechnicians(rirrTechs);

        // Extract rates
        if (normalTechs.length > 0 && normalTechs[0].UserJob) {
          setSimpleFlatRate(normalTechs[0].UserJob.techFlatRate || "");
        }
        if (rirrTechs.length > 0 && rirrTechs[0].UserJob) {
          setRirValue(rirrTechs[0].UserJob.rRate || "");
        }

        const startDateValue = jobData.startDate ? dayjs(jobData.startDate) : null;
        const endDateValue = jobData.endDate ? dayjs(jobData.endDate) : null;

        setFormData({
          ...formData,
          assignCustomer: String(jobData.customer?.id || jobData.assignCustomer || ''),
          jobName: jobData.jobName || '',
          assignManager: jobData.assignManager || '',
          labourCost: jobData.labourCost || '',
          estimatedCost: jobData.estimatedCost || '',
          notes: jobData.notes || '',
          techFlatRate: normalTechs[0]?.UserJob?.techFlatRate || '',
          rRate: rirrTechs[0]?.UserJob?.rRate || '',
          assignTechnicians: technicians.map((tech: any) => String(tech.id)),
          technicianId: technicians.map((tech: any) => String(tech.id)),
          createdBy: jobData.createdBy || 'admin',
        });

        setJobId(jobData.id);
        setStartDate(startDateValue);
        setEndDate(endDateValue);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
      toast.error('An error occurred while fetching job data');
    }
  };





  const handleTechnicianChange = (techId: string, techType: string) => {
    const tech = technicians.find(t => String(t.id) === String(techId));
    if (!tech) return;

    if (techType === "technician") {
      setSelectedNormalTechnicians(prev =>
        prev.some(t => String(t.id) === String(techId))
          ? prev.filter(t => String(t.id) !== String(techId))
          : [...prev, tech]
      );
    } else if (techType === "R/I/R/R") {
      setSelectedRrTechnicians(prev =>
        prev.some(t => String(t.id) === String(techId))
          ? prev.filter(t => String(t.id) !== String(techId))
          : [...prev, tech]
      );
    }
  };





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.jobName?.trim()) newErrors.jobName = 'Job Title is required';
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      let estimatedByName = '';
      let labourCost = null;
      let estimatedCost = null;
      let techFlatRate = null;
      let rRate = null;
      let assignTechnician = null;
      if (technicianData) {
        try {
          const parsed = JSON.parse(technicianData);
          estimatedByName = `${parsed.firstName} ${parsed.lastName}`;
          labourCost = parsed.labourCost;
          estimatedCost = parsed.estimatedCost;
          techFlatRate = parsed.techFlatRate;
          rRate = parsed.rRate;
          assignTechnician = [parsed.id];
        } catch (err) {
          console.error('Failed to parse technicianData:', err);
        }
      }
      const currentUserId = localStorage.getItem('userID') || '';
      const selectedTechnicians: SelectedTechnician[] = roleType === 'single-technician'
        ? [{
          userId: currentUserId || '',
          
        }]
        : [
          ...selectedNormalTechnicians.map(tech => ({
            userId: tech.id, // For other technicians, use their ids
            techFlatRate: simpleFlatRate,
          })),
          ...selectedRrTechnicians.map(tech => ({
            userId: tech.id, // For R/I/R/R technicians, use their ids
            rRate: rirValue,
          }))
        ];

      console.log(currentUserId, 'currentUserId');
      console.log(selectedTechnicians, 'selectedTechnicians');



      console.log(currentUserId, 'currentUserId');
      console.log(selectedTechnicians, 'selectedTechnicians');
      // Prepare the request body
      const requestBody = {
        jobName: formData.jobName,
        assignCustomer: formData.assignCustomer,
        assignTechnician: roleType === 'single-technician' ? assignTechnician : formData.technicianId,
        assignManager: roleType === 'single-technician' ? null : formData.assignManager,
        createdBy: formData.createdBy,
        notes: formData.notes,
        roleType: roleType,
        estimatedBy: estimatedByName,
        labourCost: labourCost ?? formData.labourCost,
        estimatedCost: estimatedCost ?? formData.estimatedCost,
        selectedTechnicians,
        jobId: jobId || undefined,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      };
      // const response = await fetch(`${isEdit ? `${apiUrl}/updateJob` : `${apiUrl}/technicianCreateJob`}`, {


      const endpoint = isEdit ? `${apiUrl}/updateJob` : `${apiUrl}/technicianCreateJob`;
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

  const handleAssignManagerChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, assignManager: value }));
    if (value) {
      setErrors(prev => ({ ...prev, assignManager: '' }));
    }
  };

  const handleManagercroll = (e: any) => {
    console.log(e, 'eeeeeeeeeee');

    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom) {
      setPage((prevPage) => {
        const newPage = prevPage + 1;
        fetchManager(newPage);
        return newPage;
      });
    }
  };

  const fetchManager = async (page = 1, query = '', limit = pageSize) => {

    try {
      const token = localStorage.getItem('token');
      const roleType = 'manager';
      if (!token) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/manager?page=${page}&limit=${limit}&roleType=${encodeURIComponent(roleType)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.status == 400) {
        localStorage.removeItem('token');
        router.push('/');
      }
      const data = await response.json();
      if (response.ok) {
        setManager((prevCustomers) => [...prevCustomers, ...data.data?.managers || []]);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('Error fetching technicians:',);
      }
    }
    catch (error) {
      // router.push('/');
      console.error('Error fetching technicians:', error);
    } finally {
    }
  };

  // Unified useEffect to handle both search and pagination
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchManager(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

  const regularTechnicians = technicians
    .filter(tech => tech.techType === "technician")
    .filter(tech =>
      `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const rirrTechnicians = technicians
    .filter(tech => tech.techType === "R/I/R/R")
    .filter(tech =>
      `${tech.firstName} ${tech.lastName}`.toLowerCase().includes(searchTechTerm.toLowerCase())
    );

  return (
    <div className='w-[60%] m-auto mb-5 max-md:w-full'>
      <Breadcrumb
        items={[
          isEdit
            ? { label: 'Edit Job' }
            : { label: 'Create New Job', href: '/jobs/create-job/create' },
        ]}
      />
      <h1 className="text-lg leading-6 font-bold text-gray-900 mb-[2px] sm:mb-0">
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

                  MenuProps={{
                    PaperProps: {
                      onScroll: handleCustomerScroll,
                      style: {
                        maxHeight: 200, // Adjust the height of the dropdown menu if needed
                      }
                    }
                  }}
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
                label="Enter Job Title *"
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
          <div className={`grid ${userType === 'single-technician' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-2`}>
            {userType !== 'single-technician' && (
              <div className='mb-2 items-start gap-3 relative'>
                <FormControl fullWidth size="small">
                  <InputLabel id="assignManager" color="warning">Select manager</InputLabel>
                  <Select
                    labelId="assignManager"
                    id="select-assignManager"
                    color="warning"
                    value={formData.assignManager}
                    label="Select customer"
                    name="assignManager"
                    onChange={handleAssignManagerChange}
                    MenuProps={{
                      PaperProps: {
                        onScroll: handleManagercroll,
                        style: {
                          maxHeight: 100, // Adjust the height of the dropdown menu if needed
                        }
                      }
                    }}
                  >
                    {manager?.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager?.firstName}
                        {manager?.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}

            <div className="mb-4">
              <TextField
                fullWidth
                type="number"
                label="Job Estimate ($)"
                size="small"
                color="warning"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                inputProps={{
                  inputMode: 'decimal',
                  maxLength: 8,
                }}
              />
            </div>
          </div>
          {userType !== 'single-technician' && (
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="mb-4">
              <TextField
                fullWidth
                type="number"
                label="Technician Flat Rate ($)"
                size="small"
                color="warning"
                value={simpleFlatRate}
                onChange={(e) => setSimpleFlatRate(e.target.value)}
                inputProps={{
                  inputMode: 'decimal',
                  maxLength: 8,
                }}
              />

            </div>
            <div className="mb-4">
              <TextField
                fullWidth
                type="number"
                label="R/I/R/R Flat Rate ($)"
                size="small"
                color="warning"
                value={rirValue}
                onChange={(e) => setRirValue(e.target.value)}
                inputProps={{
                  inputMode: 'decimal',
                  maxLength: 8,
                }}
              />
            </div>
          </div>
          )}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Start Date"
                value={startDate}
                readOnly
                onChange={(newValue) => {
                  setStartDate(newValue);
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    color: 'warning',

                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                }}
                minDate={startDate || undefined}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    color: 'warning',
                  },
                }}
              />
            </div>
          </LocalizationProvider>

           <div className="grid grid-cols-1 gap-4 mt-4"> 
                <div className='mb-4'> 
                  <textarea
                    name="notes"
                    id="notes"
                    placeholder='Notes'
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-md resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />  
                </div>
              </div>


          {userType !== 'single-technician' && (
            <div className='mb-4 flex items-start relative mt-3'>
              <FormControl fullWidth size="small">
                <FormLabel color="warning" className='mb-4'>Assign Dent Tech to this vehicle</FormLabel>
                <TextField
                  label="Search Dent Tech"
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
                    {regularTechnicians.length > 0 ? (
                      <div className='grid grid-cols-3'>
                        {regularTechnicians.map((tech) => {
                          const value = String(tech.id);
                          return (
                            <ListItem
                              key={value}
                              component="div"
                              onClick={() => handleTechnicianChange(tech.id, "technician")}
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
                                checked={selectedNormalTechnicians.some(t => String(t.id) === String(tech.id))}

                                tabIndex={-1}
                                disableRipple
                              />
                              <ListItemText primary={`${tech.firstName} ${tech.lastName}`} />
                            </ListItem>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No Dent Tech available
                      </div>
                    )}
                  </List>
                </Paper>
              </FormControl>
            </div>
          )}

          {userType !== 'single-technician' && (
            <div className='mb-4 flex items-start gap-3 relative mt-3'>
              <FormControl fullWidth size="small">
                <FormLabel color="warning" className='mb-4'>Assign R/IR/R to this vehicle</FormLabel>
                <TextField
                  label="Search Dent Tech"
                  variant="outlined"
                  fullWidth
                  color="warning"
                  size="small"
                  type='search'
                  value={searchTechTerm}
                  onChange={(e) => setTechSearchTerm(e.target.value)}
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
                    {rirrTechnicians.length > 0 ? (
                      <div className='grid grid-cols-3'>
                        {rirrTechnicians.map((tech) => {
                          const value = String(tech.id);
                          return (
                            <ListItem
                              key={value}
                              component="div"
                              onClick={() => handleTechnicianChange(tech.id, "R/I/R/R")}
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
                                checked={selectedRrTechnicians.some(t => String(t.id) === String(tech.id))}
                                tabIndex={-1}
                                disableRipple
                              />
                              <ListItemText primary={`${tech.firstName} ${tech.lastName} (R/I/R/R)`} />
                            </ListItem>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No R/IR/R Dent Tech Available
                      </div>
                    )}
                  </List>
                </Paper>
              </FormControl>
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