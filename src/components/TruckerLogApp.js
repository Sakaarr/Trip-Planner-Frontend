import polyline from "@mapbox/polyline";
import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Truck,
  Clock,
  FileText,
  Route,
  Calendar,
  Fuel,
  Navigation,
  Map as MapIcon,
} from "lucide-react";
import api from "../services/api";
import jsPDF from "jspdf";
import "jspdf-autotable";



function TruckerLogApp() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  const handleTripResult = (data) => {
    setTripData(data);
    setActiveTab("results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-3 rounded-xl">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  TruckerLog Pro
                </h1>
                <p className="text-blue-200">
                  Professional Daily Log Management
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("form")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === "form"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Plan Trip
              </button>
              {tripData && (
                <>
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      activeTab === "map"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    Route Map
                  </button>
                  <button
                    onClick={() => setActiveTab("results")}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      activeTab === "results"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    View Results
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === "form" && (
          <TripForm
            onResult={handleTripResult}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {activeTab === "map" && tripData && <RouteMap data={tripData} />}

        {activeTab === "results" && tripData && <TripResults data={tripData} />}
      </div>
    </div>
  );
}

function RouteMap({ data }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS and JS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
    script.onload = initializeMap;
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    const coords = data.coordinates;

    // Initialize map
    const map = window.L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add tile layer (OpenStreetMap)
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    // Custom icons
    const currentLocationIcon = window.L.divIcon({
      html: `<div style="background: #3b82f6; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: "custom-div-icon",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const pickupIcon = window.L.divIcon({
      html: `<div style="background: #10b981; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 12px; font-weight: bold;">P</div></div>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const dropoffIcon = window.L.divIcon({
      html: `<div style="background: #ef4444; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 12px; font-weight: bold;">D</div></div>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const fuelIcon = window.L.divIcon({
      html: `<div style="background: #f59e0b; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 10px; font-weight: bold;">F</div></div>`,
      className: "custom-div-icon",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add markers
    const currentMarker = window.L.marker(coords.current_location, {
      icon: currentLocationIcon,
    })
      .bindPopup(
        `
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">Current Location</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Starting point of journey</p>
        </div>
      `
      )
      .addTo(map);

    const pickupMarker = window.L.marker(coords.pickup_location, {
      icon: pickupIcon,
    })
      .bindPopup(
        `
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">Pickup Location</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">${data.from}</p>
        </div>
      `
      )
      .addTo(map);

    const dropoffMarker = window.L.marker(coords.dropoff_location, {
      icon: dropoffIcon,
    })
      .bindPopup(
        `
        <div style="font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">Drop-off Location</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">${data.to}</p>
        </div>
      `
      )
      .addTo(map);

    // Add fuel stops
    coords.fuel_stop_coords.forEach((fuelCoord, index) => {
  window.L.marker(fuelCoord, { icon: fuelIcon })
    .bindPopup(`
      <div style="font-family: sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">Fuel Stop ${index + 1}</h3>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Mandatory 30-minute rest + refuel
        </p>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">
          FMCSA break: off-duty before 8 hours of driving
        </p>
      </div>
    `)
    .addTo(map);
});

    // Create route line
    let routePolyline = null;

    if (coords.route_geometry_encoded) {
      const decoded = polyline.decode(coords.route_geometry_encoded); // [[lat, lng], [lat, lng], ...]

      routePolyline = window.L.polyline(decoded, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.9,
      }).addTo(map);
    }

    const group = new window.L.featureGroup([
      currentMarker,
      pickupMarker,
      dropoffMarker,
      ...coords.fuel_stop_coords.map((coord) => window.L.marker(coord)),
      ...(routePolyline ? [routePolyline] : []),
    ]);

    map.fitBounds(group.getBounds().pad(0.1));

    mapInstanceRef.current = map;
  };

  return (
    <div className="space-y-8">
      {/* Map Container */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 p-8">
          <div className="flex items-center space-x-3">
            <MapIcon className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Route Overview
              </h2>
              <p className="text-blue-100">
                Interactive map showing your complete journey
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div
            ref={mapRef}
            className="w-full h-96 rounded-2xl border-4 border-white/20 shadow-lg"
            style={{ minHeight: "400px" }}
          />
        </div>
      </div>

      {/* Route Information */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Trip Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Navigation className="h-6 w-6 mr-3 text-blue-400" />
            Journey Details
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-white/70">Total Distance</span>
              <span className="text-white font-bold text-lg">
                {data.total_distance_miles.toLocaleString()} miles
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-white/70">Estimated Duration</span>
              <span className="text-white font-bold text-lg">
                {data.estimated_days} days
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-white/70">Fuel Stops Required</span>
              <span className="text-white font-bold text-lg">
                {data.fuel_stops}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-white/70">Total Driving Hours</span>
              <span className="text-white font-bold text-lg">
                {data.log_sheets.reduce(
                  (sum, log) => sum + log.driving_hours,
                  0
                )}
                h
              </span>
            </div>
          </div>
        </div>

        {/* Stop Information */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <MapPin className="h-6 w-6 mr-3 text-green-400" />
            Key Stops
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-white font-medium">Current Location</span>
              </div>
              <p className="text-white/70 text-sm">Starting point of journey</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white font-medium">Pickup</span>
              </div>
              <p className="text-white/70 text-sm">{data.pickup}</p>
            </div>

            {data.coordinates.fuel_stop_coords.map((_, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-white font-medium">
                    Fuel Stop {index + 1}
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  Mandatory rest and refuel
                </p>
              </div>
            ))}

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-white font-medium">Drop-off</span>
              </div>
              <p className="text-white/70 text-sm">{data.to}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Map Legend</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
            <span className="text-white text-sm">Current Location</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="text-white text-sm">Pickup Point</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="text-white text-sm">Fuel Stop</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="text-white text-sm">Drop-off Point</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-1 bg-blue-500"
              style={{ borderStyle: "dashed", borderWidth: "2px 0" }}
            ></div>
            <span className="text-white text-sm">Planned Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripForm({ onResult, loading, setLoading }) {
  const [form, setForm] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_hours: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !form.current_location ||
      !form.pickup_location ||
      !form.dropoff_location ||
      !form.current_cycle_hours
    ) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/trips/", form);
      onResult(res.data);
    } catch (err) {
      console.error("API Error:", err);
      alert("Error: Check your backend is running and API is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Plan Your Route
          </h2>
          <p className="text-blue-100">
            Enter trip details to generate compliant daily logs
          </p>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                icon={<MapPin className="h-5 w-5" />}
                label="Current Location"
                name="current_location"
                value={form.current_location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
              />

              <FormField
                icon={<Route className="h-5 w-5" />}
                label="Pickup Location"
                name="pickup_location"
                value={form.pickup_location}
                onChange={handleChange}
                placeholder="e.g., Denver, CO"
              />

              <FormField
                icon={<MapPin className="h-5 w-5" />}
                label="Drop-off Location"
                name="dropoff_location"
                value={form.dropoff_location}
                onChange={handleChange}
                placeholder="e.g., New York, NY"
              />

              <FormField
                icon={<Clock className="h-5 w-5" />}
                label="Current Cycle Hours"
                name="current_cycle_hours"
                type="number"
                step="0.1"
                value={form.current_cycle_hours}
                onChange={handleChange}
                placeholder="32.5"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Planning Route...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Route className="h-5 w-5" />
                    <span>Generate Trip Plan</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  step,
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-white font-medium">
        <span className="text-blue-300">{icon}</span>
        <span>{label}</span>
      </label>
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
        required
      />
    </div>
  );
}


function TripResults({ data }) {
  const [activeView, setActiveView] = useState("overview");

  function downloadPDF() {
    try {
      // More detailed validation
      if (!data) {
        throw new Error('No data provided');
      }
      
      if (!data.log_sheets || !Array.isArray(data.log_sheets)) {
        throw new Error('Invalid log sheets data');
      }

      if (data.log_sheets.length === 0) {
        throw new Error('No log entries to export');
      }

      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        throw new Error('PDF library not loaded. Please refresh the page and try again.');
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 30;

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text("Trucker Hours of Service Log", pageWidth / 2, yPosition, { align: 'center' });
      
      // Add current date
      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const currentDate = new Date().toLocaleDateString();
      doc.text(`Generated: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      // Trip information
      if (data.from && data.to) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Trip Information", margin, yPosition);
        yPosition += 10;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Route: ${String(data.from)} → ${String(data.to)}`, margin, yPosition);
        yPosition += 8;
        
        if (data.total_distance_miles) {
          doc.text(`Total Distance: ${String(data.total_distance_miles.toLocaleString())} miles`, margin, yPosition);
          yPosition += 8;
        }
        
        if (data.estimated_days) {
          doc.text(`Estimated Days: ${String(data.estimated_days)}`, margin, yPosition);
          yPosition += 8;
        }
        
        yPosition += 10;
      }

      // Summary section if available
      if (data.driver_name || data.truck_number) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Driver Information", margin, yPosition);
        yPosition += 10;
        
        doc.setFont(undefined, 'normal');
        if (data.driver_name) {
          doc.text(`Driver: ${String(data.driver_name)}`, margin, yPosition);
          yPosition += 8;
        }
        if (data.truck_number) {
          doc.text(`Truck: ${String(data.truck_number)}`, margin, yPosition);
          yPosition += 8;
        }
        yPosition += 10;
      }

      // Table headers
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Daily Log Entries", margin, yPosition);
      yPosition += 15;

      // Table header row
      doc.setFontSize(10);
      const headers = ['Day', 'Driving Hours', 'Other Duty Hours', 'Rest Hours', 'Total Hours'];
      const colWidths = [30, 35, 35, 30, 30];
      let xPosition = margin;

      // Draw header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F');

      headers.forEach((header, index) => {
        doc.text(header, xPosition + colWidths[index] / 2, yPosition + 3, { align: 'center' });
        xPosition += colWidths[index];
      });

      yPosition += 15;

      // Table data
      doc.setFont(undefined, 'normal');
      data.log_sheets.forEach((log, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }

        xPosition = margin;
        const drivingHours = parseFloat(log.driving_hours) || 0;
        const otherDuty = parseFloat(log.other_duty) || 0;
        const restHours = parseFloat(log.rest) || 0;
        const totalHours = drivingHours + otherDuty + restHours;

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 10, 'F');
        }

        const rowData = [
          String(log.day || `Day ${index + 1}`),
          `${drivingHours}h`,
          `${otherDuty}h`,
          `${restHours}h`,
          `${totalHours.toFixed(1)}h`
        ];

        rowData.forEach((cellData, cellIndex) => {
          doc.text(cellData, xPosition + colWidths[cellIndex] / 2, yPosition, { align: 'center' });
          xPosition += colWidths[cellIndex];
        });

        yPosition += 12;
      });

      // Summary totals
      if (data.log_sheets.length > 0) {
        yPosition += 10;
        doc.setFont(undefined, 'bold');
        doc.text("Weekly Totals:", margin, yPosition);
        yPosition += 10;

        const totals = data.log_sheets.reduce((acc, log) => {
          acc.driving += parseFloat(log.driving_hours) || 0;
          acc.duty += parseFloat(log.other_duty) || 0;
          acc.rest += parseFloat(log.rest) || 0;
          return acc;
        }, { driving: 0, duty: 0, rest: 0 });

        doc.setFont(undefined, 'normal');
        doc.text(`Total Driving: ${totals.driving.toFixed(1)} hours`, margin + 10, yPosition);
        yPosition += 8;
        doc.text(`Total Other Duty: ${totals.duty.toFixed(1)} hours`, margin + 10, yPosition);
        yPosition += 8;
        doc.text(`Total Rest: ${totals.rest.toFixed(1)} hours`, margin + 10, yPosition);
        yPosition += 15;
      }

      // HOS Warning section
      if (data.hos_warning) {
        // Check if we need a new page for warning
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 30;
        }

        // Warning box
        doc.setDrawColor(255, 0, 0);
        doc.setFillColor(255, 240, 240);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'FD');

        doc.setTextColor(255, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("⚠ HOS COMPLIANCE WARNING", margin + 5, yPosition + 5);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        // Split long warning text if needed
        const warningText = String(data.hos_warning);
        const warningLines = doc.splitTextToSize(warningText, pageWidth - 2 * margin - 10);
        doc.text(warningLines, margin + 5, yPosition + 15);
      }

      // Footer
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(`Page 1 of 1 - Generated on ${new Date().toLocaleString()}`, 
               pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const routeInfo = data.from && data.to ? `_${data.from.replace(/\s+/g, '')}_to_${data.to.replace(/\s+/g, '')}` : '';
      const filename = `trucker_log${routeInfo}_${timestamp}.pdf`;
      
      doc.save(filename);

      // Show success message
      console.log(`PDF saved as: ${filename}`);
      
      // Optional: Show user-friendly success notification
      if (typeof alert !== 'undefined') {
        alert(`PDF exported successfully as: ${filename}`);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to generate PDF. ';
      if (error.message.includes('jsPDF')) {
        errorMessage += 'PDF library not loaded properly.';
      } else if (error.message.includes('log sheets')) {
        errorMessage += 'Invalid log data format.';
      } else if (error.message.includes('No data')) {
        errorMessage += 'No trip data available to export.';
      } else {
        errorMessage += error.message || 'Please check your data and try again.';
      }
      
      if (typeof alert !== 'undefined') {
        alert(errorMessage);
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Trip Overview */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Trip Overview</h2>
          <p className="text-green-100">
            Route: {data.from} → {data.to}
          </p>
        </div>
        {data.hos_warning && (
          <div className="bg-red-500/90 text-white p-4 rounded-xl shadow-md mb-6">
            <h3 className="font-bold text-lg mb-1">⚠️ HOS Violation</h3>
            <p>{data.hos_warning}</p>
          </div>
        )}

        <div className="p-8">
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard
              icon={<Route className="h-8 w-8" />}
              label="Total Distance"
              value={`${data.total_distance_miles.toLocaleString()} mi`}
              color="blue"
            />
            <StatCard
              icon={<Calendar className="h-8 w-8" />}
              label="Estimated Days"
              value={data.estimated_days}
              color="green"
            />
            <StatCard
              icon={<Fuel className="h-8 w-8" />}
              label="Fuel Stops"
              value={data.fuel_stops}
              color="orange"
            />
            <StatCard
              icon={<Clock className="h-8 w-8" />}
              label="Total Driving"
              value={`${data.log_sheets
                .reduce((sum, log) => sum + log.driving_hours, 0)
                .toFixed(1)}h`}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setActiveView("overview")}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeView === "overview"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          Log Overview
        </button>
        <button
          onClick={() => setActiveView("detailed")}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeView === "detailed"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          Detailed Log Sheets
        </button>
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={downloadPDF}
          className="px-6 py-3 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-all font-medium"
        >
          📄 Export Log Sheet as PDF
        </button>
      </div>

      {activeView === "overview" && <LogOverview logs={data.log_sheets} />}
      {activeView === "detailed" && (
        <DetailedLogSheets logs={data.log_sheets} tripData={data} />
      )}
    </div>
  );
}
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div
        className={`bg-gradient-to-r ${colorClasses[color]} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-white/70 text-sm font-medium mb-1">{label}</h3>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  );
}

function LogOverview({ logs }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-500 p-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Daily Log Overview
        </h2>
        <p className="text-purple-100">
          Visual breakdown of duty status by day
        </p>
      </div>

      <div className="p-8 space-y-6">
        {logs.map((log, i) => (
          <LogBar key={i} log={log} />
        ))}
      </div>
    </div>
  );
}

function LogBar({ log }) {
  const total = 24;
  const drivingPercent = (log.driving_hours / total) * 100;
  const dutyPercent = (log.other_duty / total) * 100;
  const restPercent = (log.rest / total) * 100;
  const offPercent =
    ((total - log.driving_hours - log.other_duty - log.rest) / total) * 100;

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Day {log.day}</h3>
        <div className="text-white/70 text-sm">24 Hour Period</div>
      </div>

      <div className="h-8 bg-white/10 rounded-full overflow-hidden flex mb-4">
        {log.driving_hours > 0 && (
          <div
            className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${drivingPercent}%` }}
          >
            {log.driving_hours > 2 && `${log.driving_hours}h`}
          </div>
        )}
        {log.other_duty > 0 && (
          <div
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${dutyPercent}%` }}
          >
            {log.other_duty > 1 && `${log.other_duty}h`}
          </div>
        )}
        {log.rest > 0 && (
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${restPercent}%` }}
          >
            {log.rest > 2 && `${log.rest}h`}
          </div>
        )}
        {offPercent > 0 && (
          <div
            className="bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${offPercent}%` }}
          >
            {offPercent > 8 && "OFF"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded mx-auto mb-1"></div>
          <div className="text-white/70">Driving</div>
          <div className="text-white font-medium">{log.driving_hours}h</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded mx-auto mb-1"></div>
          <div className="text-white/70">On Duty</div>
          <div className="text-white font-medium">{log.other_duty}h</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded mx-auto mb-1"></div>
          <div className="text-white/70">Rest</div>
          <div className="text-white font-medium">{log.rest}h</div>
        </div>
        <div className="text-center">
          <div className="w-4 h-4 bg-gradient-to-r from-gray-500 to-gray-600 rounded mx-auto mb-1"></div>
          <div className="text-white/70">Off Duty</div>
          <div className="text-white font-medium">
            {(24 - log.driving_hours - log.other_duty - log.rest).toFixed(1)}h
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailedLogSheets({ logs, tripData }) {
  return (
    <div className="space-y-8">
      {logs.map((log, index) => (
        <DetailedLogSheet
          key={index}
          log={log}
          tripData={tripData}
          isLast={index === logs.length - 1}
        />
      ))}
    </div>
  );
}

function DetailedLogSheet({ log, tripData, isLast }) {
  const currentDate = new Date();
  const logDate = new Date(
    currentDate.getTime() + (log.day - 1) * 24 * 60 * 60 * 1000
  );

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">DRIVER'S DAILY LOG</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Date:</span>{" "}
                {logDate.toLocaleDateString()}
              </div>
              <div>
                <span className="text-gray-300">Day:</span> {log.day}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-300 mb-1">
              Original - File at home terminal
            </div>
            <div className="text-xs text-gray-300">
              Duplicate - Driver retains for seven consecutive days
            </div>
          </div>
        </div>
      </div>

      {/* Driver Info Section */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              From:
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-[24px] text-sm">
              {log.day === 1 ? tripData.from : "En route"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              To:
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-[24px] text-sm">
              {isLast ? tripData.to : "En route"}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Total Miles Today:
            </label>
            <div className="border-b border-gray-300 pb-1 min-h-[24px] text-sm">
              {Math.round(
                tripData.total_distance_miles / tripData.estimated_days
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-gray-800 mb-2">
            24-Hour Duty Status Graph
          </h3>
          <TimeGraph log={log} />
        </div>

        {/* Duty Status Legend */}
        <div className="grid grid-cols-4 gap-4 mb-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>1. Off Duty</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>2. Sleeper</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>3. Driving</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>4. On Duty</span>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Remarks
            </label>
            <div className="border border-gray-300 rounded p-2 min-h-[60px] bg-gray-50">
              <div className="text-sm text-gray-600">
                Day {log.day} - {log.driving_hours}h driving, {log.other_duty}h
                other duty, {log.rest}h rest
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Shipping Documents
            </label>
            <div className="border border-gray-300 rounded p-2 min-h-[40px] bg-gray-50"></div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Driver & Commodity
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                Driver's signature certifies that the above information is true
                and correct
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">24 Hour Period</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-gray-600">From: 12:00 AM</div>
                <div className="text-gray-600">To: 11:59 PM</div>
              </div>
              <div>
                <div className="text-gray-600">Consecutive:</div>
                <div className="text-gray-600">
                  {log.driving_hours + log.other_duty}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeGraph({ log }) {
  const segments = [];

  let currentHour = 0;

  // Driving (status 3)
  if (log.driving_hours > 0) {
    segments.push({
      start: currentHour,
      end: currentHour + log.driving_hours,
      status: 3,
    });
    currentHour += log.driving_hours;
  }

  // Other Duty (status 4)
  if (log.other_duty > 0) {
    segments.push({
      start: currentHour,
      end: currentHour + log.other_duty,
      status: 4,
    });
    currentHour += log.other_duty;
  }

  // Rest (status 2)
  if (log.rest > 0) {
    segments.push({
      start: currentHour,
      end: currentHour + log.rest,
      status: 2,
    });
    currentHour += log.rest;
  }

  // Remaining → Off Duty (status 1)
  if (currentHour < 24) {
    segments.push({ start: currentHour, end: 24, status: 1 });
  }

  const statusRows = [1, 2, 3, 4]; // Off, Sleeper, Driving, On

  const statusLabels = {
    1: "Off Duty",
    2: "Sleeper",
    3: "Driving",
    4: "On Duty",
  };

  const statusColors = {
    1: "bg-red-500",
    2: "bg-yellow-400",
    3: "bg-green-500",
    4: "bg-blue-500",
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      {/* Grid rows: One for each status */}
      <div className="space-y-4">
        {statusRows.map((status) => (
          <div
            key={status}
            className="relative h-6 border rounded border-gray-300 bg-gray-50"
          >
            {/* Label */}
            <span className="absolute left-1 -top-5 text-xs text-gray-500">
              {status}. {statusLabels[status]}
            </span>

            {/* Segments */}
            {segments
              .filter((seg) => seg.status === status)
              .map((seg, i) => (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 ${statusColors[status]}`}
                  style={{
                    left: `${(seg.start / 24) * 100}%`,
                    width: `${((seg.end - seg.start) / 24) * 100}%`,
                  }}
                  title={`${statusLabels[status]}: ${seg.start}:00 - ${seg.end}:00`}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Time Markers */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} className="text-center" style={{ width: "8.33%" }}>
            {i * 2}:00
          </div>
        ))}
      </div>
    </div>
  );
}

export default TruckerLogApp;
