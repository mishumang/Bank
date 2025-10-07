import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

import { User, Lock, CheckCircle, XCircle, Search, Plus, Edit, Trash2, Eye, EyeOff, Download } from 'lucide-react';


// ============================================================================
// FOLDER STRUCTURE EXPLANATION:
// ============================================================================
// In a real project, you would organize files like this:
// 
// src/
// ├── components/           # React components
// │   ├── Auth/
// │   │   ├── Login.jsx
// │   │   └── PasswordStrength.jsx
// │   ├── Portfolio/
// │   │   ├── PortfolioList.jsx
// │   │   ├── PortfolioForm.jsx
// │   │   └── ISINLookup.jsx
// │   └── Admin/
// │       └── UserManagement.jsx
// ├── utils/               # Pure utility functions
// │   ├── validation.js    # Password & input validation
// │   ├── isin.js         # ISIN validation & lookup
// │   └── tests.js        # Self-check tests
// ├── services/           # API services
// │   └── mockAPI.js      # Mock API (offline fallback)
// ├── hooks/              # Custom React hooks
// │   └── useAuth.js
// └── App.jsx             # Main application
//
// For this single-file artifact, everything is combined below with clear sections
// ============================================================================

// ============================================================================
// SECTION 1: PURE UTILITY FUNCTIONS (utils/validation.js)
// These are testable, side-effect-free functions
// ============================================================================
// Add after mockAPI object

// Portfolio calculation utilities
const calculatePortfolioMetrics = (portfolios) => {
  let totalCurrentValue = 0;
  let totalPurchaseValue = 0;
  let assetBreakdown = {};
  
  portfolios.forEach(item => {
    const currentValue = item.quantity * item.price;
    const purchaseValue = item.quantity * (item.purchasePrice || item.price);
    
    totalCurrentValue += currentValue;
    totalPurchaseValue += purchaseValue;
    
    // Asset class breakdown (you'll need mappings for this)
    const assetClass = item.assetClass || 'Equity';
    if (!assetBreakdown[assetClass]) {
      assetBreakdown[assetClass] = 0;
    }
    assetBreakdown[assetClass] += currentValue;
  });
  
  const totalGainLoss = totalCurrentValue - totalPurchaseValue;
  const profitLossPercent = totalPurchaseValue > 0 
    ? ((totalGainLoss / totalPurchaseValue) * 100).toFixed(2)
    : 0;
  
  return {
    totalAUM: totalCurrentValue,
    totalGainLoss,
    profitLossPercent,
    assetBreakdown
  };
};



const getPortfolioReport = (portfolios) => {
  const totals = {
    approved: 0,
    rejected: 0,
    pending: 0
  };
  portfolios.forEach(p => {
    totals[p.status] += p.quantity * p.price;
  });
  return totals;
};

const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const strength = score <= 2 ? 'weak' : score === 3 ? 'medium' : score === 4 ? 'good' : 'strong';
  
  return { checks, score, strength, isValid: score >= 3 };
};

const validateISIN = (isin) => {
  if (!isin || isin.length !== 12) return false;
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  return true;
};

// ============================================================================
// SECTION 2: MOCK API SERVICE (services/mockAPI.js)
// Simulates backend API with offline fallback
// ============================================================================

