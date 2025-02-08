// src/pages/AllProjectsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AllProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all projects from the API
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects/');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto p-4">
      {/* Page Header */}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <div
            key={project._id}
            className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition duration-300"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {project.name}
            </h2>
            <p className="text-gray-600 mb-1">
              Customer: {project.customerName}
            </p>
            <p className="text-gray-600 mb-1">
              Estimated Amount: ${project.estimatedAmount}
            </p>
            <p className="text-gray-600 mb-1">
              Start Date: {new Date(project.startDate).toLocaleDateString()}
            </p>
            <p className="text-gray-600 mb-1">
              End Date: {new Date(project.estimatedEndDate).toLocaleDateString()}
            </p>
            <button
              onClick={() => navigate(`/project/${project._id}`)}
              className="mt-4 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllProjectsPage;
