import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, CheckCircle, AlertTriangle, Sprout, MapPin, ChevronRight, X, Loader2, Leaf } from 'lucide-react';
import { analyzeRiceImage } from './services/geminiService';
import { Diagnosis, PestReport, AppView } from './types';
import NavBar from './components/NavBar';
import PestMap from './components/PestMap';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reports, setReports] = useState<PestReport[]>(() => {
    const saved = localStorage.getItem('briliant_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Geolocation & Notification Permissions
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Error getting location", error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    // Request Notification Permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Save reports to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('briliant_reports', JSON.stringify(reports));
  }, [reports]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setDiagnosis(null);
        handleAnalyze(base64);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (fullBase64: string) => {
    setIsAnalyzing(true);
    try {
      // Strip prefix "data:image/jpeg;base64,"
      const base64Data = fullBase64.split(',')[1];
      const result = await analyzeRiceImage(base64Data);
      setDiagnosis(result);

      // Trigger Notification for High Danger
      if (result.isHama && result.tingkatBahaya === 'Tinggi') {
        const title = "PERINGATAN BAHAYA! 🚨";
        const body = `Terdeteksi serangan ${result.nama} dengan tingkat TINGGI. Segera lakukan tindakan pengendalian!`;

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, { body });
          } catch (e) {
            // Fallback if notification fails (e.g. mobile limitations)
            setTimeout(() => alert(`${title}\n\n${body}`), 500);
          }
        } else {
          // Fallback to alert
          setTimeout(() => alert(`${title}\n\n${body}`), 500);
        }
      }

    } catch (error) {
      alert("Gagal menganalisis gambar. Pastikan koneksi internet lancar dan coba lagi.");
      console.error(error);
      setSelectedImage(null); // Reset on error so user can try again
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = () => {
    if (!diagnosis || !selectedImage) return;
    
    // Fallback location if GPS failed (e.g., Jakarta center) or prompt user
    const locationToSave = userLocation || { lat: -6.200000, lng: 106.816666 };
    
    if (!userLocation) {
       alert("Lokasi GPS belum terdeteksi. Menggunakan lokasi default. Pastikan izin lokasi aktif.");
    }

    const newReport: PestReport = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      latitude: locationToSave.lat,
      longitude: locationToSave.lng,
      imageUrl: selectedImage,
      diagnosis: diagnosis
    };

    setReports(prev => [newReport, ...prev]);
    alert("Laporan berhasil disimpan ke peta!");
    setCurrentView('map');
    setSelectedImage(null);
    setDiagnosis(null);
  };

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 space-y-8 pb-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse opacity-50"></div>
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 w-24 h-24 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
            <Sprout size={48} className="text-white" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Briliant</h1>
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3 bg-green-50 inline-block px-3 py-1 rounded-full border border-green-100">
            Brigade Perlindungan Tanaman
          </p>
          <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
            Asisten cerdas perlindungan tanaman. Deteksi hama dini untuk panen yang melimpah.
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => setCurrentView('scan')}
          className="group w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
            <Camera size={24} />
          </div>
          <span className="text-lg">Periksa Tanaman</span>
          <ChevronRight size={20} className="opacity-70 group-hover:translate-x-1 transition-transform" />
        </button>
        
        <button
          onClick={() => setCurrentView('map')}
          className="w-full bg-white border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
        >
          <MapPin size={24} className="text-blue-500" />
          <span>Peta Sebaran Hama</span>
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl w-full max-w-sm border border-blue-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg shrink-0">
             <AlertTriangle size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Info Terkini</h3>
            <p className="text-blue-700 text-xs mt-1 leading-relaxed">
              Waspada peningkatan serangan hama di musim peralihan. Periksa kondisi daun dan batang tanaman Anda secara rutin.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <p className="text-[10px] text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          Didukung oleh Briliant AI v2.0-2025 @nasriaw
        </p>
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="flex flex-col h-full px-4 pt-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 px-1">Deteksi Hama</h2>
      
      {!selectedImage ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl bg-gray-50/50 p-8 space-y-8 hover:bg-gray-50 transition-colors">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Camera size={40} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ambil Foto Tanaman</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-[200px] mx-auto">
                Pastikan foto jelas dan fokus pada bagian yang sakit
              </p>
            </div>
          </div>
          
          <div className="w-full max-w-xs space-y-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Camera size={20} />
              Buka Kamera / Galeri
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg mb-6 max-h-72 border-4 border-white bg-gray-100">
             <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
             <button 
               onClick={() => { setSelectedImage(null); setDiagnosis(null); setIsAnalyzing(false); }}
               className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 backdrop-blur-sm transition-colors"
             >
               <X size={20} />
             </button>
             {isAnalyzing && (
               <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                 <Loader2 size={48} className="animate-spin mb-3" />
                 <p className="font-bold text-lg">Menganalisis...</p>
                 <p className="text-xs opacity-80">Briliant AI sedang bekerja</p>
               </div>
             )}
          </div>

          {!isAnalyzing && diagnosis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-6 rounded-2xl border-l-8 shadow-sm ${diagnosis.isHama ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        diagnosis.isHama ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                      }`}>
                        {diagnosis.isHama ? 'Hama / Penyakit' : 'Sehat'}
                      </span>
                      {diagnosis.isHama && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-200 text-orange-800">
                          {diagnosis.tingkatBahaya}
                        </span>
                      )}
                    </div>
                    <h2 className={`text-2xl font-extrabold leading-tight ${diagnosis.isHama ? 'text-red-900' : 'text-green-900'}`}>
                      {diagnosis.nama}
                    </h2>
                    <p className="text-sm font-serif italic text-gray-600 mt-1">{diagnosis.namaLatin}</p>
                  </div>
                  <div className={`p-3 rounded-full shrink-0 ${diagnosis.isHama ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {diagnosis.isHama ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}
                  </div>
                </div>
              </div>

              {diagnosis.isHama ? (
                <>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                        <span className="text-xs font-black">1</span>
                      </div>
                      Gejala Klinis
                    </h3>
                    <ul className="space-y-2">
                      {diagnosis.gejala.map((g, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0"></span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                           <span className="text-xs font-black">2</span>
                        </div>
                        Solusi & Pengobatan
                      </h3>
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        <Leaf size={12} className="text-green-600" />
                        <span className="text-[10px] font-medium text-green-700">Ramah Lingkungan</span>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {diagnosis.solusi.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100 items-start">
                           <CheckCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                           <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                         <span className="text-xs font-black">3</span>
                      </div>
                      Pencegahan
                    </h3>
                    <ul className="space-y-2">
                      {diagnosis.pencegahan.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-gray-700 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                  <h3 className="font-bold text-green-800 text-lg mb-2">Tanaman Sehat!</h3>
                  <p className="text-green-700 text-sm">
                    Pertahankan kondisi ini. Jangan lupa untuk tetap memantau kelembaban tanah dan pemberian pupuk yang berimbang.
                  </p>
                </div>
              )}

              <button
                onClick={handleSaveReport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
              >
                <MapPin size={20} />
                Lapor & Simpan Lokasi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderMap = () => (
    <div className="h-full w-full relative">
       <PestMap reports={reports} userLocation={userLocation} />
       {/* Map Controls / Overlay could go here */}
       {!userLocation && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-full text-xs font-semibold z-[1000] shadow-md flex items-center gap-2">
            <AlertTriangle size={14} /> GPS non-aktif
          </div>
       )}
    </div>
  );

  const renderHistory = () => (
    <div className="px-4 pt-6 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Riwayat Laporan</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
          {reports.length} Laporan
        </span>
      </div>
      
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center text-gray-400">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ClipboardList size={40} className="opacity-40" />
          </div>
          <p className="font-medium">Belum ada laporan tersimpan.</p>
          <p className="text-sm mt-1 max-w-[200px]">Lakukan scan tanaman untuk mulai mendata hama.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 transition-transform active:scale-[0.99]">
              <div className="w-24 h-24 flex-shrink-0">
                <img src={report.imageUrl} className="w-full h-full object-cover rounded-xl bg-gray-200" alt="Thumbnail" />
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate pr-2 text-base">{report.diagnosis.nama}</h3>
                </div>
                
                <p className="text-xs text-gray-500 italic mb-2 truncate">{report.diagnosis.namaLatin}</p>
                
                <div className="flex flex-wrap items-center gap-2 mb-2">
                   {report.diagnosis.isHama ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                         report.diagnosis.tingkatBahaya === 'Tinggi' ? 'bg-red-100 text-red-700' :
                         report.diagnosis.tingkatBahaya === 'Sedang' ? 'bg-orange-100 text-orange-700' :
                         'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.diagnosis.tingkatBahaya}
                      </span>
                   ) : (
                     <span className="inline-flex items-center bg-green-100 text-green-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded">Sehat</span>
                   )}
                   <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <MapPin size={10} />
                      {new Date(report.timestamp).toLocaleDateString('id-ID')}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Helper icon for empty state
  const ClipboardList = ({size, className}: {size: number, className?: string}) => (
     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sprout className="text-white" size={20} />
          </div>
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">Briliant</span>
        </div>
        <div className={`text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold transition-colors ${userLocation ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {userLocation ? (
            <><MapPin size={12} className="text-green-600" /> GPS Aktif</>
          ) : (
            <><MapPin size={12} className="text-red-600" /> No GPS</>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {currentView === 'home' && renderHome()}
        {currentView === 'scan' && renderScan()}
        {currentView === 'map' && renderMap()}
        {currentView === 'history' && renderHistory()}
      </main>

      {/* Navigation */}
      <NavBar currentView={currentView} setView={setCurrentView} />
    </div>
  );
}

export default App;