const mockDatabase = {
 users: [
  { id: 1, username: 'maker1', password: 'Maker@123', role: 'maker', createdAt: '2025-01-01T00:00:00Z' },
  { id: 2, username: 'checker1', password: 'Checker@123', role: 'checker', createdAt: '2025-01-01T00:00:00Z' },
  { id: 3, username: 'admin1', password: 'Admin@123', role: 'admin', createdAt: '2025-01-01T00:00:00Z' }
],
  portfolios: [{
     id: 1, 
      isin: 'US0378331005', 
      name: 'Apple Inc', 
      quantity: 100, 
      price: 150,
      purchasePrice: 140,  // ADD THIS
      purchaseDate: '2025-09-01',  // ADD THIS
      status: 'approved', 
      createdBy: 1 
  },
    { id: 2, 
      isin: 'US5949181045', 
      name: 'Microsoft Corp', 
      quantity: 50, 
      price: 300,
      purchasePrice: 280,  // ADD THIS
      purchaseDate: '2025-08-15',  // ADD THIS
      status: 'approved', 
      createdBy: 1 }
  ],
  isinDatabase: {
    'US0378331005': { name: 'Apple Inc', type: 'Equity', country: 'US' },
    'US5949181045': { name: 'Microsoft Corp', type: 'Equity', country: 'US' },
    'GB0002374006': { name: 'British Telecom', type: 'Equity', country: 'GB' },
    'DE0005140008': { name: 'Deutsche Bank', type: 'Equity', country: 'DE' }
  }, 
  mappings: {
    isinToName: [
      { id: 1, isin: 'US0378331005', securityName: 'Apple Inc', assetClass: 'Equity', instrumentType: 'Common Stock' },
      { id: 2, isin: 'US5949181045', securityName: 'Microsoft Corp', assetClass: 'Equity', instrumentType: 'Common Stock' },
    ],
    custodians: [
      { id: 1, custodianName: 'HDFC Bank', bankAccount: 'ACC001', clientCode: 'CLI001' },
      { id: 2, custodianName: 'ICICI Bank', bankAccount: 'ACC002', clientCode: 'CLI002' },
    ]
  },
  
  // Historical price data
  priceHistory: [
     { isin: 'US0378331005', date: '2025-10-01', price: 145 },
    { isin: 'US0378331005', date: '2025-10-02', price: 147 },
    { isin: 'US0378331005', date: '2025-10-03', price: 148 },
    { isin: 'US0378331005', date: '2025-10-04', price: 149 },
    { isin: 'US0378331005', date: '2025-10-05', price: 148 },
    { isin: 'US0378331005', date: '2025-10-06', price: 149 },
    { isin: 'US0378331005', date: '2025-10-07', price: 150 },

    { isin: 'US5949181045', date: '2025-10-01', price: 295 },
    { isin: 'US5949181045', date: '2025-10-02', price: 296 },
    { isin: 'US5949181045', date: '2025-10-03', price: 298 },
    { isin: 'US5949181045', date: '2025-10-04', price: 299 },
    { isin: 'US5949181045', date: '2025-10-05', price: 297 },
    { isin: 'US5949181045', date: '2025-10-06', price: 299 },
    { isin: 'US5949181045', date: '2025-10-07', price: 300 },
  
  ]
};


const mockAPI = {
  login: (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockDatabase.users.find(u => u.username === username && u.password === password);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          resolve({ success: true, user: userWithoutPassword });
        } else {
          reject({ success: false, message: 'Invalid credentials' });
        }
      }, 500);
    });
  },
  
  lookupISIN: (isin) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = mockDatabase.isinDatabase[isin];
        resolve({ success: !!data, data });
      }, 300);
    });
  },
  
  getPortfolios: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, data: mockDatabase.portfolios });
      }, 300);
    });
  },
  
  createPortfolio: (portfolio, userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPortfolio = {
          id: Date.now(),
          ...portfolio,
          status: 'pending',
          createdBy: userId
        };
        mockDatabase.portfolios.push(newPortfolio);
        resolve({ success: true, data: newPortfolio });
      }, 300);
    });
  },
  
  updatePortfolio: (id, updates) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockDatabase.portfolios.findIndex(p => p.id === id);
        if (index !== -1) {
          mockDatabase.portfolios[index] = { ...mockDatabase.portfolios[index], ...updates };
          resolve({ success: true, data: mockDatabase.portfolios[index] });
        } else {
          reject({ success: false, message: 'Portfolio not found' });
        }
      }, 300);
    });
  },
  
  deletePortfolio: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockDatabase.portfolios = mockDatabase.portfolios.filter(p => p.id !== id);
        resolve({ success: true });
      }, 300);
    });
  },

  // Inside mockAPI object
getPriceForDate: (isin, date) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const priceRecord = mockDatabase.priceHistory.find(
        p => p.isin === isin && p.date === date
      );
      
      if (priceRecord) {
        resolve({ success: true, data: priceRecord.price });
      } else {
        resolve({ success: false, message: 'Price not found for this date' });
      }
    }, 300);
  });
},

