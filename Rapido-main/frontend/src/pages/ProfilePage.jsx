import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  User,
  Shield,
  LifeBuoy,
  CheckCircle,
  AlertCircle,
  Car
} from 'lucide-react';

export default function ProfilePage() {
  const { user, captain, role, updateProfile } = useAuth();
  const [firstname, setFirstname] = useState(user?.fullname?.firstname || captain?.fullname?.firstname || '');
  const [lastname, setLastname] = useState(user?.fullname?.lastname || captain?.fullname?.lastname || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Sync profile data when auth object updates
  useEffect(() => {
    if (user?.fullname) {
      setFirstname(user.fullname.firstname || '');
      setLastname(user.fullname.lastname || '');
    } else if (captain?.fullname) {
      setFirstname(captain.fullname.firstname || '');
      setLastname(captain.fullname.lastname || '');
    }
  }, [user, captain]);

  // Support complaint form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('ride_issue');
  const [description, setDescription] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState('');
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    complaintAPI.getUserComplaints()
      .then(res => setComplaints(res.data.complaints || []))
      .catch(() => {});
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (firstname.trim().length < 3) {
      setProfileError('First name must be at least 3 characters long');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile(firstname.trim(), lastname.trim());
      setProfileMessage('Profile updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setComplaintLoading(true);
    setComplaintMessage('');
    try {
      const res = await complaintAPI.createComplaint({ subject, category, description });
      setComplaintMessage('Support ticket created. Our team will review it.');
      setSubject('');
      setDescription('');
      setComplaints([res.data.complaint, ...complaints]);
      setTimeout(() => setComplaintMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setComplaintMessage('Failed to submit ticket');
    } finally {
      setComplaintLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <Badge variant="blue" size="sm">ACCOUNT & SUPPORT</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Profile & <span className="text-blue-600">Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your passenger profile details, view role permissions, or submit a support ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Personal Profile</span>
                </h3>
                <Badge variant={role === 'admin' ? 'purple' : role === 'captain' ? 'green' : 'blue'}>
                  {role ? role.toUpperCase() : 'USER'}
                </Badge>
              </div>

              {profileMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{profileMessage}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || captain?.email || 'user@example.com'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              {role === 'captain' && captain?.vehicle && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-600 block">Registered Vehicle</span>
                  <div className="text-slate-700">
                    {captain.vehicle.color} • {captain.vehicle.plate} ({captain.vehicle.vehicleType})
                  </div>
                </div>
              )}

              <Button type="submit" size="sm" loading={profileLoading} className="w-full mt-2">
                Save Profile Changes
              </Button>
            </form>
          </Card>
        </div>

        {/* Support & Complaints */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-emerald-600" />
                  <span>Report Issue or Feedback</span>
                </h3>
              </div>

              {complaintMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{complaintMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Issue with fare calculation or driver delay"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="ride_issue">Ride Issue</option>
                  <option value="billing">Billing & Pass Deduction</option>
                  <option value="driver_behavior">Driver Conduct</option>
                  <option value="safety">Safety Concerns</option>
                  <option value="app_feedback">App Feature Suggestion</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed information regarding your inquiry..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <Button type="submit" size="sm" variant="success" loading={complaintLoading} className="w-full">
                Submit Support Ticket
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
