import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, rideAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Car,
  Shield,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Power,
  RefreshCw,
  Navigation
} from 'lucide-react';

export default function DriverDashboard() {
  const { captain } = useAuth();
  const [driverProfile, setDriverProfile] = useState(captain);
  const [isOnline, setIsOnline] = useState(captain?.status === 'active');
  const [availableRides, setAvailableRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);

  // Active ride action states
  const [otpInput, setOtpInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch driver profile, rides, and available queue
  const fetchData = async () => {
    try {
      const [profileRes, myRidesRes, availRes] = await Promise.all([
        authAPI.captainProfile().catch(() => null),
        rideAPI.getCaptainRides().catch(() => ({ data: { rides: [] } })),
        rideAPI.getAvailableRides().catch(() => ({ data: { rides: [] } }))
      ]);

      if (profileRes?.data?.captain) {
        setDriverProfile(profileRes.data.captain);
        setIsOnline(profileRes.data.captain.status === 'active');
      }

      const rides = myRidesRes.data?.rides || [];
      setMyRides(rides);

      // Check if there is an ongoing or accepted ride
      const current = rides.find(r => ['accepted', 'arriving', 'ongoing'].includes(r.status));
      setActiveRide(current || null);

      setAvailableRides(availRes.data?.rides || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Toggle Online/Offline
  const handleToggleOnline = async () => {
    setStatusToggling(true);
    setErrorMessage('');
    const newStatus = isOnline ? 'inactive' : 'active';
    try {
      await authAPI.updateCaptainStatus(newStatus);
      setIsOnline(newStatus === 'active');
      setSuccessMessage(`You are now ${newStatus === 'active' ? 'ONLINE and accepting rides' : 'OFFLINE'}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update online status');
    } finally {
      setStatusToggling(false);
    }
  };

  // Accept a pending ride
  const handleAcceptRide = async (rideId) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await rideAPI.confirmRide(rideId);
      setActiveRide(res.data.ride);
      setSuccessMessage('Ride accepted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to accept ride. It may have been taken by another driver.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark arrived at pickup
  const handleMarkArrived = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      const res = await rideAPI.markArrived(activeRide._id);
      setActiveRide(res.data.ride);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Start trip with passenger's OTP
  const handleStartTrip = async () => {
    if (!activeRide || !otpInput) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await rideAPI.startTrip(activeRide._id, otpInput);
      setActiveRide(res.data.ride);
      setOtpInput('');
      setSuccessMessage('OTP verified! Trip has officially started.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete trip
  const handleCompleteTrip = async () => {
    if (!activeRide) return;
    setActionLoading(true);
    try {
      const res = await rideAPI.completeTrip(activeRide._id);
      setActiveRide(null);
      setSuccessMessage('Trip completed! Earnings recorded.');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate earnings
  const completedRides = myRides.filter(r => r.status === 'completed');
  const totalEarnings = completedRides.reduce((acc, r) => acc + (r.fare || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Driver Header & Online Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? 'green' : 'default'} size="sm">
              {isOnline ? 'ONLINE • READY FOR TRIPS' : 'OFFLINE'}
            </Badge>
            <Badge variant="blue" size="sm">
              {driverProfile?.vehicle?.vehicleType?.toUpperCase() || 'CAB'}
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Captain Console: <span className="text-blue-600">{driverProfile?.fullname?.firstname} {driverProfile?.fullname?.lastname}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Vehicle: {driverProfile?.vehicle?.color} {driverProfile?.vehicle?.plate} ({driverProfile?.vehicle?.capacity} Seater)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOnline}
            disabled={statusToggling}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            <Power className="w-5 h-5" />
            <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Trip Execution Card */}
      {activeRide && (
        <Card accent="green" glow={true} className="bg-emerald-50/20 border-emerald-200">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-lg font-bold text-slate-900">
                  Active Assigned Trip ({activeRide.status.toUpperCase()})
                </h2>
              </div>
              <Badge variant="green" size="md">
                Fare: ₹{activeRide.fare}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1 shadow-sm">
                <span className="text-slate-500 block font-semibold">Pickup Address:</span>
                <span className="text-slate-900 font-medium text-sm">{activeRide.pickup}</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1 shadow-sm">
                <span className="text-slate-500 block font-semibold">Drop Destination:</span>
                <span className="text-slate-900 font-medium text-sm">{activeRide.destination}</span>
              </div>
            </div>

            {/* Trip Step Controls */}
            <div className="pt-2">
              {activeRide.status === 'accepted' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                  loading={actionLoading}
                  onClick={handleMarkArrived}
                >
                  Mark Arrived at Pickup
                </Button>
              )}

              {activeRide.status === 'arriving' && (
                <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl max-w-md shadow-sm">
                  <span className="text-xs font-bold text-slate-900 block">
                    Verify Passenger OTP to Start Trip:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 4-digit OTP"
                      className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 tracking-widest text-center w-40 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                    <Button
                      variant="success"
                      size="sm"
                      loading={actionLoading}
                      onClick={handleStartTrip}
                    >
                      Verify & Start Ride
                    </Button>
                  </div>
                </div>
              )}

              {activeRide.status === 'ongoing' && (
                <Button
                  variant="success"
                  size="lg"
                  loading={actionLoading}
                  onClick={handleCompleteTrip}
                >
                  Complete Trip & Collect Fare
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card accent="green">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Earnings</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">₹{totalEarnings}</span>
          <span className="text-xs text-slate-500 block mt-1">Across all completed rides</span>
        </Card>

        <Card accent="blue">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Trips</span>
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{completedRides.length}</span>
          <span className="text-xs text-slate-500 block mt-1">Total trips fulfilled</span>
        </Card>

        <Card accent="teal">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Status</span>
            <Shield className="w-5 h-5 text-teal-600" />
          </div>
          <Badge variant="green" size="md">
            Approved & Verified
          </Badge>
          <span className="text-xs text-slate-500 block mt-2">Driver license & vehicle inspected</span>
        </Card>
      </div>

      {/* Available Ride Requests Queue */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live Ride Requests</h3>
            <p className="text-xs text-slate-500">Available requests matching your vehicle category</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {!isOnline ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            You are currently offline. Toggle status to Online to view incoming requests.
          </div>
        ) : availableRides.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No pending ride requests at this moment. New requests will appear automatically.
          </div>
        ) : (
          <div className="space-y-4">
            {availableRides.map((ride) => (
              <div
                key={ride._id}
                className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all shadow-sm"
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    {ride.pickup} → {ride.destination}
                  </div>
                  <div className="text-slate-500 flex items-center gap-3">
                    <span>Est. Distance: {ride.distance} km</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold">Fare: ₹{ride.fare}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  loading={actionLoading}
                  onClick={() => handleAcceptRide(ride._id)}
                  disabled={!!activeRide}
                >
                  Accept Ride
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