addHistoricalPrice: (isin, date, price) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockDatabase.priceHistory.push({ isin, date, price });
      resolve({ success: true, message: 'Price added successfully' });
    }, 300);
  });
},

getPortfolioValueByDate: (date) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let totalValue = 0;
      const portfolioValues = [];
      
      mockDatabase.portfolios.forEach(item => {
        const priceRecord = mockDatabase.priceHistory.find(
          p => p.isin === item.isin && p.date === date
        );
        
        const price = priceRecord ? priceRecord.price : item.price;
        const value = item.quantity * price;
        totalValue += value;
        
        portfolioValues.push({
          ...item,
          currentPrice: price,
          currentValue: value
        });
      });
      
      resolve({ 
        success: true, 
        data: { 
          totalValue, 
          items: portfolioValues,
          date 
        } 
      });
    }, 500);
  });
},

  // Inside mockAPI object
getMappings: () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data: mockDatabase.mappings });
    }, 300);
  });
},

addMapping: (type, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = mockDatabase.mappings[type].length + 1;
      const newMapping = { id: newId, ...data };
      mockDatabase.mappings[type].push(newMapping);
      resolve({ success: true, data: newMapping });
    }, 300);
  });
},

uploadMappingsCSV: (type, csvData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // csvData is already parsed array of objects
      csvData.forEach((row, index) => {
        const newId = mockDatabase.mappings[type].length + index + 1;
        mockDatabase.mappings[type].push({ id: newId, ...row });
      });
      resolve({ success: true, message: `${csvData.length} mappings uploaded` });
    }, 500);
  });
},


  getAllUsers: () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return users without passwords for security
      const usersWithoutPasswords = mockDatabase.users.map(({ password, ...user }) => user);
      resolve({ success: true, data: usersWithoutPasswords });
    }, 300);
  });
},

createUser: (userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if username already exists
      const exists = mockDatabase.users.find(u => u.username === userData.username);
      if (exists) {
        reject({ success: false, message: 'Username already exists' });
        return;
      }
      
      const newUser = {
        id: Date.now(),
        username: userData.username,
        password: userData.password,
        role: userData.role,
        createdAt: new Date().toISOString()
      };
      
      mockDatabase.users.push(newUser);
      const { password, ...userWithoutPassword } = newUser;
      resolve({ success: true, data: userWithoutPassword });
    }, 300);
  });
},

updateUser: (id, updates) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockDatabase.users.findIndex(u => u.id === id);
      if (index === -1) {
        reject({ success: false, message: 'User not found' });
        return;
      }
      
      // Check if new username conflicts with another user
      if (updates.username) {
        const exists = mockDatabase.users.find(u => u.username === updates.username && u.id !== id);
        if (exists) {
          reject({ success: false, message: 'Username already exists' });
          return;
        }
      }
      
      mockDatabase.users[index] = { ...mockDatabase.users[index], ...updates };
      const { password, ...userWithoutPassword } = mockDatabase.users[index];
      resolve({ success: true, data: userWithoutPassword });
    }, 300);
  });
},


deleteUser: (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockDatabase.users.find(u => u.id === id);
      if (!user) {
        reject({ success: false, message: 'User not found' });
        return;
      }
      
      const admins = mockDatabase.users.filter(u => u.role === 'admin');
      if (user.role === 'admin' && admins.length === 1) {
        reject({ success: false, message: 'Cannot delete the last admin user' });
        return;
      }
      
      mockDatabase.users = mockDatabase.users.filter(u => u.id !== id);
      resolve({ success: true, message: 'User deleted successfully' });
    }, 300);
  });
},

changePassword: (userId, oldPassword, newPassword) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockDatabase.users.find(u => u.id === userId);
      if (!user) {
        reject({ success: false, message: 'User not found' });
        return;
      }
      
      if (user.password !== oldPassword) {
        reject({ success: false, message: 'Current password is incorrect' });
        return;
      }
      
      user.password = newPassword;
      resolve({ success: true, message: 'Password changed successfully' });
    }, 300);
  });
}
};

// ============================================================================
// SECTION 3: TEST FUNCTIONS (utils/tests.js)
// Self-check tests for pure functions
// ============================================================================

