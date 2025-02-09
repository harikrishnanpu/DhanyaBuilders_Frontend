// src/pages/AllProjectsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AllProjectsPage = () => {
  const [projects, setProjects] = useState([]); // Will hold the 'full' data for each project
  const navigate = useNavigate();

  // Helper to compute project stats from the "full" data
  const computeProjectStats = (projectData) => {
    const { tasks = [], transactions = [], project } = projectData;

    // Total tasks vs. completed
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    // For transactions, assume we have "type" = "in" or "out", plus an "amount"
    const totalIn = transactions
      .filter((txn) => txn.type === 'in')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalOut = transactions
      .filter((txn) => txn.type === 'out')
      .reduce((sum, txn) => sum + txn.amount, 0);

    // Compute an average progress based on the main progress array
    let progressPercentage = 0;
    if (project?.progress?.length) {
      const sumPercent = project.progress.reduce(
        (acc, pItem) => acc + (pItem.percentage || 0),
        0
      );
      progressPercentage = Math.round(
        sumPercent / project.progress.length
      );
    }

    return {
      totalTasks,
      completedTasks,
      totalIn,
      totalOut,
      progressPercentage,
    };
  };

  useEffect(() => {
    // 1) Fetch the basic list of projects
    // 2) For each project, fetch the "full" data
    const fetchAllProjects = async () => {
      try {
        const { data: basicProjects } = await api.get('/api/projects/');
        // Now fetch full details for each
        const fullDataPromises = basicProjects.map(async (bp) => {
          const { data: fullProjectData } = await api.get(`/api/projects/full/${bp._id}`);
          return fullProjectData; // { project, tasks, transactions, ... }
        });

        const allFullData = await Promise.all(fullDataPromises);
        setProjects(allFullData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchAllProjects();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">All Projects</h1>

      {/* Projects List (Responsive Grid) */}
      <div className="grid grid-cols-1 gap-6">
        {projects.map((projectData) => {
          const { project } = projectData;
          const stats = computeProjectStats(projectData);

          return (
            <div
              key={project._id}
              className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition duration-300"
            >
              {/* Horizontal Layout: image portion on the left, details on the right */}
              <div className="flex flex-col md:flex-row">
                {/* "Image" or placeholder portion */}
                <div className="md:w-1/3 bg-gray-200 flex items-center justify-center p-6">
                  {/* Project name in the center of this grey section */}
                  <h2 className="text-xl font-semibold text-gray-800 text-center">
                    {project.name}
                  </h2>
                </div>

                {/* Details portion */}
                <div className="md:w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Customer: </span>
                      {project.customerName}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Estimated Amount: </span>
                      {project.estimatedAmount}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Start Date: </span>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">End Date: </span>
                      {project.estimatedEndDate
                        ? new Date(project.estimatedEndDate).toLocaleDateString()
                        : 'N/A'}
                    </p>

                    {/* Show other summary details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                      <div className="bg-gray-100 p-3 rounded">
                        <span className="font-semibold">Total In: </span>{stats.totalIn}
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <span className="font-semibold">Total Out: </span>{stats.totalOut}
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <span className="font-semibold">Tasks: </span>
                        {stats.completedTasks} / {stats.totalTasks} Completed
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <span className="font-semibold">Progress: </span>
                        {stats.progressPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* View Details button */}
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/project/${project._id}`)}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllProjectsPage;
