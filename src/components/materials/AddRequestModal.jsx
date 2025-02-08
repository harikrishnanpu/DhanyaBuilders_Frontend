// src/components/materials/modals/AddRequestModal.jsx
import React, { useState } from 'react';
import MaterialSearchModal from './MaterialSearchModal';
import api from 'pages/api';

const AddRequestModal = ({ projectId, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState([]);
  const [showMaterialSearchModal, setShowMaterialSearchModal] = useState(false);

  const handleAddMaterial = (material) => {
    const existingItem = items.find((item) => item.material._id === material._id);
    if (existingItem) {
      alert('Material already added.');
      return;
    }
    setItems([...items, { material, quantity: 1 }]);
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('Please add at least one material.');
      return;
    }
    try {
      await api.post(`/materials/${projectId}/requests`, {
        date,
        items: items.map((item) => ({
          material: item.material._id,
          quantity: item.quantity,
        })),
      });
      alert('Material request submitted.');
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-end justify-center">
      <div
        className="bg-white rounded-t-lg w-full p-4 animate-slideUp"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-bold">Add Material Request</h2>
          <button onClick={onClose}>
            <i className="fas fa-times text-gray-600"></i>
          </button>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-md"
          />
        </div>

        {/* Items */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1">Materials</label>
          <button
            className="mb-2 bg-blue-500 text-white px-3 py-1 rounded-md"
            onClick={() => setShowMaterialSearchModal(true)}
          >
            + Add Material
          </button>
          {items.map((item, index) => (
            <div key={item.material._id} className="flex items-center mb-2">
              <div className="flex-1">
                {item.material.name} ({item.material.unit})
              </div>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                className="w-20 border border-gray-300 rounded-md p-1 text-md mr-2"
              />
              <button
                className="text-red-500"
                onClick={() =>
                  setItems(items.filter((_, idx) => idx !== index))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="mt-4 w-full bg-green-600 text-white py-2 rounded-md"
        >
          Submit Request
        </button>

        {/* Material Search Modal */}
        {showMaterialSearchModal && (
          <MaterialSearchModal
            onAdd={handleAddMaterial}
            onClose={() => setShowMaterialSearchModal(false)}
          />
        )}
      </div>

      {/* Modal Animation */}
      <style>
        {`
          .animate-slideUp {
            animation: slideUp 0.3s ease-out;
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default AddRequestModal;
