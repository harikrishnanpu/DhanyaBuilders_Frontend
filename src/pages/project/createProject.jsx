// src/screens/CreateProjectScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuth from 'hooks/useAuth';

export default function CreateProjectScreen() {
  const navigate = useNavigate();

  // State variables for project details
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [supervisors, setSupervisors] = useState([]);

  // List of supervisors to assign
  const [supervisorsList, setSupervisorsList] = useState([]);

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Refs for input navigation
  const nameRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();
  const customerPhoneRef = useRef();
  const estimatedAmountRef = useRef();
  const startDateRef = useRef();
  const estimatedEndDateRef = useRef();

  // Get user info from Redux store
  const { user: userInfo } = useAuth();

  // Fetch supervisors on mount
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const { data } = await api.get('/api/users/allUsers/all');
        setSupervisorsList(data);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      }
    };
    fetchSupervisors();
  }, [userInfo]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!name || !customerName || !customerAddress || !customerPhone || !estimatedAmount || !startDate || !estimatedEndDate) {
      setError('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const projectData = {
      name,
      customerName,
      customerAddress,
      customerPhone,
      estimatedAmount,
      startDate,
      estimatedEndDate,
      supervisors,
    };

    try {
      const response = await api.post('/api/projects/create', projectData);
      console.log('Project created:', response.data);
      alert('Project created successfully!');
      navigate('/project/all'); // Redirect to projects list page
    } catch (error) {
      console.error('Error creating project:', error);
      setError('There was an error creating the project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard navigation between fields
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  return (
    <div className="container mx-auto p-2">
      {/* Top Banner */}

      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-4">
        <h2 className="text-md text-gray-500 font-bold mb-4">
          Create New Project
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Project Name */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Project Name</label>
            <input
              type="text"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, customerNameRef)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter Project Name"
            />
          </div>

          {/* Customer Name */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Customer Name</label>
            <input
              type="text"
              ref={customerNameRef}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, customerAddressRef)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter Customer Name"
            />
          </div>

          {/* Customer Address */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Customer Address</label>
            <textarea
              ref={customerAddressRef}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, customerPhoneRef)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter Customer Address"
            />
          </div>

          {/* Customer Phone */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Customer Phone</label>
            <input
              type="text"
              ref={customerPhoneRef}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, estimatedAmountRef)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter Customer Phone Number"
            />
          </div>

          {/* Estimated Amount */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Estimated Amount</label>
            <input
              type="number"
              ref={estimatedAmountRef}
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, startDateRef)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
              placeholder="Enter Estimated Amount"
            />
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Start Date</label>
            <input
              type="date"
              ref={startDateRef}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, estimatedEndDateRef)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Estimated End Date */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Estimated End Date</label>
            <input
              type="date"
              ref={estimatedEndDateRef}
              value={estimatedEndDate}
              onChange={(e) => setEstimatedEndDate(e.target.value)}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Assign Supervisors */}
          <div className="mb-4">
            <label className="block text-xs text-gray-700">Assign Supervisors</label>
            <select
              value={supervisors}
              onChange={(e) => setSupervisors([...e.target.selectedOptions].map(option => option.value))}
              className="w-full border-gray-300 px-4 py-2 border rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none"
            >
              {supervisorsList.map((supervisor) => (
                <option key={supervisor._id} value={supervisor._id}>
                  {supervisor.name} ({supervisor.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">select supervisor</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4">
              <p className="text-red-500 text-xs">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'}`}
          >
            {isSubmitting ? 'Submitting...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}
