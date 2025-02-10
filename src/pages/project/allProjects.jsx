// src/pages/AllProjectsPage.jsx
import React, { useEffect, useState } from 'react';
import { Grid, Typography } from '@mui/material';
import ProjectCard from 'components/project/ProjectCard';
import api from '../api'; // Ensure your API module is set up correctly

const AllProjectsPage = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Replace with your actual API endpoint.
        const { data } = await api.get('/api/projects/');
        // Expecting data to be an array of project objects.
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          All Projects
        </Typography>
      </Grid>

      {projects.length === 0 ? (
        <Grid item xs={12}>
          <Typography variant="body1">No projects found.</Typography>
        </Grid>
      ) : (
        projects.map((project) => (
          <Grid item xs={12} key={project._id}>
            <ProjectCard project={project} />
          </Grid>
        ))
      )}
    </Grid>
  );
};

export default AllProjectsPage;
