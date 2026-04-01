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
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel
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
  techPercentage?: string;
  rPercentage?: string;
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
  notes: string;
  assignManager: string;
  createdBy: string;
  jobId?: string;
  startDate?: string;
  endDate?: string;
  role: string;

  // new fields
  jobType: 'flatRate' | 'insurancePercentage';
  suvPrice: string;
  sedanPrice: string;
  truckPrice: string;
  chassisTruckPrice: string;
  other: string;
  insurancePercentage: string;
  pricePerVehicle: string;
  insuranceFile: File | null;
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

    // new default values
    jobType: 'flatRate',
    suvPrice: '',
    sedanPrice: '',
    truckPrice: '',
    chassisTruckPrice: '',
    other: '',
    insurancePercentage: '',
    pricePerVehicle: '',
    insuranceFile: null,
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
  const [normalTechPercentages, setNormalTechPercentages] = useState<Record<string, number>>({});
  const [rrTechPercentages, setRrTechPercentages] = useState<Record<string, number>>({});
  const [simpleFlatRate, setSimpleFlatRate] = useState<string>('');
  const [rirValue, setRirValue] = useState<string>('');
  const [page, setPage] = useState(1);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [managerSearchTerm, setManagerSearchTerm] = useState<string>('');
  const [isManagerSearching, setIsManagerSearching] = useState<boolean>(false);
  const [existingInsuranceFile, setExistingInsuranceFile] = useState<string>('');

  useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);

    if (type === 'manager') {
      const managerId = localStorage.getItem('userID');
      if (managerId) {
        setFormData(prev => ({
          ...prev,
          assignManager: managerId
        }));
      }
    }

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
    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && !isSearching) {
      setPage((prevPage) => {
        const newPage = prevPage + 1;
        fetchCustomers(newPage);
        return newPage;
      });
    }
  };

  const searchCustomers = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setIsSearching(false);
      setCustomer([]);
      setPage(1);
      fetchCustomers(1);
      return;
    }

    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/searchCustomers?userId=${userId}&searchQuery=${encodeURIComponent(searchValue)}&roleType=${roleType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      if (data.status && data.customers) {
        setCustomer(data.customers);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    searchCustomers(value);
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
        const vehicleTypePricing = Array.isArray(jobData.vehicleTypePricing) ? jobData.vehicleTypePricing : [];
        const getVehicleAmount = (type: string) =>
          String(
            vehicleTypePricing.find(
              (item: any) => String(item?.vehicleType || '').toLowerCase() === type.toLowerCase()
            )?.amount ?? ''
          );
        const normalizedJobType =
          jobData.jobType === 'insurance_percentage'
            ? 'insurancePercentage'
            : jobData.jobType === 'flat_rate'
              ? 'flatRate'
              : (jobData.jobType || 'flatRate');

        const normalTechs = technicians.filter((tech: any) => tech.techType === "technician");
        const rirrTechs = technicians.filter((tech: any) => tech.techType === "R/I/R/R");

        setSelectedNormalTechnicians(normalTechs);
        setSelectedRrTechnicians(rirrTechs);

        if (normalTechs.length > 0 && normalTechs[0].UserJob) {
          setSimpleFlatRate(normalTechs[0].UserJob.techFlatRate || "");
        }
        if (rirrTechs.length > 0 && rirrTechs[0].UserJob) {
          setRirValue(rirrTechs[0].UserJob.rRate || "");
        }

        const startDateValue = jobData.startDate ? dayjs(jobData.startDate) : null;
        const endDateValue = jobData.endDate ? dayjs(jobData.endDate) : null;

        const roleType = localStorage.getItem('types');
        const managerId = roleType === 'manager'
          ? localStorage.getItem('userID') || ''
          : jobData.assignManager || '';

        setFormData((prev) => ({
          ...prev,
          assignCustomer: String(jobData.customer?.id || jobData.assignCustomer || ''),
          jobName: jobData.jobName || '',
          assignManager: managerId,
          labourCost: jobData.labourCost || '',
          estimatedCost: jobData.estimatedCost || '',
          notes: jobData.notes || '',
          techFlatRate: normalTechs[0]?.UserJob?.techFlatRate || '',
          rRate: rirrTechs[0]?.UserJob?.rRate || '',
          assignTechnicians: technicians.map((tech: any) => String(tech.id)),
          technicianId: technicians.map((tech: any) => String(tech.id)),
          createdBy: jobData.createdBy || 'admin',

          // edit values
          jobType: normalizedJobType,
          suvPrice: getVehicleAmount('SUV') || jobData.suvPrice || '',
          sedanPrice: getVehicleAmount('Sedan') || jobData.sedanPrice || '',
          truckPrice: getVehicleAmount('Truck') || jobData.truckPrice || '',
          chassisTruckPrice: getVehicleAmount('Chassis Truck') || jobData.chassisTruckPrice || '',
          other: getVehicleAmount('Other') || jobData.other || '',
          insurancePercentage: jobData.insurancePercentage || '',
          pricePerVehicle: jobData.pricePerVehicle || '',
        }));
        setExistingInsuranceFile(jobData.insuranceFile || '');

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

  const handleJobTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as 'flatRate' | 'insurancePercentage';
    setFormData((prev) => ({
      ...prev,
      jobType: value,
    }));
  };

  const handleInsuranceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      insuranceFile: file,
    }));
  };

  const getSplitAmount = (total: string, count: number) => {
    const amount = Number(total);
    if (!Number.isFinite(amount) || count <= 0) return '';
    return (amount / count).toFixed(2);
  };

  const distributeEvenPercentages = (ids: string[]) => {
    if (ids.length === 0) return {} as Record<string, number>;
    const even = Number((100 / ids.length).toFixed(2));
    const map: Record<string, number> = {};
    ids.forEach((id) => { map[id] = even; });
    const sum = ids.reduce((acc, id) => acc + (map[id] || 0), 0);
    const diff = Number((100 - sum).toFixed(2));
    map[ids[0]] = Number((map[ids[0]] + diff).toFixed(2));
    return map;
  };

  const rebalancePercentages = (
    ids: string[],
    editedId: string,
    editedValue: number
  ) => {
    if (ids.length === 0) return {} as Record<string, number>;
    if (ids.length === 1) return { [ids[0]]: 100 };

    const clampedEdited = Math.min(100, Math.max(0, Number.isFinite(editedValue) ? editedValue : 0));
    const others = ids.filter((id) => id !== editedId);
    const remaining = Number((100 - clampedEdited).toFixed(2));
    const evenOther = Number((remaining / others.length).toFixed(2));
    const next: Record<string, number> = { [editedId]: Number(clampedEdited.toFixed(2)) };
    others.forEach((id) => { next[id] = evenOther; });

    const sum = ids.reduce((acc, id) => acc + (next[id] || 0), 0);
    const diff = Number((100 - sum).toFixed(2));
    if (others.length > 0) {
      const firstOther = others[0];
      next[firstOther] = Number(((next[firstOther] || 0) + diff).toFixed(2));
    } 
    console.log('next', next);
    return next;
  };

  const handleNormalPercentageChange = (techId: string, rawValue: string) => {
    const selectedIds = selectedNormalTechnicians.map((t: any) => String(t.id));
    const parsed = parseFloat(rawValue);
    setNormalTechPercentages(rebalancePercentages(selectedIds, String(techId), parsed));
  };

  const handleRrPercentageChange = (techId: string, rawValue: string) => {
    const selectedIds = selectedRrTechnicians.map((t: any) => String(t.id));
    const parsed = parseFloat(rawValue);
    setRrTechPercentages(rebalancePercentages(selectedIds, String(techId), parsed));
  };

  useEffect(() => {
    const selectedIds = selectedNormalTechnicians.map((t: any) => String(t.id));
    setNormalTechPercentages(distributeEvenPercentages(selectedIds));
  }, [selectedNormalTechnicians]);

  useEffect(() => {
    const selectedIds = selectedRrTechnicians.map((t: any) => String(t.id));
    setRrTechPercentages(distributeEvenPercentages(selectedIds));
  }, [selectedRrTechnicians]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.jobName?.trim()) newErrors.jobName = 'Job Title is required';
    if (!formData.assignCustomer) newErrors.assignCustomer = 'Customer is required';

    if (formData.jobType === 'insurancePercentage' && !formData.insurancePercentage?.trim()) {
      newErrors.insurancePercentage = 'Percentage is required';
    }

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
        ? [{ userId: currentUserId || '' }]
        : [
          ...selectedNormalTechnicians.map(tech => ({
            userId: tech.id,
            techPercentage: Number(normalTechPercentages[String(tech.id)] || 0).toFixed(2),
            techFlatRate: simpleFlatRate || '0',
          })),
          ...selectedRrTechnicians.map(tech => ({
            userId: tech.id,
            rPercentage: Number(rrTechPercentages[String(tech.id)] || 0).toFixed(2),
            rRate: rirValue || '0',
          }))
        ];

      const selectedTechnicianIds =
        roleType === 'single-technician'
          ? (assignTechnician || [])
          : Array.from(
            new Set([
              ...selectedNormalTechnicians.map((tech: any) => String(tech.id)),
              ...selectedRrTechnicians.map((tech: any) => String(tech.id)),
              ...(formData.technicianId || []).map((id: any) => String(id)),
            ])
          ).filter(Boolean);

      const managerId = roleType === 'manager'
        ? localStorage.getItem('userID')
        : roleType === 'single-technician'
          ? null
          : formData.assignManager;

      const requestBody = {
        jobName: formData.jobName,
        assignCustomer: formData.assignCustomer,
        assignTechnician: selectedTechnicianIds,
        assignManager: managerId,
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

        // new fields
        jobType: formData.jobType === 'flatRate' ? 'flat_rate' : 'insurance_percentage',
        ...(formData.jobType !== 'insurancePercentage' && {
          other: formData.other || '',
          vehicleTypePricing: [
            { vehicleType: 'SUV', amount: formData.suvPrice || '' },
            { vehicleType: 'Sedan', amount: formData.sedanPrice || '' },
            { vehicleType: 'Truck', amount: formData.truckPrice || '' },
            { vehicleType: 'Chassis Truck', amount: formData.chassisTruckPrice || '' },
            { vehicleType: 'Other', amount: formData.other || '' },
          ],
        }),
        ...(formData.jobType === 'insurancePercentage' && {
          insurancePercentage: formData.insurancePercentage,
        }),
        ...(formData.jobType !== 'insurancePercentage' && {
          pricePerVehicle: formData.pricePerVehicle,
        }),
      };
      console.log(requestBody, 'requestBody');
      const endpoint = isEdit ? `${apiUrl}/updateJob` : `${apiUrl}/technicianCreateJob`;

      // if file upload needed
      if (formData.insuranceFile) {
        const multipartData = new FormData();
        Object.entries(requestBody).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof File))) {
            multipartData.append(key, JSON.stringify(value));
            return;
          }
          multipartData.append(key, String(value));
        });
        multipartData.append('insuranceFile', formData.insuranceFile);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: multipartData,
        });

        const result = await response.json();
        if (response.ok) {
          toast.success(isEdit ? 'Job updated successfully' : 'Job created successfully');
          if (searchParams!.has('completeOrder')) {
            router.push('/jobs/complete-job/listing');
          } else if (searchParams!.has('vehicleInfo')) {
            router.push('/reporting/vehicle-info');
          } else if (searchParams!.has('groupjob')) {
            router.push('/jobs/job-group/listing');
          } else {
            router.push('/jobs/active-job');
          }
        } else {
          toast.error(result.message || result.error || 'Error saving job');
        }

        return;
      }

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
          router.push('/reporting/vehicle-info');
        } else if (searchParams!.has('groupjob')) {
          router.push('/jobs/job-group/listing');
        } else {
          router.push('/jobs/active-job');
        }
      } else {
        toast.error(result.message || result.error || 'Error saving job');
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
    const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
    if (bottom && !isManagerSearching) {
      setPage((prevPage) => {
        const newPage = prevPage + 1;
        fetchManager(newPage);
        return newPage;
      });
    }
  };

  const searchManagers = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setIsManagerSearching(false);
      setManager([]);
      setPage(1);
      fetchManager(1);
      return;
    }

    try {
      setIsManagerSearching(true);
      const token = localStorage.getItem('token');
      const roleType = 'manager';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/searchTechnicians?searchQuery=${encodeURIComponent(searchValue)}&roleType=${encodeURIComponent(roleType)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      if (data.status && data.technicians) {
        setManager(data.technicians);
      }
    } catch (error) {
      console.error('Error searching managers:', error);
    }
  };

  const handleManagerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManagerSearchTerm(value);
    searchManagers(value);
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
        console.error('Error fetching technicians:');
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

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
                      style: { maxHeight: 300 }
                    },
                    autoFocus: false
                  }}
                  onOpen={() => {
                    setCustomerSearchTerm('');
                    if (customer.length === 0) {
                      fetchCustomers(1);
                    }
                  }}
                >
                  <div
                    style={{ padding: '8px 16px', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      color="warning"
                      placeholder="Search customer..."
                      value={customerSearchTerm}
                      onChange={handleCustomerSearchChange}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  {customer.length > 0 ? (
                    customer.map((cust) => (
                      <MenuItem key={cust.id + Math.random().toString(36).substr(2, 5)} value={cust.id}>
                        {cust.fullName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <span className="text-gray-500 text-sm">No customer found</span>
                    </MenuItem>
                  )}
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

          <div className={`grid ${userType === 'single-technician' || userType === 'manager' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-2`}>
            {userType !== 'single-technician' && userType !== 'manager' && (
              <div className='mb-2 items-start gap-3 relative'>
                <FormControl fullWidth size="small">
                  <InputLabel id="assignManager" color="warning">Select manager</InputLabel>
                  <Select
                    labelId="assignManager"
                    id="select-assignManager"
                    color="warning"
                    value={formData.assignManager}
                    label="Select manager"
                    name="assignManager"
                    onChange={handleAssignManagerChange}
                    MenuProps={{
                      PaperProps: {
                        onScroll: handleManagercroll,
                        style: { maxHeight: 300 }
                      },
                      autoFocus: false
                    }}
                    onOpen={() => {
                      setManagerSearchTerm('');
                      if (manager.length === 0) {
                        fetchManager(1);
                      }
                    }}
                  >
                    <div
                      style={{ padding: '8px 16px', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <TextField
                        size="small"
                        fullWidth
                        color="warning"
                        placeholder="Search manager..."
                        value={managerSearchTerm}
                        onChange={handleManagerSearchChange}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    {manager?.length > 0 ? (
                      manager.map((mgr) => (
                        <MenuItem key={mgr.id + Math.random().toString(36).substr(2, 5)} value={mgr.id}>
                          {mgr?.firstName} {mgr?.lastName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <span className="text-gray-500 text-sm">No manager found</span>
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </div>
            )}

            {/* <div className="mb-4">
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
            </div> */}
           
          </div>

          {/* NEW SECTION START */}
          <div className="mb-4">
            <FormControl component="fieldset">
              <FormLabel color="warning" className="mb-2">Job Type</FormLabel>
              <RadioGroup
                value={formData.jobType}
                onChange={handleJobTypeChange}
              >
                <FormControlLabel
                  value="flatRate"
                  control={<Radio color="warning" />}
                  label="Flat rate"
                />
                <FormControlLabel
                  value="insurancePercentage"
                  control={<Radio color="warning" />}
                  label="Insurance percentage"
                />
              </RadioGroup>
            </FormControl>
          </div>

          {formData.jobType === 'flatRate' && (
            <Accordion defaultExpanded className="mb-4">
              <AccordionSummary expandIcon={<svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>}>
                <span className="font-medium">Vehicle Type Pricing</span>
              </AccordionSummary>
              <AccordionDetails>
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    fullWidth
                    type="number"
                    label="SUV's"
                    size="small"
                    color="warning"
                    value={formData.suvPrice}
                    onChange={(e) => setFormData({ ...formData, suvPrice: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Sedans"
                    size="small"
                    color="warning"
                    value={formData.sedanPrice}
                    onChange={(e) => setFormData({ ...formData, sedanPrice: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Trucks (Pick up trucks)"
                    size="small"
                    color="warning"
                    value={formData.truckPrice}
                    onChange={(e) => setFormData({ ...formData, truckPrice: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Chassis trucks (Cab only trucks)"
                    size="small"
                    color="warning"
                    value={formData.chassisTruckPrice}
                    onChange={(e) => setFormData({ ...formData, chassisTruckPrice: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                    <TextField
                    fullWidth
                    type="number"
                    label="Other Vehicles"
                    size="small"
                    color="warning"
                    value={formData.other}
                    onChange={(e) => setFormData({ ...formData, other: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </div>
              </AccordionDetails>
            </Accordion>
          )}

          {formData.jobType === 'insurancePercentage' && (
            <div className="grid grid-cols-1 gap-4 mb-4">
              <TextField
                fullWidth
                type="number"
                label="Percentage (%) *"
                size="small"
                color="warning"
                value={formData.insurancePercentage}
                onChange={(e) => setFormData({ ...formData, insurancePercentage: e.target.value })}
              />
              {errors.insurancePercentage && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '-10px' }}>
                  {errors.insurancePercentage}
                </div>
              )}

              <div>
                <FormLabel color="warning" className="mb-2 block">
                  Upload Insurance File
                </FormLabel>

                <label className="w-full cursor-pointer block">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleInsuranceFileChange}
                    className="hidden"
                  />

                  <div className="w-full rounded-full border border-gray-300 py-3 text-center text-gray-500 bg-white shadow-sm hover:shadow-md transition">
                    {formData.insuranceFile ? formData.insuranceFile.name : "Choose file"}
                  </div>
                </label>

                {existingInsuranceFile && !formData.insuranceFile && (
                  <div className="mt-2 text-xs text-gray-600">
                    Current file:{' '}
                    <a
                      href={existingInsuranceFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      {existingInsuranceFile}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}



          {userType !== 'single-technician' && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="mb-4">
                <TextField
                  fullWidth
                  type="number"
                  label="Dent Tech Flat Rate ($)"
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
                  label="RR/I/R Flat Rate ($)"
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
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                          const isSelected = selectedNormalTechnicians.some(t => String(t.id) === String(tech.id));
                          const percentage = isSelected ? (normalTechPercentages[String(tech.id)] ?? 0) : 0;
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
                                checked={isSelected}
                                tabIndex={-1}
                                disableRipple
                              />
                              <ListItemText primary={`${tech.firstName} ${tech.lastName}`} />
                              {isSelected && (
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Per Tech %"
                                  value={Number.isFinite(percentage) ? percentage : ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleNormalPercentageChange(String(tech.id), e.target.value);
                                  }}
                                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                                  sx={{ width: 110 }}
                                />
                              )}
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
                <FormLabel color="warning" className='mb-4'>Assign RR/I/R to this vehicle</FormLabel>
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
                          const isSelected = selectedRrTechnicians.some(t => String(t.id) === String(tech.id));
                          const percentage = isSelected ? (rrTechPercentages[String(tech.id)] ?? 0) : 0;
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
                                checked={isSelected}
                                tabIndex={-1}
                                disableRipple
                              />
                              <ListItemText primary={`${tech.firstName} ${tech.lastName} (RR/I/R)`} />
                              {isSelected && (
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Per Tech %"
                                  value={Number.isFinite(percentage) ? percentage : ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleRrPercentageChange(String(tech.id), e.target.value);
                                  }}
                                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                                  sx={{ width: 110 }}
                                />
                              )}
                            </ListItem>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No RR/I/R Dent Tech Available
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