import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import eventService from '@/services/eventService';
import ticketService from '@/services/ticketService';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/context/ToastContext';
import { TicketIcon, ArrowRightIcon } from '@/components/common/Icons';

export default function TicketScannerPage() {
  const router = useRouter();
  const { id } = router.query;
  const { loading: authLoading } = useRequireAuth({ role: 'ORGANIZER' });
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [eventRes, summaryRes] = await Promise.all([
        eventService.getEventDetails(id).catch(() => null),
        ticketService.getCheckinSummary(id).catch(() => null),
      ]);

      if (eventRes) {
        setEvent(eventRes.event || eventRes);
      }
      if (summaryRes) {
        setSummary(summaryRes);
      }
    } catch {
      showToast("Impossible de charger les données de l'événement", 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    if (!authLoading) {
      queueMicrotask(() => loadData());
    }
  }, [authLoading, loadData]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("L'accès à la caméra n'est pas supporté par ce navigateur", 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      showToast('Impossible d’accéder à la caméra : ' + err.message, 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleValidateTicket = async (codeToScan) => {
    const code = (codeToScan || manualCode).trim();
    if (!code) {
      showToast('Veuillez renseigner un code de billet', 'error');
      return;
    }

    setScanning(true);
    try {
      const res = await ticketService.scanTicket({
        ticketCode: code,
        eventId: Number(id),
      });

      const result = {
        success: true,
        type: 'VALID',
        message: 'ENTRÉE VALIDÉE',
        participant: res.checkin?.participant_name || 'Participant',
        email: res.checkin?.participant_email || '',
        ticketCode: code,
        time: new Date().toLocaleTimeString(),
      };

      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
      setManualCode('');
      showToast(`Billet validé : ${result.participant}`, 'success');

      // Refresh checkin count
      const updatedSummary = await ticketService.getCheckinSummary(id).catch(() => null);
      if (updatedSummary) setSummary(updatedSummary);
    } catch (err) {
      const isAlreadyUsed = err.status === 409 || err.message?.includes('deja utilise');
      const isCancelled = err.status === 410 || err.message?.includes('annule');

      const result = {
        success: false,
        type: isAlreadyUsed ? 'ALREADY_USED' : isCancelled ? 'CANCELLED' : 'INVALID',
        message: isAlreadyUsed ? 'BILLET DÉJÀ UTILISÉ' : isCancelled ? 'BILLET ANNULÉ' : 'BILLET INVALIDE',
        detail: err.message || 'Code introuvable pour cet événement',
        ticketCode: code,
        time: new Date().toLocaleTimeString(),
      };

      setLastScanResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 9)]);
      showToast(result.message + ' : ' + (result.detail || ''), 'error');
    } finally {
      setScanning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-1/3" />
        <div className="h-48 bg-zinc-800 rounded-md" />
      </div>
    );
  }

  const scannedCount = summary?.scannedTickets ?? 0;
  const totalCount = summary?.totalTickets ?? 0;
  const rate = summary?.attendanceRate ?? 0;

  return (
    <>
      <Head>
        <title>Scanner d&apos;Entrées - {event?.title || 'Événement'} - MyTicket</title>
      </Head>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/organizer/events/${id}/reservations`}
            className="eyebrow text-zinc-400 hover:text-white transition-colors"
          >
            ← Retour aux réservations
          </Link>
          <span className="eyebrow text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-sm">
            Mode Contrôle d&apos;Accès
          </span>
        </div>

        {/* Event Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">{event?.title || 'Événement'}</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {event?.venue && `📍 ${event.venue} — `}
            {event?.event_date && new Date(event.event_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* Stats Bar */}
          <div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="spec-label block">Billets émis</span>
              <span className="text-2xl font-bold text-white">{totalCount}</span>
            </div>
            <div>
              <span className="spec-label block">Scannés / Entrés</span>
              <span className="text-2xl font-bold text-emerald-400">{scannedCount}</span>
            </div>
            <div>
              <span className="spec-label block">Taux de présence</span>
              <span className="text-2xl font-bold text-indigo-400">{rate} %</span>
            </div>
          </div>

          <div className="w-full bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, rate)}%` }}
            />
          </div>
        </div>

        {/* Big Alert Banner on Scan */}
        {lastScanResult && (
          <div
            className={`p-6 rounded-md border text-center transition-all ${
              lastScanResult.success
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
            }`}
          >
            <div className="text-4xl mb-2">{lastScanResult.success ? '✅' : '🚫'}</div>
            <h2 className="text-2xl font-bold uppercase tracking-wider">{lastScanResult.message}</h2>
            {lastScanResult.participant && (
              <p className="text-lg font-semibold text-white mt-1">
                Participant : {lastScanResult.participant}
              </p>
            )}
            {lastScanResult.detail && (
              <p className="text-sm mt-1 opacity-90">{lastScanResult.detail}</p>
            )}
            <p className="text-xs font-mono opacity-70 mt-2">
              Code : {lastScanResult.ticketCode} — {lastScanResult.time}
            </p>
          </div>
        )}

        {/* Camera / Manual Verification Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 space-y-6">
          <h2 className="eyebrow text-indigo-400">Scanner un billet</h2>

          {/* Camera View */}
          <div className="relative rounded-md overflow-hidden bg-black aspect-video flex items-center justify-center border border-zinc-800">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {!cameraActive && (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-2xl">
                  📷
                </div>
                <p className="text-sm text-zinc-400">
                  Activez la caméra de votre appareil pour scanner les QR codes des billets à l&apos;entrée.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-primary"
                >
                  Activer la caméra
                </button>
              </div>
            )}

            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-indigo-400/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <span className="text-xs text-indigo-200 bg-black/60 px-2 py-0.5 rounded">
                    Visez le QR Code
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-4 pointer-events-auto px-4 py-2 bg-zinc-900/90 text-zinc-300 hover:text-white rounded-md text-xs font-semibold border border-zinc-700"
                >
                  Arrêter la caméra
                </button>
              </div>
            )}
          </div>

          {/* Manual Input Form */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <label className="spec-label block">Saisie manuelle du code de billet (UUID)</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidateTicket();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
                className="flex-1 px-4 py-3 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={scanning || !manualCode.trim()}
                className="btn-primary px-6 shrink-0"
              >
                {scanning ? 'Contrôle...' : 'Valider'}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6 space-y-4">
            <h3 className="eyebrow text-zinc-400">Dernières entrées scannées lors de cette session</h3>
            <div className="divide-y divide-zinc-800 text-sm">
              {scanHistory.map((scan, index) => (
                <div key={index} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>{scan.success ? '🟢' : '🔴'}</span>
                    <div>
                      <span className="font-semibold text-white">
                        {scan.participant || scan.message}
                      </span>
                      <span className="block text-xs font-mono text-zinc-500">
                        {scan.ticketCode.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{scan.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
