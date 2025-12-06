import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PestReport } from '../types';
import { MapPin, AlertTriangle } from 'lucide-react';

// Fix for default Leaflet icons in webpack/react environments
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for pests
const pestIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const healthyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PestMapProps {
  reports: PestReport[];
  userLocation: { lat: number; lng: number } | null;
}

// Helper to center map
const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const PestMap: React.FC<PestMapProps> = ({ reports, userLocation }) => {
  const defaultCenter: [number, number] = [-6.200000, 106.816666]; // Jakarta default
  const center = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultCenter;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && <RecenterAutomatically lat={userLocation.lat} lng={userLocation.lng} />}
        
        {/* User Location Marker */}
        {userLocation && (
           <Marker position={[userLocation.lat, userLocation.lng]} icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
           })}>
            <Popup>
              Lokasi Anda
            </Popup>
          </Marker>
        )}

        {/* Pest Reports */}
        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
            icon={report.diagnosis.isHama ? pestIcon : healthyIcon}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-gray-800">{report.diagnosis.nama}</h3>
                <p className="text-gray-600 text-xs mt-1">
                  {new Date(report.timestamp).toLocaleDateString('id-ID')}
                </p>
                {report.diagnosis.isHama && (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded mt-2">
                    Bahaya: {report.diagnosis.tingkatBahaya}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md z-[1000] text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Lokasi Anda</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Hama Terdeteksi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Tanaman Sehat</span>
        </div>
      </div>
    </div>
  );
};

export default PestMap;
