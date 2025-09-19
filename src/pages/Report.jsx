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

      let icon;
      switch (report.severity) {
        case 'Low':
          icon = L.divIcon({ className: 'custom-div-icon low-severity' });
          break;
        case 'Medium':
          icon = L.divIcon({ className: 'custom-div-icon medium-severity' });
          break;
        case 'High':
          icon = L.divIcon({ className: 'custom-div-icon high-severity' });
          break;
        case 'Critical':
          icon = L.divIcon({ className: 'custom-div-icon critical-severity' });
          break;
        default:
          icon = L.divIcon({ className: 'custom-div-icon default-severity' });
      }

      L.marker([report.lat, report.lng], { icon: icon }).addTo(mapInstance)
        .bindPopup(report.type)
        .openPopup();
    }
  }, [report, map]);

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

  return (
    <div className="container mx-auto p-4 max-w-2xl text-center">
      <div className="h-20"></div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-8 mb-4">
        Report Details
      </h1>
      
      <div className="bg-white/80 dark:bg-gray-900 p-8 rounded-xl shadow-lg space-y-4">
        <div ref={mapRef} style={{ height: "300px", width: "100%" }} className="rounded-lg shadow-md"></div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Report ID: </span>
          <span className="font-mono text-gray-900 dark:text-white break-all">{report.id}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Type: </span>
          <span className="text-gray-900 dark:text-white">{report.type}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Severity: </span>
          <span className="text-gray-900 dark:text-white">{report.severity}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Status: </span>
          <span className="text-gray-900 dark:text-white">{report.status}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Coordinates: </span>
          <span className="text-gray-900 dark:text-white">{report.lat?.toFixed(5)}, {report.lng?.toFixed(5)}</span>
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Description: </span>
          <p className="text-gray-900 dark:text-white mt-1">{report.desc}</p>
        </div>
        {report.imageUrl && (
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Photo:</span>
            <img src={report.imageUrl} alt="Issue photo" className="mt-2 rounded-lg object-cover w-full" />
          </div>
        )}
      </div>
    </div>
  );
}

export default Report;
