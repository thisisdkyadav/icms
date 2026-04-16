import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { markAttendance, getEvents, searchParticipants } from '../services/api';
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
    const searchRef = useRef(null);
    const { setPage } = usePage();

    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [search, setSearch] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        setPage('Scan Attendance', 'Point camera at QR code or enter manually');
    }, []);

    useEffect(() => {
        readerRef.current = new BrowserMultiFormatReader();
        getCameras();
        return () => { stopCamera(); if (readerRef.current) readerRef.current.reset(); };
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
            const res = await getEvents();
            setEvents(res.data);
            } catch {
            console.error('Failed to load events');
            }
        };

        fetchEvents();
    }, []);


    useEffect(() => {
        if (!search || !selectedEvent) return;

        const delay = setTimeout(async () => {
            try {
            const res = await searchParticipants(selectedEvent, search);
            setSuggestions(res.data);
            } catch {
            setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [search, selectedEvent]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const handleManualSubmit = async () => {
        if (!selectedParticipant) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await markAttendance(selectedParticipant.qrCode);
            setResult({ success: true, data: response.data });
        } catch (error) {
            setResult({
            success: false,
            message: error.response?.data?.message || 'Failed'
            });
        } finally {
            setLoading(false);
        }
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
                            <h3>{result.data.alreadyAttended ? 'Already marked as attended' : 'Attendance Marked'}</h3>
                            <p><strong>Name:</strong> {result.data.participant.name}</p>
                            <p><strong>Email:</strong> {result.data.participant.email}</p>
                            {result.data.participant.event && (
                            <>
                                <p><strong>Event:</strong> {result.data.participant.event.name}</p>
                                <p><strong>Event Date:</strong>{" "}
                                {new Date(result.data.participant.event.date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                                </p>
                            </>
                            )}
                        </>
                    ) : (<><h3>Error</h3><p>{result.message}</p></>)}
                    <button onClick={scanAgain} className="btn-secondary mt-4">Scan Another</button>
                </div>
            )}

            <Card title="Manual Entry" className="manual-entry">
                <div className="form-group">
                    <label>Select Event</label>
                    <select
                    value={selectedEvent}
                    onChange={(e) => {
                        setSelectedEvent(e.target.value);
                        setSearch('');
                        setSelectedParticipant(null);
                    }}
                    >
                    <option value="">Select Event</option>
                    {events.map(event => (
                        <option key={event._id} value={event._id}>
                        {event.name}
                        </option>
                    ))}
                    </select>
                </div>

                <div className="form-group" ref={searchRef}>
                    <label>Search Participant</label>

                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={!selectedEvent}
                            placeholder={
                                selectedEvent
                                    ? "Type name or email..."
                                    : "Select event first"
                            }
                        />

                        {search && (
                            <button
                                className="clear-btn"
                                onClick={() => {
                                    setSearch('');
                                    setSuggestions([]);
                                    setSelectedParticipant(null);
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {search && suggestions.length > 0 && (
                        <div className="suggestions-table-wrapper">
                            <table className="data-table suggestions-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suggestions.map(p => (
                                        <tr
                                            key={p._id}
                                            className={`suggestion-row 
                                                ${p.attended ? 'disabled' : ''} 
                                                ${selectedParticipant?._id === p._id ? 'selected' : ''}
                                            `}
                                            onClick={() => {
                                                if (p.attended) return;

                                                setSelectedParticipant(p);
                                                setSearch(`${p.name} (${p.email})`);
                                                setSuggestions([]);
                                            }}
                                        >
                                            <td>{p.name}</td>
                                            <td>{p.email}</td>
                                            <td>
                                                {p.attended ? (
                                                    <span className="badge badge--success">Attended</span>
                                                ) : (
                                                    <span className="badge badge--default">Not Attended</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {search && suggestions.length === 0 && !selectedParticipant && !loading && (
                        <div className="no-results">No matching participants found</div>
                    )}
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    disabled={!selectedParticipant || loading}
                    onClick={handleManualSubmit}
                >
                    {loading ? 'Processing...' : 'Mark Attendance'}
                </button>
            </Card>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}

export default Attendance;
