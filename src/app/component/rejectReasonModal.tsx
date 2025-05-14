// components/common/RejectReasonModal.tsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicianId: string | null;
  apiUrl: string; 
  onSuccess: () => void;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  technicianId,
  apiUrl, 
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    console.log(technicianId,'technicianId')
    if (!technicianId || !reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    const token = localStorage.getItem('token');

    setError('');

    try {
      const response = await fetch(`${apiUrl}/technicianRejectedAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          technicianId:Number(technicianId),
          reason,
          isApproved: 'cancel',
        }),
      });

      if (response.ok) {
        toast.success('Technician rejected with reason.');
        setReason('');
        onClose();
        onSuccess();
      } else {
        console.error('Failed to reject technician');
        toast.error('Failed to reject technician.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-center items-center">
      <div className="bg-white rounded p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Rejection Reason</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full h-24 border border-gray-300 p-2 rounded"
          placeholder="Enter reason..."
        ></textarea>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={() => {
              setReason('');
              setError('');
              onClose();
            }}
            className="px-4 py-2 text-sm text-black bg-gray-300 rounded hover:bg-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="primary-bg text-sm border border-black-500 p-3 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;