const runSelfCheckTests = () => {
  const tests = [
    {
      name: 'Password Validation - Strong',
      fn: () => {
        const result = validatePassword('Test@1234');
        return result.strength === 'strong' && result.isValid;
      }
    },
    {
      name: 'Password Validation - Weak',
      fn: () => {
        const result = validatePassword('test');
        return result.strength === 'weak' && !result.isValid;
      }
    },
    {
      name: 'ISIN Validation - Valid',
      fn: () => validateISIN('US0378331005')
    },
    {
      name: 'ISIN Validation - Invalid',
      fn: () => !validateISIN('INVALID123')
    },
    {
      name: 'ISIN Validation - Wrong Length',
      fn: () => !validateISIN('US037833')
    }
  ];
  
  const results = tests.map(test => ({
    name: test.name,
    passed: test.fn()
  }));
  
  return results;
};

const UserManagement = ({ mockAPI }) => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'maker'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await mockAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validate password
    if (!editUser) {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        setError('Password does not meet requirements');
        return;
      }
    }

    setLoading(true);
    try {
      if (editUser) {
        await mockAPI.updateUser(editUser.id, formData);
      } else {
        await mockAPI.createUser(formData);
      }
      
      setShowForm(false);
      setEditUser(null);
      setFormData({ username: '', password: '', role: 'maker' });
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({ username: user.username, password: '', role: user.role });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await mockAPI.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };
 
  const handleCancel = () => {
    setShowForm(false);
    setEditUser(null);
    setFormData({ username: '', password: '', role: 'maker' });
    setError('');
  };

  if (showForm) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">
          {editUser ? 'Edit User' : 'Add New User'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={editUser}
            />
            {editUser && (
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {editUser ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!editUser}
            />
            {formData.password && <PasswordStrength password={formData.password} />}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="maker">Maker</option>
              <option value="checker">Checker</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'maker' && 'Can create and edit portfolio items'}
              {formData.role === 'checker' && 'Can approve/reject portfolio items'}
              {formData.role === 'admin' && 'Full system access including user management'}
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
          )}
         
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created At</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm">{user.username}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'checker' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found. Click "Add User" to create one.
        </div>
      )}
    </div>
  );
};

