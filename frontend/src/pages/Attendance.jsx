import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { markAttendance } from '../services/api';

function Attendance() {
    const [qrCode, setQrCode] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [useCamera, setUseCamera] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [scanning, setScanning] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const videoRef = useRef(null);
    const readerRef = useRef(null);

    useEffect(() => {
        readerRef.current = new BrowserMultiFormatReader();
        getCameras();

        return () => {
            stopCamera();
            if (readerRef.current) {
                readerRef.current.reset();
            }
        };
    }, []);

    const getCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoDevices);
            if (videoDevices.length > 0 && !selectedCamera) {
                setSelectedCamera(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error('Failed to enumerate devices:', err);
        }
    };

    const startCamera = async (deviceId = selectedCamera) => {
        try {
            setCameraError('');
            setUseCamera(true);
            setScanning(true);
            setResult(null);

            // Start continuous scanning
            readerRef.current.decodeFromVideoDevice(
                deviceId || undefined,
                videoRef.current,
                (scanResult, error) => {
                    if (scanResult) {
                        const code = scanResult.getText();
                        console.log('QR Code detected:', code);
                        handleQRDetected(code);
                    }
                    // Ignore errors (they happen when no QR is in frame)
                }
            );
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError(`Unable to access camera: ${err.message}`);
            setUseCamera(false);
            setScanning(false);
        }
    };

    const stopCamera = () => {
        if (readerRef.current) {
            readerRef.current.reset();
        }
        setUseCamera(false);
        setScanning(false);
    };

    const switchCamera = (deviceId) => {
        setSelectedCamera(deviceId);
        if (useCamera) {
            stopCamera();
            setTimeout(() => startCamera(deviceId), 100);
        }
    };

    const handleQRDetected = async (code) => {
        if (loading) return; // Prevent multiple submissions

        setLoading(true);
        setScanning(false);

        // Pause scanning while processing
        if (readerRef.current) {
            readerRef.current.reset();
        }

        try {
            const response = await markAttendance(code);
            setResult({
                success: true,
                data: response.data
            });
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to mark attendance'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!qrCode.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await markAttendance(qrCode.trim());
            setResult({
                success: true,
                data: response.data
            });
            setQrCode('');
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Failed to mark attendance'
            });
        } finally {
            setLoading(false);
        }
    };

    const scanAgain = () => {
        setResult(null);
        startCamera(selectedCamera);
    };

    return (
        <div className="attendance-page">
            <h1>Scan Attendance</h1>
            <p>Point camera at QR code to automatically scan and mark attendance.</p>

            <div className="scan-options">
                {!useCamera ? (
                    <button onClick={() => startCamera()} className="btn-primary">
                        📷 Start Scanning
                    </button>
                ) : (
                    <button onClick={stopCamera} className="btn-danger">
                        ✕ Stop Camera
                    </button>
                )}

                {cameras.length > 1 && (
                    <select
                        value={selectedCamera}
                        onChange={(e) => switchCamera(e.target.value)}
                        className="camera-select"
                    >
                        {cameras.map((camera, index) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                                {camera.label || `Camera ${index + 1}`}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {cameraError && <div className="error-message">{cameraError}</div>}

            {useCamera && (
                <div className="camera-container">
                    <video
                        ref={videoRef}
                        style={{ width: '100%', display: 'block', background: '#000' }}
                    />
                    <div className="camera-overlay">
                        <div className={`scan-frame ${scanning ? 'scanning' : ''}`}></div>
                    </div>
                    {scanning && <div className="scan-status">Scanning for QR code...</div>}
                    {loading && <div className="scan-status">Processing...</div>}
                </div>
            )}

            {result && (
                <div className={`result-card ${result.success ? 'success' : 'error'}`}>
                    {result.success ? (
                        <>
                            <h3>{result.data.alreadyAttended ? '⚠️ Already Attended' : '✓ Attendance Marked!'}</h3>
                            <p><strong>Name:</strong> {result.data.participant.name}</p>
                            <p><strong>Email:</strong> {result.data.participant.email}</p>
                            {result.data.participant.event && (
                                <p><strong>Event:</strong> {result.data.participant.event.name}</p>
                            )}
                        </>
                    ) : (
                        <>
                            <h3>✗ Error</h3>
                            <p>{result.message}</p>
                        </>
                    )}
                    <button onClick={scanAgain} className="btn-secondary" style={{ marginTop: '15px' }}>
                        Scan Another
                    </button>
                </div>
            )}

            <div className="manual-entry">
                <h3>Or Enter Manually</h3>
                <form onSubmit={handleManualSubmit} className="scan-form">
                    <div className="form-group">
                        <label>QR Code Value</label>
                        <input
                            type="text"
                            value={qrCode}
                            onChange={(e) => setQrCode(e.target.value)}
                            placeholder="Paste QR code value..."
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Processing...' : 'Mark Attendance'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Attendance;
