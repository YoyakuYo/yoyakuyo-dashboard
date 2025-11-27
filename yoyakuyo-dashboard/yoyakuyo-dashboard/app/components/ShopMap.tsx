"use client";
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ShopMapProps {
  latitude: number;
  longitude: number;
  shopName: string;
  address?: string;
  height?: string;
}

export default function ShopMap({ 
  latitude, 
  longitude, 
  shopName, 
  address,
  height = '400px' 
}: ShopMapProps) {
  // Only render on client side to avoid SSR issues
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate a unique ID for this component instance that persists across re-renders
  const instanceId = useMemo(() => `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    setIsClient(true);
    
    // Small delay to ensure container is ready and check for existing maps
    const timer = setTimeout(() => {
      if (containerRef.current) {
        // Check if container already has a Leaflet map instance
        const hasExistingMap = (containerRef.current as any)._leaflet_id !== undefined;
        if (!hasExistingMap) {
          setMapReady(true);
        } else {
          // If map exists, clean it up first
          const existingMap = (containerRef.current as any)._leaflet;
          if (existingMap) {
            existingMap.remove();
          }
          // Remove Leaflet data
          delete (containerRef.current as any)._leaflet_id;
          delete (containerRef.current as any)._leaflet;
          setMapReady(true);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      if (containerRef.current) {
        const map = (containerRef.current as any)._leaflet;
        if (map && typeof map.remove === 'function') {
          try {
            map.remove();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        delete (containerRef.current as any)._leaflet_id;
        delete (containerRef.current as any)._leaflet;
      }
    };
  }, []);

  if (!isClient || !mapReady) {
    return (
      <div 
        className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div 
        className="w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Location not available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden shadow-lg" 
      style={{ height }}
      id={instanceId}
    >
      <MapContainer
        key={instanceId}
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-gray-900 mb-1">{shopName}</h3>
              {address && <p className="text-sm text-gray-600">{address}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

