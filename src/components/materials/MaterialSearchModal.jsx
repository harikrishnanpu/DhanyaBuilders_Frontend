// src/components/materials/modals/MaterialSearchModal.jsx
import React, { useState, useEffect } from 'react';
import api from 'pages/api';

const MaterialSearchModal = ({ onAdd, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');

  const units = [
    'nos',
    'kg',
    'bags',
    'cft',
    'tonne',
    'brass',
    'litre',
    'sqft',
    'km',
    'meter',
    'box',
    'ft',
    'cum',
    'mm',
    'sqm',
    'gram',
    // ... add more units
  ];

  const searchMaterials = async () => {
    try {
      const response = await api.get('/materials/materials/search', {
        params: { query: searchQuery },
      });
      setMaterials(response.data);
    } catch (error) {
      console.error('Error searching materials:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchMaterials();
    } else {
      setMaterials([]);
    }
  }, [searchQuery]);

  const handleAddNewMaterial = async () => {
    if (!newMaterialName || !newMaterialUnit) {
      alert('Please enter material name and unit.');
      return;
    }
    try {
      const response = await api.post('/api/projects/material/add/', {
        name: newMaterialName,
        unit: newMaterialUnit,
      });
      onAdd(response.data.material);
      setShowAddMaterialForm(false);
      setNewMaterialName('');
      setNewMaterialUnit('');
      onClose();
    } catch (error) {
      console.error('Error adding new material:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-end justify-center">
      <div
        className="bg-white rounded-t-lg w-full p-4 animate-slideUp"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-md font-bold">Add Material</h2>
          <button onClick={onClose}>
            <i className="fas fa-times text-gray-600"></i>
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material..."
            className="w-full border border-gray-300 rounded-md p-2 text-md"
          />
        </div>

        {/* Search Results */}
        {materials.map((material) => (
          <div
            key={material._id}
            className="p-2 border-b flex justify-between items-center"
          >
            <div>
              {material.name} ({material.unit})
            </div>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded-md"
              onClick={() => {
                onAdd(material);
                onClose();
              }}
            >
              Add
            </button>
          </div>
        ))}

        {/* Add New Material */}
        <div className="mt-4">
          {!showAddMaterialForm ? (
            <button
              className="text-blue-500 text-sm"
              onClick={() => setShowAddMaterialForm(true)}
            >
              + Add New Material
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Material Name
                </label>
                <input
                  type="text"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Unit</label>
                <select
                  value={newMaterialUnit}
                  onChange={(e) => setNewMaterialUnit(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-md"
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md"
                onClick={handleAddNewMaterial}
              >
                Add Material
              </button>
            </div>
          )}
        </div>
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

export default MaterialSearchModal;
