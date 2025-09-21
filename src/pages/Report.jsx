import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import NotFound from './NotFound';

import L from "leaflet";
// "leaflet/dist/leaflet.css" is now imported in App.jsx

function Report() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchReport = async () => {
      try {
        const docRef = doc(db, 'issues', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Error fetching document:", e);
        setError(true);
      }
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  useEffect(() => {
    if (report && !map) {
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }
      const mapInstance = L.map(mapRef.current, { dragging: true }).setView([report.lat, report.lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);
      setMap(mapInstance);

      // Define custom icons for each severity level using pin images
      const lowIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      const mediumIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      const highIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });

      const criticalIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      });
      
      let icon;
      switch (report.severity) {
        case 'Low':
          icon = lowIcon;
          break;
        case 'Medium':
          icon = mediumIcon;
          break;
        case 'High':
          icon = highIcon;
          break;
        case 'Critical':
          icon = criticalIcon;
          break;
        default:
          icon = lowIcon;
      }
      
      L.marker([report.lat, report.lng], { icon: icon }).addTo(mapInstance)
        .bindPopup(report.type)
        .openPopup();
    }
  }, [report, map]);

  const handleCopyUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy URL:', err);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error || !report) {
    return <NotFound />;
  }

  const timestamp = report.ts ? new Date(report.ts.toDate()).toLocaleString() : 'N/A';

  // Severity-based color classes
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low':
        return 'bg-green-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'High':
        return 'bg-red-500';
      case 'Critical':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl text-center">
      <div className="h-20"></div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-8 mb-4">
        Report Details
      </h1>
      
      <div className="bg-white/80 dark:bg-gray-900 p-8 rounded-xl shadow-lg space-y-6">
        <div ref={mapRef} style={{ height: "300px", width: "100%" }} className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Report ID:</span>
            <span className="font-mono text-gray-900 dark:text-white break-all">{report.id}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Share URL:</span>
            <button
              onClick={handleCopyUrl}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
            >
              Copy URL
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Type:</span>
            <span className="text-gray-900 dark:text-white">{report.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Severity:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getSeverityColor(report.severity)}`}>
              {report.severity}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>
            <span className="text-gray-900 dark:text-white">{report.status}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Reported On:</span>
            <span className="text-gray-900 dark:text-white">{timestamp}</span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Coordinates:</span>
            <span className="text-gray-900 dark:text-white">{report.lat?.toFixed(5)}, {report.lng?.toFixed(5)}</span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Description:</span>
            <p className="text-gray-900 dark:text-white mt-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
              {report.desc}
            </p>
          </div>
        </div>
        {report.imageUrl && (
          <div className="col-span-1 md:col-span-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Photo:</span>
            <img src={report.imageUrl} alt="Issue photo" className="mt-2 rounded-lg object-cover w-full shadow-md" />
          </div>
        )}
      </div>
    </div>
  );
}

export default Report;