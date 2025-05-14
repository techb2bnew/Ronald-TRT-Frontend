// components/TechnicianApprovalActions.tsx
import { useState } from 'react';
import Swal from 'sweetalert2';

interface TechnicianApprovalActionsProps {
    technician: any;
    onRejectClick: (id: number) => void;
    fetchTechnicians: () => void;
    apiUrl: string;
    token: string | null;
}

const TechnicianApprovalActions: React.FC<TechnicianApprovalActionsProps> = ({
    technician,
    onRejectClick,
    fetchTechnicians,
    apiUrl,
    token,
}) => {
    const [loading, setLoading] = useState(false);

    const handleAccountStatusChange = async (accountStatus: boolean) => {
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/updateTechnicianAccountStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    technicianId: technician.id,
                    accountStatus: accountStatus,
                }),
            });

            if (!response.ok) throw new Error('Account status update failed');
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Error updating account status', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalChange = async (status: string) => {
        try {
            const res = await fetch(`${apiUrl}/technicianActiveUnactiveAccount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    technicianId: technician.id,
                    isApproved: status,
                }),
            });


            if (res.status) {
                await Swal.fire({
                    title: 'Success!',
                    text: `Account status changed to ${status}.`,
                    icon: 'success',
                    confirmButtonColor: '#383d71',
                });
                fetchTechnicians();
            } else {
                //   throw new Error(res.data.message || 'Account status update failed');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Error updating approval status', 'error');
        }
    };

    const handleChangeBothStatuses = async () => {
        if (!technician.payRate || technician.payRate === "") {
            await Swal.fire({
                title: 'Missing Payment Info',
                text: 'Please enter payrate for this technician.',
                icon: 'info',
                confirmButtonColor: '#383d71',
                confirmButtonText: 'OK',
            });
            return;
        }

        const newApprovalStatus = technician.isApproved === 'accept' ? 'cancel' : 'accept';
        const newAccountStatus = newApprovalStatus === 'accept'; // true for active, false for inactive
        const statusText = newApprovalStatus.toLowerCase() === 'cancel' ? 'Reject' : newApprovalStatus.charAt(0).toUpperCase() + newApprovalStatus.slice(1);


        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to change this account status to ${statusText}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#383d71',
            cancelButtonColor: 'black',
            confirmButtonText: `Yes, ${statusText}`,
        });

        if (!result.isConfirmed) return;

        await handleAccountStatusChange(newAccountStatus);
        await handleApprovalChange(newApprovalStatus);
        fetchTechnicians();
    };

    return (
        <div className="flex gap-4 items-center">
            {technician.isApproved === 'accept' ? (
                <span
                    onClick={handleChangeBothStatuses}
                    className="badge bg-[#E6F9DD] text-[#1A932E] p-2 px-3 rounded shadow block text-center w-[100px] cursor-pointer"
                >
                    Accepted
                </span>
            ) : technician.isApproved === 'cancel' ? (
                <span
                    onClick={handleChangeBothStatuses}
                    className="badge bg-[#FFE4E1] text-[#FF0000] p-2 px-3 rounded shadow block text-center w-[100px] cursor-pointer"
                >
                    Rejected
                </span>
            ) : (
                <>
                    <span
                        onClick={handleChangeBothStatuses}
                        className="badge bg-[#E6F9DD] text-[#1A932E] p-2 px-3 rounded shadow block text-center w-[100px] cursor-pointer"
                    >
                        Accept
                    </span>
                    <button
                        onClick={() => onRejectClick(technician.id)}
                        className="badge text-sm p-2 px-3 shadow badge-error bg-[#FFE4E1] text-[#FF0000] w-[100px]"
                    >
                        Reject
                    </button>
                </>
            )}
        </div>
    );
};

export default TechnicianApprovalActions;
