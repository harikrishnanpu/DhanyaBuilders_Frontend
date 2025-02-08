// src/hooks/useTasksApi.js
import { useState } from 'react';
import api from 'pages/api'; // Your configured Axios instance

export default function useTasksApi(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/projects/${projectId}/tasks`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/tasks`, taskData);
      setTasks((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const response = await api.put(`/api/projects/${projectId}/tasks/${taskId}`, taskData);
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? response.data : task))
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/api/projects/${projectId}/tasks/${taskId}`);
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return {
    tasks,
    loading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
