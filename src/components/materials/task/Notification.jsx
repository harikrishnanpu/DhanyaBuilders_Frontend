// src/hooks/useNotifications.js
import { useState } from 'react';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const notify = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 3 seconds (for demo)
    setTimeout(() => {
      setNotifications((old) => old.filter((n) => n.id !== id));
    }, 3000);
  };

  return {
    notifications,
    notify,
  };
}
