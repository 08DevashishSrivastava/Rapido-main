import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rideAPI, subscriptionAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import RideMap from '../components/RideMap';
import {
  Car,
  Bike,
  Navigation,
  MapPin,
  Clock,
  Shield,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Star,
  RefreshCw,
  XCircle,
  UserCheck
} from 'lucide-react';

const POPULAR_LOCATIONS = [
  'Connaught Place, New Delhi',
  'Indira Gandhi International Airport (DEL)',
  'Cyber Hub, DLF Phase 2, Gurugram',
  'Electronic City, Noida Sector 62',
  'Hauz Khas Village, South Delhi',
  'Saket District Centre, New Delhi'
];

export default function BookRidePage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const initialPickup = searchParams.get('pickup') || 'Connaught Place, New Delhi';
  const initialDestination = searchParams.get('destination') || 'Indira Gandhi International Airport (DEL)';
  const initialVehicle = searchParams.get('vehicle') || 'car';

  const [pickup, setPickup] = useState(initialPickup);
  const [destination, setDestination] = useState(initialDestination);
  const [selectedVehicle, setSelectedVehicle] = useState(initialVehicle);
  const [fareEstimates, setFareEstimates] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [activeSub, setActiveSub] = useState(null);

  // Active booked ride state
  const [currentRide, setCurrentRide] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [rated, setRated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active subscription and restore any active booking on page refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    subscriptionAPI.getActiveSubscription()
      .then(res => setActiveSub(res.data.subscription))
      .catch(() => setActiveSub(null));

    // Restore active ride if user refreshed or navigated back
    rideAPI.getUserRides()
      .then(res => {
        const rides = res.data?.rides || [];
        const active = rides.find(r => ['pending', 'accepted', 'arriving', 'ongoing'].includes(r.status));
        if (active) {
          setCurrentRide(active);
          setPickup(active.pickup);
          setDestination(active.destination);
          if (active.vehicleType) setSelectedVehicle(active.vehicleType);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Calculate fare estimates on pickup/destination change
  const fetchEstimates = async () => {
    if (!pickup.trim() || !destination.trim()) return;
    setEstimating(true);
    setErrorMessage('');
    try {
      const res = await rideAPI.getFareEstimates(pickup.trim(), destination.trim());
      setFareEstimates(res.data);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not calculate route estimates. Please check location names.');
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [pickup, destination]);

  // Poll for ride updates when a ride is pending or active
  useEffect(() => {
    if (!currentRide || ['completed', 'cancelled'].includes(currentRide.status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await rideAPI.getUserRides();
        const updated = res.data.rides.find(r => r._id === currentRide._id);
        if (updated) {
          setCurrentRide(updated);
        }
      } catch (err) {
        // Silent poll error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentRide]);

  const handleBookRide = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/book');
      return;
    }

    if (!pickup.trim() || !destination.trim()) {
      setErrorMessage('Please provide both pickup and destination locations.');
      return;
    }

    setBookingLoading(true);
    setErrorMessage('');
    try {
      const res = await rideAPI.createRide({
        pickup: pickup.trim(),
        destination: destination.trim(),
        vehicleType: selectedVehicle
      });
      setCurrentRide(res.data.ride);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!currentRide) return;
    setCancelLoading(true);
    try {
      const res = await rideAPI.cancelRide(currentRide._id, 'Passenger cancelled before pickup');
      setCurrentRide(res.data.ride);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRateRide = async () => {
    if (!currentRide) return;
    setRatingLoading(true);
    try {
      await rideAPI.rateRide({
        rideId: currentRide._id,
        rating: starRating,
        review: reviewText
      });
      setRated(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const selectedFare = fareEstimates?.fares?.[selectedVehicle];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <Badge variant="blue" size="sm">RIDE ESTIMATOR & BOOKING</Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Book a Ride with <span className="text-blue-600">RidePass Pro</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Instant driver dispatch with automatic RidePass discount applied at checkout.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Booking Tracker (if ride is in progress) */}
      {currentRide && (
        <Card accent="blue" className="border-blue-300 bg-white">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
                <h2 className="text-lg font-bold text-slate-900">
                  Ride Status: <span className="capitalize text-blue-700">{currentRide.status}</span>
                </h2>
              </div>
              <Badge variant="blue" size="md">
                Ride ID #{currentRide._id.slice(-6)}
              </Badge>
            </div>

            {/* OTP Security Display for Passenger */}
            {['pending', 'accepted', 'arriving'].includes(currentRide.status) && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Trip Start Security Verification
                  </span>
                  <p className="text-xs text-slate-600">
                    Share this 4-digit OTP with your driver once they arrive to start the ride.
                  </p>
                </div>
                <div className="px-5 py-2.5 bg-white border border-blue-400 rounded-xl text-center shadow-xs">
                  <span className="text-2xl font-black tracking-widest text-emerald-700">
                    {currentRide.otp}
                  </span>
                </div>
              </div>
            )}

            {/* Assigned Driver Details Card */}
            {currentRide.captain && typeof currentRide.captain === 'object' && (
              <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {currentRide.captain.fullname?.firstname?.[0] || 'D'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Assigned Captain</span>
                    <span className="text-sm font-black text-slate-900 block">
                      {currentRide.captain.fullname ? `${currentRide.captain.fullname.firstname} ${currentRide.captain.fullname.lastname || ''}`.trim() : 'Verified Driver'}
                    </span>
                    <span className="text-xs text-slate-600 capitalize">
                      {currentRide.captain.vehicle?.color ? `${currentRide.captain.vehicle.color} ` : ''}
                      {currentRide.captain.vehicle?.vehicleType || currentRide.vehicleType}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-left sm:text-right shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Vehicle Plate</span>
                  <span className="text-xs font-black text-slate-900 tracking-wider">
                    {currentRide.captain.vehicle?.plate || 'Verified Vehicle'}
                  </span>
                </div>
              </div>
            )}

            {/* Status explanation */}
            {currentRide.status === 'pending' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <span>Searching for available verified drivers near your pickup location...</span>
              </div>
            )}

            {currentRide.status === 'accepted' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">A driver has accepted your ride!</span>
                  <span>Driver is en route to pickup. Please be ready at {currentRide.pickup}.</span>
                </div>
              </div>
            )}

            {currentRide.status === 'arriving' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Your driver has arrived at pickup. Share your OTP to begin trip.</span>
              </div>
            )}

            {currentRide.status === 'ongoing' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Trip in progress. Destination: {currentRide.destination}. Have a safe journey!</span>
              </div>
            )}

            {currentRide.status === 'completed' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Trip Completed!</span>
                    <span>Total Fare: ₹{currentRide.finalFare} (RidePass Saved: ₹{currentRide.ridePassDiscount})</span>
                  </div>
                </div>

                {!rated ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-900 block">Rate your ride experience:</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStarRating(s)}
                          className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                          <Star className={`w-6 h-6 ${s <= starRating ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add an optional review..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <Button size="sm" variant="primary" onClick={handleRateRide} loading={ratingLoading}>
                      Submit Review
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 font-bold">Thank you for rating your ride!</div>
                )}
              </div>
            )}

            {currentRide.status === 'cancelled' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <span className="font-bold block">Ride Cancelled ({currentRide.cancelledBy || 'System'})</span>
                  <span>{currentRide.cancelReason || 'Cancelled'}. Any RidePass allowance was safely reversed to your pass.</span>
                </div>
              </div>
            )}

            {/* Actions: Cancellation or Book Another Ride */}
            <div className="flex justify-end gap-3 pt-2">
              {['pending', 'accepted'].includes(currentRide.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCancelRide}
                  loading={cancelLoading}
                >
                  Cancel Ride
                </Button>
              )}

              {['completed', 'cancelled'].includes(currentRide.status) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setCurrentRide(null);
                    setRated(false);
                    setReviewText('');
                  }}
                >
                  Book Another Ride
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Booking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Route & Booking Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <span>Select Pickup & Drop-Off</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pickup Location</span>
                  </label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Destination Drop</span>
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Quick Route Shortcuts */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Popular Delhi NCR Destinations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDestination(loc)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Live Route Map */}
          <RideMap
            pickup={pickup}
            destination={destination}
            className="h-72 sm:h-80"
          />

          {/* Vehicle Category Selector */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Choose Vehicle Type</h3>
                {fareEstimates && (
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    ~{fareEstimates.duration} mins • {fareEstimates.distance} km
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'motorcycle', name: 'Bike Taxi', icon: Bike, desc: 'Fastest in city traffic' },
                  { id: 'auto', name: 'Auto Rickshaw', icon: Car, desc: 'Breezy & affordable' },
                  { id: 'car', name: 'Prime Cab', icon: Car, desc: 'AC Sedan / Hatchback' }
                ].map((item) => {
                  const Icon = item.icon;
                  const fareInfo = fareEstimates?.fares?.[item.id];
                  const isSelected = selectedVehicle === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedVehicle(item.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                        {fareInfo?.ridePassEligible && (
                          <Badge variant="green" size="sm">
                            Pass Eligible
                          </Badge>
                        )}
                      </div>

                      <div className="font-bold text-sm text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mb-3">{item.desc}</div>

                      <div className="pt-2 border-t border-slate-100">
                        {estimating ? (
                          <div className="h-5 bg-slate-200 rounded-md animate-pulse" />
                        ) : fareInfo ? (
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-slate-900">
                                ₹{fareInfo.finalFare}
                              </span>
                              {fareInfo.discount > 0 && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{fareInfo.standardFare}
                                </span>
                              )}
                            </div>
                            {fareInfo.finalFare === 0 ? (
                              <span className="text-[10px] font-bold text-emerald-700">
                                100% Free with Pass
                              </span>
                            ) : fareInfo.discount > 0 ? (
                              <span className="text-[10px] text-teal-700 font-semibold">
                                Saved ₹{fareInfo.discount} (Excess fare)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Standard Fare</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Calculating...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Fare Summary & Confirmation Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <Card glow={true}>
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Fare Summary & Breakdown</h3>

              {/* RidePass Status Banner */}
              {activeSub ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-900 block">
                      {activeSub.planSnapshot?.name} Applied
                    </span>
                    <span className="text-emerald-700">
                      {activeSub.remainingRides} rides left (Cap ₹{activeSub.planSnapshot?.maxFarePerRide}/ride)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-600">No active RidePass</span>
                  <a href="/plans" className="text-blue-600 hover:text-blue-700 font-bold">
                    Get Pass & Save
                  </a>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Standard Estimated Fare:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{selectedFare ? selectedFare.standardFare : '—'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>RidePass Discount:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedFare && selectedFare.discount > 0 ? `- ₹${selectedFare.discount}` : '₹0'}
                  </span>
                </div>

                {selectedFare && selectedFare.excessFare > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Excess Fare over ₹{activeSub?.planSnapshot?.maxFarePerRide} cap:</span>
                    <span>+ ₹{selectedFare.excessFare}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Payable:</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{selectedFare ? selectedFare.finalFare : '—'}
                  </span>
                </div>
              </div>

              {/* Booking CTA */}
              {isAuthenticated ? (
                <Button
                  variant={selectedFare?.finalFare === 0 ? 'success' : 'primary'}
                  size="lg"
                  loading={bookingLoading}
                  onClick={handleBookRide}
                  className="w-full text-base font-bold shadow-md cursor-pointer"
                >
                  {selectedFare?.finalFare === 0
                    ? 'Confirm Ride with RidePass (₹0)'
                    : `Confirm & Book Ride (₹${selectedFare?.finalFare || 0})`}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/login?redirect=/book')}
                  className="w-full text-base font-bold shadow-md cursor-pointer"
                >
                  Sign In to Book This Ride
                </Button>
              )}

              <div className="text-[11px] text-slate-500 text-center space-y-1">
                <p>• Zero cancellation fee within 5 minutes of booking.</p>
                <p>• Verified drivers equipped with sanitized helmets and vehicles.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