const ChangePassword = ({ user, mockAPI, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const validation = validatePassword(formData.newPassword);
    if (!validation.isValid) {
      setError('New password does not meet requirements');
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await mockAPI.changePassword(user.id, formData.oldPassword, formData.newPassword);
      setSuccess('Password changed successfully!');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4">Change Password</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input
            type="password"
            value={formData.oldPassword}
            onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.newPassword && <PasswordStrength password={formData.newPassword} />}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm New Password</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded">{success}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SECTION 4: COMPONENTS
// ============================================================================

// Component: PasswordStrength (components/Auth/PasswordStrength.jsx)
const PasswordStrength = ({ password }) => {
  const result = validatePassword(password);
  
  const strengthColor = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500'
  };
  
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${i <= result.score ? strengthColor[result.strength] : 'bg-gray-300'}`}
          />
        ))}
      </div>
      <div className="text-xs space-y-1">
        <div className={result.checks.length ? 'text-green-600' : 'text-gray-400'}>
          {result.checks.length ? '✓' : '○'} At least 8 characters
        </div>
        <div className={result.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
          {result.checks.uppercase ? '✓' : '○'} Uppercase letter
        </div>
        <div className={result.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
          {result.checks.lowercase ? '✓' : '○'} Lowercase letter
        </div>
        <div className={result.checks.number ? 'text-green-600' : 'text-gray-400'}>
          {result.checks.number ? '✓' : '○'} Number
        </div>
        <div className={result.checks.special ? 'text-green-600' : 'text-gray-400'}>
          {result.checks.special ? '✓' : '○'} Special character (!@#$%^&*)
        </div>
      </div>
    </div>
  );
};

// Component: Login (components/Auth/Login.jsx)
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await mockAPI.login(username, password);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <User className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Bank Portfolio App</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && <PasswordStrength password={password} />}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Maker: maker1 / Maker@123</p>
          <p>Checker: checker1 / Checker@123</p>
          <p>Admin: admin1 / Admin@123</p>
        </div>
      </div>
    </div>
  );
};

// Component: ISINLookup (components/Portfolio/ISINLookup.jsx)
const ISINLookup = ({ onSelect }) => {
  const [isin, setIsin] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleLookup = async () => {
    if (!validateISIN(isin)) {
      setResult({ success: false, message: 'Invalid ISIN format' });
      return;
    }
    
    setLoading(true);
    const response = await mockAPI.lookupISIN(isin);
    setResult(response);
    setLoading(false);
    
    if (response.success && onSelect) {
      onSelect(isin, response.data);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">ISIN Code</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={isin}
          onChange={(e) => setIsin(e.target.value.toUpperCase())}
          placeholder="US0378331005"
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={12}
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
      
      {result && (
        <div className={`p-3 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? (
            <div>
              <p className="font-semibold">{result.data.name}</p>
              <p className="text-sm">Type: {result.data.type} | Country: {result.data.country}</p>
            </div>
          ) : (
            <p>{result.message || 'ISIN not found'}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Component: PortfolioForm (components/Portfolio/PortfolioForm.jsx)
const PortfolioForm = ({ user, onSuccess, onCancel, editItem }) => {
  const [formData, setFormData] = useState(editItem || {
    isin: '',
    name: '',
    quantity: '',
    price: ''
  });
  
  const handleISINSelect = (isin, data) => {
    setFormData({ ...formData, isin, name: data.name });
  };
  
  const handleSubmit = async () => {
    if (!formData.isin || !formData.name || !formData.quantity || !formData.price) {
      alert('Please fill all fields');
      return;
    }
    
    if (editItem) {
      await mockAPI.updatePortfolio(editItem.id, formData);
    } else {
      await mockAPI.createPortfolio(formData, user.id);
    }
    
    onSuccess();
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">{editItem ? 'Edit' : 'Add'} Portfolio Item</h3>
      
      <div className="space-y-4">
        <ISINLookup onSelect={handleISINSelect} />
        
        <div>
          <label className="block text-sm font-medium mb-1">Security Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            {editItem ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Component: PortfolioList (components/Portfolio/PortfolioList.jsx)
const PortfolioList = ({ user, portfolios, onRefresh, onEdit, onDelete }) => {
  const canApprove = user.role === 'checker' || user.role === 'admin';
  const canEdit = user.role === 'maker' || user.role === 'admin';
  const canDelete = user.role === 'admin';
  
  const handleApprove = async (id) => {
    await mockAPI.updatePortfolio(id, { status: 'approved' });
    onRefresh();
  };
  
  const handleReject = async (id) => {
    await mockAPI.updatePortfolio(id, { status: 'rejected' });
    onRefresh();
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">ISIN</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {portfolios.map(item => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-sm">{item.isin}</td>
              <td className="px-4 py-3 text-sm">{item.name}</td>
              <td className="px-4 py-3 text-sm">{item.quantity}</td>
              <td className="px-4 py-3 text-sm">${item.price}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'approved' ? 'bg-green-100 text-green-800' :
                  item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  {canEdit && item.status === 'pending' && (
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canApprove && item.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(item.id)} className="text-green-600 hover:text-green-800">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReject(item.id)} className="text-red-600 hover:text-red-800">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Component: TestPanel (for developers)
const TestPanel = () => {
  const [testResults, setTestResults] = useState([]);
  
  const runTests = () => {
    const results = runSelfCheckTests();
    setTestResults(results);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Developer Self-Check Tests</h3>
        <button
          onClick={runTests}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Run Tests
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div className="space-y-2">
          {testResults.map((result, i) => (
            <div key={i} className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={result.passed ? 'text-green-800' : 'text-red-800'}>
                {result.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SECTION 5: MAIN APP COMPONENT (App.jsx)
// ============================================================================

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const PortfolioAnalytics = ({ portfolios, mockAPI }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historicalData, setHistoricalData] = useState(null);
  const [showManualPriceInput, setShowManualPriceInput] = useState(false);
  const [manualPriceData, setManualPriceData] = useState({ isin: '', price: '' });
  
  const metrics = calculatePortfolioMetrics(portfolios);
  
  // Load historical data when date changes
  const handleDateChange = async (date) => {
    setSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    const response = await mockAPI.getPortfolioValueByDate(dateString);
    
    if (response.success) {
      setHistoricalData(response.data);
    } else {
      setShowManualPriceInput(true);
    }
  };
  
  const handleManualPriceSubmit = async () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    await mockAPI.addHistoricalPrice(
      manualPriceData.isin, 
      dateString, 
      parseFloat(manualPriceData.price)
    );
    setShowManualPriceInput(false);
    handleDateChange(selectedDate);
  };
  
  // Prepare chart data for asset breakdown
  const assetChartData = {
    labels: Object.keys(metrics.assetBreakdown),
    datasets: [{
      label: 'Asset Allocation',
      data: Object.values(metrics.assetBreakdown),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6'
      ]
    }]
  };
  
  // Prepare gain/loss heatmap data
  const gainLossData = {
    labels: portfolios.map(p => p.name),
    datasets: [{
      label: 'Gain/Loss ($)',
      data: portfolios.map(p => {
        const current = p.quantity * p.price;
        const purchase = p.quantity * (p.purchasePrice || p.price);
        return current - purchase;
      }),
      backgroundColor: portfolios.map(p => {
        const current = p.quantity * p.price;
        const purchase = p.quantity * (p.purchasePrice || p.price);
        return (current - purchase) >= 0 ? '#10B981' : '#EF4444';
      })
    }]
  };
  
  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Portfolio Valuation Date</h3>
        <div className="flex items-center gap-4">
          <label className="font-medium">Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className="border p-2 rounded"
            maxDate={new Date()}
          />
          <span className="text-sm text-gray-600">
            Current Date: {new Date().toISOString().split('T')[0]}
          </span>
        </div>
        
        {historicalData && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="font-medium">
              Total Portfolio Value on {historicalData.date}: 
              <span className="text-blue-600 ml-2">
                ${historicalData.totalValue.toFixed(2)}
              </span>
            </p>
          </div>
        )}
        
        {showManualPriceInput && (
          <div className="mt-4 p-4 bg-yellow-50 rounded">
            <p className="text-sm mb-2">Price data not found. Enter manually:</p>
            <div className="flex gap-2">
              <select
                value={manualPriceData.isin}
                onChange={(e) => setManualPriceData({...manualPriceData, isin: e.target.value})}
                className="border p-2 rounded"
              >
                <option value="">Select Security</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.isin}>{p.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Price"
                value={manualPriceData.price}
                onChange={(e) => setManualPriceData({...manualPriceData, price: e.target.value})}
                className="border p-2 rounded"
              />
              <button
                onClick={handleManualPriceSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Price
              </button>
              <button
                onClick={() => setShowManualPriceInput(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-sm text-gray-600 mb-2">Total AUM</h4>
          <p className="text-2xl font-bold text-blue-600">
            ${metrics.totalAUM.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-sm text-gray-600 mb-2">Total Gain/Loss</h4>
          <p className={`text-2xl font-bold ${metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${metrics.totalGainLoss.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-sm text-gray-600 mb-2">Profit/Loss %</h4>
          <p className={`text-2xl font-bold ${metrics.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.profitLossPercent}%
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Asset Allocation</h3>
          <Doughnut data={assetChartData} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Gain/Loss Heatmap</h3>
          <Bar 
            data={gainLossData}
            options={{
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const MappingModule = ({ mockAPI }) => {
  const [mappings, setMappings] = useState({ isinToName: [], custodians: [] });
  const [activeTab, setActiveTab] = useState('isinToName');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  
  useEffect(() => {
    loadMappings();
  }, []);
  
  const loadMappings = async () => {
    const response = await mockAPI.getMappings();
    setMappings(response.data);
  };
  
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Use Papa Parse library for CSV parsing
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split('\n').slice(1); // Skip header
      
      const parsedData = rows.map(row => {
        const values = row.split(',');
        if (activeTab === 'isinToName') {
          return {
            isin: values[0],
            securityName: values[1],
            assetClass: values[2],
            instrumentType: values[3]
          };
        } else {
          return {
            custodianName: values[0],
            bankAccount: values[1],
            clientCode: values[2]
          };
        }
      });
      
      await mockAPI.uploadMappingsCSV(activeTab, parsedData);
      loadMappings();
      alert('CSV uploaded successfully!');
    };
    reader.readAsText(file);
  };
  
  const handleAddMapping = async () => {
    await mockAPI.addMapping(activeTab, formData);
    setShowForm(false);
    setFormData({});
    loadMappings();
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Mapping Module</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setActiveTab('isinToName')}
          className={`px-4 py-2 ${activeTab === 'isinToName' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          ISIN Mappings
        </button>
        <button
          onClick={() => setActiveTab('custodians')}
          className={`px-4 py-2 ${activeTab === 'custodians' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Custodian Mappings
        </button>
      </div>
      
      {/* Upload and Add buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Mapping
        </button>
        <label className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
          Upload CSV
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
        </label>
      </div>
      
      {/* Add Form */}
      {showForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded">
          {activeTab === 'isinToName' ? (
            <>
              <input
                placeholder="ISIN"
                value={formData.isin || ''}
                onChange={(e) => setFormData({...formData, isin: e.target.value})}
                className="border p-2 rounded mr-2"
              />
              <input
                placeholder="Security Name"
                value={formData.securityName || ''}
                onChange={(e) => setFormData({...formData, securityName: e.target.value})}
                className="border p-2 rounded mr-2"
              />
              <input
                placeholder="Asset Class"
                value={formData.assetClass || ''}
                onChange={(e) => setFormData({...formData, assetClass: e.target.value})}
                className="border p-2 rounded mr-2"
              />
              <input
                placeholder="Instrument Type"
                value={formData.instrumentType || ''}
                onChange={(e) => setFormData({...formData, instrumentType: e.target.value})}
                className="border p-2 rounded mr-2"
              />
            </>
          ) : (
            <>
              <input
                placeholder="Custodian Name"
                value={formData.custodianName || ''}
                onChange={(e) => setFormData({...formData, custodianName: e.target.value})}
                className="border p-2 rounded mr-2"
              />
              <input
                placeholder="Bank Account"
                value={formData.bankAccount || ''}
                onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                className="border p-2 rounded mr-2"
              />
              <input
                placeholder="Client Code"
                value={formData.clientCode || ''}
                onChange={(e) => setFormData({...formData, clientCode: e.target.value})}
                className="border p-2 rounded mr-2"
              />
            </>
          )}
          <button onClick={handleAddMapping} className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </div>
      )}
      
      {/* Mappings Table */}
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {activeTab === 'isinToName' ? (
              <>
                <th className="px-4 py-2 text-left">ISIN</th>
                <th className="px-4 py-2 text-left">Security Name</th>
                <th className="px-4 py-2 text-left">Asset Class</th>
                <th className="px-4 py-2 text-left">Instrument Type</th>
              </>
            ) : (
              <>
                <th className="px-4 py-2 text-left">Custodian</th>
                <th className="px-4 py-2 text-left">Bank Account</th>
                <th className="px-4 py-2 text-left">Client Code</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {mappings[activeTab].map(item => (
            <tr key={item.id} className="border-t">
              {activeTab === 'isinToName' ? (
                <>
                  <td className="px-4 py-2">{item.isin}</td>
                  <td className="px-4 py-2">{item.securityName}</td>
                  <td className="px-4 py-2">{item.assetClass}</td>
                  <td className="px-4 py-2">{item.instrumentType}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2">{item.custodianName}</td>
                  <td className="px-4 py-2">{item.bankAccount}</td>
                  <td className="px-4 py-2">{item.clientCode}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const App = () => {
  const [user, setUser] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  


function addNotification(message, type = 'info') {
  setNotifications(prev => [...prev, { 
    message, 
    type, 
    timestamp: new Date().toISOString() 
  }]);
}
 

  useEffect(() => {
    if (user) {
      loadPortfolios();
    }
  }, [user]);
  
  const loadPortfolios = async () => {
    const response = await mockAPI.getPortfolios();
    setPortfolios(response.data);
  };
  
  const handleLogout = () => {
    setUser(null);
    setPortfolios([]);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditItem(null);
    loadPortfolios();
  };
  
  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await mockAPI.deletePortfolio(id);
      loadPortfolios();
    }
  };
  const handleApprove = async (id) => {
  await mockAPI.updatePortfolio(id, { status: 'approved' });
  addNotification('Portfolio approved.', 'success');
  loadPortfolios();
};
const downloadPDF = () => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Bank Portfolio Report', 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Generated by: ${user.username} (${user.role})`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleString()}`, 14, 36);
  
  // Prepare table data
  const tableData = portfolios.map(item => [
    item.isin,
    item.name,
    item.quantity,
    `$${item.price}`,
    `$${(item.quantity * item.price).toFixed(2)}`,
    item.status
  ]);
  
  // Add summary report
  const report = getPortfolioReport(portfolios);
  const summaryData = [
    ['Approved', `$${report.approved.toFixed(2)}`],
    ['Pending', `$${report.pending.toFixed(2)}`],
    ['Rejected', `$${report.rejected.toFixed(2)}`],
    ['Total', `$${(report.approved + report.pending + report.rejected).toFixed(2)}`]
  ];
  
  // Add summary table - USE autoTable() function instead of doc.autoTable()
  autoTable(doc, {
    head: [['Status', 'Total Value']],
    body: summaryData,
    startY: 45,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133] },
    margin: { left: 14 }
  });
  
  // Add portfolio items table - USE autoTable() function instead of doc.autoTable()
  autoTable(doc, {
    head: [['ISIN', 'Name', 'Quantity', 'Price', 'Total Value', 'Status']],
    body: tableData,
    startY: doc.lastAutoTable.finalY + 10,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 25 }
    }
  });
  
  // Save the PDF
  doc.save(`portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`);
};


   if (!user) {
    return <Login onLogin={setUser} />;
  }
  
return (
  <div className="min-h-screen bg-gray-100">
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Bank Portfolio App</h1>
            <p className="text-sm text-gray-600">
              Logged in as: {user.username} ({user.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 ${currentView === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Portfolio
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setCurrentView('users')}
              className={`px-4 py-2 ${currentView === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              User Management
            </button>
          )}
          <button
            onClick={() => setCurrentView('password')}
            className={`px-4 py-2 ${currentView === 'password' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          >
            Change Password
          </button>
          <button
  onClick={() => setCurrentView('mappings')}
  className={`px-4 py-2 ${currentView === 'mappings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
>
  Mappings
</button>
<button
  onClick={() => setCurrentView('analytics')}
  className={`px-4 py-2 ${currentView === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
>
  Analytics
</button>


        </div>
      </div>
    </div>
    
{currentView === 'mappings' && (
  <MappingModule mockAPI={mockAPI} />
)}

{currentView === 'analytics' && (
  <PortfolioAnalytics portfolios={portfolios} mockAPI={mockAPI} />
)}



    {/* Notification Display */}
    <div className="max-w-7xl mx-auto px-4 pt-4">
      {notifications.map((n, i) => (
        <div key={i} className={`p-2 mb-2 rounded ${n.type === 'success' ? 'bg-green-200' : 'bg-blue-200'}`}>
          {n.message} ({new Date(n.timestamp).toLocaleTimeString()})
        </div>
      ))}
    </div>

    <div className="max-w-7xl mx-auto px-4 py-6">
      {currentView === 'password' && (
        <ChangePassword 
          user={user} 
          mockAPI={mockAPI}
          onCancel={() => setCurrentView('dashboard')}
          onSuccess={() => setCurrentView('dashboard')}
        />
      )}
      
      {currentView === 'users' && user.role === 'admin' && (
        <UserManagement mockAPI={mockAPI} />
      )}
      
      {currentView === 'dashboard' && (
        <>
          <TestPanel />
          
          <div className="mb-4 flex gap-2">
  <button
    onClick={downloadPDF}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
  >
    <Download className="w-5 h-5" />
    Download PDF
  </button>
  
  {!showForm && (user.role === 'maker' || user.role === 'admin') && (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      <Plus className="w-5 h-5" />
      Add Portfolio Item
    </button>
  )}
</div>

          {showForm ? (
            <PortfolioForm
              user={user}
              editItem={editItem}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditItem(null);
              }}
            />
          ) : (
            <PortfolioList
              user={user}
              portfolios={portfolios}
              onRefresh={loadPortfolios}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  </div>
);

};

export default App;