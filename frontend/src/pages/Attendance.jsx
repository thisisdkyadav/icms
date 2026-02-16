import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { markAttendance } from '../services/api';
import { usePage } from '../contexts/PageContext';
import Card from '../components/Card';
import Toast from '../components/Toast';

function Attendance() {
    const [qrCode, setQrCode] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [useCamera, setUseCamera] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [scanning, setScanning] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [toast, setToast] = useState(null);
    const videoRef = useRef(null);
    const readerRef = useRef(null);
    const { setPage } = usePage();

    useEffect(() => {
        setPage('Scan Attendance', 'Point camera at QR code or enter manually');
    }, []);

    useEffect(() => {
        readerRef.current = new BrowserMultiFormatReader();
        getCameras();
        return () => { stopCamera(); if (readerRef.current) readerRef.current.reset(); };
    }, []);

    const getCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0 && !selectedCamera) setSelectedCamera(videoDevices[0].deviceId);
        } catch (err) { console.error('Failed to enumerate devices:', err); }
    };

    const startCamera = async (deviceId = selectedCamera) => {
        try {
            setCameraError(''); setUseCamera(true); setScanning(true); setResult(null);
            readerRef.current.decodeFromVideoDevice(deviceId || undefined, videoRef.current, (scanResult) => {
                if (scanResult) handleQRDetected(scanResult.getText());
            });
        } catch (err) { setCameraError(`Unable to access camera: ${err.message}`); setUseCamera(false); setScanning(false); }
    };

    const stopCamera = () => { if (readerRef.current) readerRef.current.reset(); setUseCamera(false); setScanning(false); };

    const switchCamera = (deviceId) => {
        setSelectedCamera(deviceId);
        if (useCamera) { stopCamera(); setTimeout(() => startCamera(deviceId), 100); }
    };

    const handleQRDetected = async (code) => {
        if (loading) return;
        setLoading(true); setScanning(false);
        if (readerRef.current) readerRef.current.reset();
        try { const response = await markAttendance(code); setResult({ success: true, data: response.data }); }
        catch (error) { setResult({ success: false, message: error.response?.data?.message || 'Failed' }); }
        finally { setLoading(false); }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault(); if (!qrCode.trim()) return;
        setLoading(true); setResult(null);
        try { const response = await markAttendance(qrCode.trim()); setResult({ success: true, data: response.data }); setQrCode(''); }
        catch (error) { setResult({ success: false, message: error.response?.data?.message || 'Failed' }); }
        finally { setLoading(false); }
    };

    const scanAgain = () => { setResult(null); startCamera(selectedCamera); };

    return (
        <div>
            <div className="scan-options">
                {!useCamera ? <button onClick={() => startCamera()} className="btn-primary">Start Scanning</button> : <button onClick={stopCamera} className="btn-danger">Stop Camera</button>}
                {cameras.length > 1 && (
                    <select value={selectedCamera} onChange={(e) => switchCamera(e.target.value)} className="camera-select">
                        {cameras.map((cam, i) => <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${i + 1}`}</option>)}
                    </select>
                )}
            </div>

            {cameraError && <div className="error-message">{cameraError}</div>}

            {useCamera && (
                <div className="camera-container">
                    <video ref={videoRef} style={{ width: '100%', display: 'block', background: '#000' }} />
                    <div className="camera-overlay"><div className={`scan-frame ${scanning ? 'scanning' : ''}`}></div></div>
                    {scanning && <div className="scan-status">Scanning for QR code...</div>}
                    {loading && <div className="scan-status">Processing...</div>}
                </div>
            )}

            {result && (
                <div className={`result-card ${result.success ? 'success' : 'error'}`}>
                    {result.success ? (
                        <>
                            <h3>{result.data.alreadyAttended ? 'Already Attended' : 'Attendance Marked'}</h3>
                            <p><strong>Name:</strong> {result.data.participant.name}</p>
                            <p><strong>Email:</strong> {result.data.participant.email}</p>
                            {result.data.participant.event && <p><strong>Event:</strong> {result.data.participant.event.name}</p>}
                        </>
                    ) : (<><h3>Error</h3><p>{result.message}</p></>)}
                    <button onClick={scanAgain} className="btn-secondary mt-4">Scan Another</button>
                </div>
            )}

            <Card title="Manual Entry" className="manual-entry">
                <form onSubmit={handleManualSubmit}>
                    <div className="form-group"><label>QR Code Value</label><input type="text" value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Paste QR code value..." /></div>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Mark Attendance'}</button>
                </form>
            </Card>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}

export default Attendance;
