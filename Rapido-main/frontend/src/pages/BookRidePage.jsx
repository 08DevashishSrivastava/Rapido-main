import React, { useState, useEffect } from 'react';
import { rideAPI, subscriptionAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
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
  XCircle
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
  const [pickup, setPickup] = useState('Connaught Place, New Delhi');
  const [destination, setDestination] = useState('Indira Gandhi International Airport (DEL)');
  const [selectedVehicle, setSelectedVehicle] = useState('car');
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

  // Fetch active subscription
  useEffect(() => {
    subscriptionAPI.getActiveSubscription()
      .then(res => setActiveSub(res.data.subscription))
      .catch(() => setActiveSub(null));
  }, []);

  // Calculate fare estimates on pickup/destination change
  const fetchEstimates = async () => {
    if (!pickup || !destination) return;
    setEstimating(true);
    setErrorMessage('');
    try {
      const res = await rideAPI.getFareEstimates(pickup, destination);
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
    setBookingLoading(true);
    setErrorMessage('');
    try {
      const res = await rideAPI.createRide({
        pickup,
        destination,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <Badge variant="blue" size="sm">RIDE ESTIMATOR & BOOKING</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Book a Ride with <span className="text-blue-500">RidePass Pro</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Instant driver dispatch with automatic RidePass discount applied at checkout.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Booking Tracker (if ride is in progress) */}
      {currentRide && (
        <Card className="border-blue-500/40 bg-slate-900/90 glow-blue">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                <h2 className="text-lg font-bold text-white">
                  Ride Status: <span className="capitalize text-blue-400">{currentRide.status}</span>
                </h2>
              </div>
              <Badge variant="blue" size="md">
                Ride ID #{currentRide._id.slice(-6)}
              </Badge>
            </div>

            {/* OTP Security Display for Passenger */}
            {['pending', 'accepted', 'arriving'].includes(currentRide.status) && (
              <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                    Trip Start Security Verification
                  </span>
                  <p className="text-xs text-slate-400">
                    Share this 4-digit OTP with your driver once they arrive to start the ride.
                  </p>
                </div>
                <div className="px-5 py-2.5 bg-slate-950 border border-blue-500/50 rounded-xl text-center">
                  <span className="text-2xl font-black tracking-widest text-emerald-400">
                    {currentRide.otp}
                  </span>
                </div>
              </div>
            )}

            {/* Status explanation */}
            {currentRide.status === 'pending' && (
              <div className="p-4 bg-slate-950/60 rounded-xl text-xs text-slate-300 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                <span>Searching for available verified drivers near your pickup location...</span>
              </div>
            )}

            {currentRide.status === 'accepted' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">A driver has accepted your ride!</span>
                  <span>Driver is en route to pickup. Please be ready at {currentRide.pickup}.</span>
                </div>
              </div>
            )}

            {currentRide.status === 'arriving' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Your driver has arrived at the pickup location. Share your OTP to begin trip.</span>
              </div>
            )}

            {currentRide.status === 'ongoing' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Trip in progress. Destination: {currentRide.destination}. Have a safe journey!</span>
              </div>
            )}

            {currentRide.status === 'completed' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Trip Completed!</span>
                    <span>Total Fare: ₹{currentRide.finalFare} (RidePass Saved: ₹{currentRide.ridePassDiscount})</span>
                  </div>
                </div>

                {!rated ? (
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-white block">Rate your ride experience:</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStarRating(s)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-6 h-6 ${s <= starRating ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add an optional review..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                    <Button size="sm" onClick={handleRateRide} loading={ratingLoading}>
                      Submit Review
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400">Thank you for rating your ride!</div>
                )}
              </div>
            )}

            {currentRide.status === 'cancelled' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <span className="font-bold block">Ride Cancelled ({currentRide.cancelledBy || 'System'})</span>
                  <span>{currentRide.cancelReason || 'Cancelled'}. Any RidePass allowance was safely reversed to your account.</span>
                </div>
              </div>
            )}

            {/* Cancellation button */}
            {['pending', 'accepted'].includes(currentRide.status) && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCancelRide}
                  loading={cancelLoading}
                >
                  Cancel Ride
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Main Booking Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Route & Booking Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-500" />
                <span>Select Pickup & Drop-Off</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pickup Location</span>
                  </label>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup address"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>Destination Drop</span>
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Route Shortcuts */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Popular Delhi NCR Destinations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDestination(loc)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Category Selector */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Choose Vehicle Type</h3>
                {fareEstimates && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{fareEstimates.duration} mins • {fareEstimates.distance} km
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'motorcycle', name: 'Bike Taxi', icon: Bike, desc: 'Fastest in traffic' },
                  { id: 'auto', name: 'Auto Rickshaw', icon: Car, desc: 'Affordable & breezy' },
                  { id: 'car', name: 'Prime Cab', icon: Car, desc: 'AC Sedan / Hatchback' }
                ].map((item) => {
                  const Icon = item.icon;
                  const fareInfo = fareEstimates?.fares?.[item.id];
                  const isSelected = selectedVehicle === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedVehicle(item.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        {fareInfo?.ridePassEligible && (
                          <Badge variant="green" size="sm">
                            RidePass
                          </Badge>
                        )}
                      </div>

                      <div className="font-bold text-sm text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mb-3">{item.desc}</div>

                      <div className="pt-2 border-t border-slate-800/80">
                        {estimating ? (
                          <div className="h-5 bg-slate-800 rounded animate-pulse" />
                        ) : fareInfo ? (
                          <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-extrabold text-white">
                                ₹{fareInfo.finalFare}
                              </span>
                              {fareInfo.discount > 0 && (
                                <span className="text-xs text-slate-500 line-through">
                                  ₹{fareInfo.standardFare}
                                </span>
                              )}
                            </div>
                            {fareInfo.finalFare === 0 ? (
                              <span className="text-[10px] font-bold text-emerald-400">
                                100% Free with Pass
                              </span>
                            ) : fareInfo.discount > 0 ? (
                              <span className="text-[10px] text-emerald-400">
                                Saved ₹{fareInfo.discount} (Excess fare)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Standard Fare</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Calculating...</span>
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
              <h3 className="text-lg font-bold text-white">Fare Summary & Breakdown</h3>

              {/* RidePass Status Banner */}
              {activeSub ? (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">
                      {activeSub.planSnapshot?.name} Applied
                    </span>
                    <span className="text-emerald-400">
                      {activeSub.remainingRides} rides remaining (Cap ₹{activeSub.planSnapshot?.maxFarePerRide}/ride)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400">No active RidePass</span>
                  <a href="/plans" className="text-blue-400 hover:text-blue-300 font-semibold">
                    Get Pass & Save
                  </a>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Standard Estimated Fare:</span>
                  <span className="font-semibold text-white">
                    ₹{selectedFare ? selectedFare.standardFare : '—'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>RidePass Discount:</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedFare && selectedFare.discount > 0 ? `- ₹${selectedFare.discount}` : '₹0'}
                  </span>
                </div>

                {selectedFare && selectedFare.excessFare > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Excess Fare over ₹{activeSub?.planSnapshot?.maxFarePerRide} cap:</span>
                    <span className="font-bold">+ ₹{selectedFare.excessFare}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Amount to Pay:</span>
                  <span className="text-2xl font-black text-white">
                    ₹{selectedFare ? selectedFare.finalFare : '—'}
                  </span>
                </div>
              </div>

              {/* Booking CTA */}
              <Button
                variant={selectedFare?.finalFare === 0 ? 'success' : 'primary'}
                size="lg"
                loading={bookingLoading}
                onClick={handleBookRide}
                className="w-full text-base"
              >
                {selectedFare?.finalFare === 0 ? 'Confirm Ride with RidePass (₹0)' : `Confirm & Book Ride (₹${selectedFare?.finalFare || 0})`}
              </Button>

              <div className="text-[11px] text-slate-500 text-center space-y-1">
                <p>• Zero cancellation fee within 5 minutes of booking.</p>
                <p>• Verified drivers equipped with sanitized helmets and cabs.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
