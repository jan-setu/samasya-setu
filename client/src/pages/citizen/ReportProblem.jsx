import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { JHARKHAND_DISTRICTS, DISTRICT_COORDINATES } from '../../utils/districts';
import { VoiceInput } from '../../components/VoiceInput';
import { MapView } from '../../components/MapView';
import {
  Camera,
  MapPin,
  Sparkles,
  FileText,
  Upload,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Image as ImageIcon
} from 'lucide-react';

export function ReportProblem() {
  const navigate = useNavigate();
  const { t, currentLangObj } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('Ranchi');
  const [lat, setLat] = useState(23.3441);
  const [lng, setLng] = useState(85.3096);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mediaList, setMediaList] = useState([]);

  // Auto capture GPS
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setError('Could not fetch exact GPS coordinates. Using district center.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDistrictChange = (e) => {
    const d = e.target.value;
    setDistrict(d);
    if (DISTRICT_COORDINATES[d]) {
      setLat(DISTRICT_COORDINATES[d].lat);
      setLng(DISTRICT_COORDINATES[d].lng);
    }
  };

  const handleVoiceTranscript = (text) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaList((prev) => [
          ...prev,
          {
            url: reader.result,
            type: file.type.startsWith('video') ? 'video' : 'photo',
            caption: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please provide both a title and description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/problems', {
        title,
        raw_description: description,
        lat,
        lng,
        district,
        media: mediaList
      });

      navigate('/citizen/my-reports', {
        state: { newProblemId: res.data.problemId, showNotification: true }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit problem report');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('citizenPortalTag')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('reportNewProblem')}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {t('citizenPortalDesc')}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Core Problem Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {t('step1Title')}
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t('problemTitleLabel')}
            </label>
            <input
              type="text"
              required
              placeholder={t('problemTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full py-2.5 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('problemDescLabel')}
              </label>
              <VoiceInput onTranscript={handleVoiceTranscript} />
            </div>
            <textarea
              required
              rows={4}
              placeholder={t('problemDescPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 {t('aiPipelineInProgress')}
            </p>
          </div>
        </div>

        {/* Step 2: Location & GPS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              {t('step2Title')}
            </h2>
            <button
              type="button"
              onClick={handleGetGPS}
              disabled={isGettingLocation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              {isGettingLocation ? 'Capturing GPS...' : t('autoGps')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('districtLabel')}
              </label>
              <select
                value={district}
                onChange={handleDistrictChange}
                className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
                {JHARKHAND_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('latitude')}</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{t('longitude')}</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full py-2.5 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="mt-2">
            <MapView
              center={[lat, lng]}
              zoom={12}
              height="280px"
              selectedLocation={{ lat, lng }}
            />
          </div>
        </div>

        {/* Step 3: Photos / Videos / Evidence */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            {t('step3Title')}
          </h2>

          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">
                {t('uploadClickText')}
              </div>
              <p className="text-xs text-slate-500">{t('uploadFormatsText')}</p>
            </label>
          </div>

          {mediaList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {mediaList.map((m, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                  <img src={m.url} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-700"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded truncate max-w-[90%]">
                    {m.caption}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-extrabold text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{t('submitAndLaunchAI')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
