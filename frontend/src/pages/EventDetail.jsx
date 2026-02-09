import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getEvent, getParticipants, importParticipants, sendQRCodes, sendCertificates, sendReceipts, sendNotifications } from '../services/api';

function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);
    const [showNotify, setShowNotify] = useState(false);
    const [notification, setNotification] = useState({ subject: '', message: '' });
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [eventRes, participantsRes] = await Promise.all([
                getEvent(id),
                getParticipants(id)
            ]);
            setEvent(eventRes.data);
            setParticipants(participantsRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Download CSV template
    const downloadTemplate = () => {
        const headers = 'name,email,phone,transactionId,transactionTime,amount,paymentMode';
        const example = 'John Doe,john@example.com,9876543210,TXN123456,2026-02-09 10:30,500,UPI';
        const csv = `${headers}\n${example}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'participants_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handle CSV file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    alert('CSV file is empty or has no data rows');
                    return;
                }

                // Parse header
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                // Parse data rows
                const parsedParticipants = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length < 2) continue; // Skip invalid rows

                    const participant = {};
                    headers.forEach((header, index) => {
                        const value = values[index] || '';
                        // Map common header names
                        if (header === 'name') participant.name = value;
                        else if (header === 'email') participant.email = value;
                        else if (header === 'phone' || header === 'mobile') participant.phone = value;
                        else if (header === 'transactionid' || header === 'transaction_id' || header === 'txn_id') participant.transactionId = value;
                        else if (header === 'transactiontime' || header === 'transaction_time' || header === 'txn_time') participant.transactionTime = value;
                        else if (header === 'amount') participant.amount = value;
                        else if (header === 'paymentmode' || header === 'payment_mode' || header === 'mode') participant.paymentMode = value;
                    });

                    if (participant.name && participant.email) {
                        parsedParticipants.push(participant);
                    }
                }

                if (parsedParticipants.length === 0) {
                    alert('No valid participants found in CSV. Make sure columns include name and email.');
                    return;
                }

                await importParticipants(id, parsedParticipants);
                setMessage(`Imported ${parsedParticipants.length} participants from CSV`);
                setShowImport(false);
                loadData();
            } catch (error) {
                alert('Failed to import CSV: ' + (error.response?.data?.message || error.message));
            }
        };
        reader.readAsText(file);

        // Reset file input
        e.target.value = '';
    };

    const handleSendQR = async () => {
        try {
            const response = await sendQRCodes(id);
            setMessage(response.data.message);
        } catch (error) {
            alert('Failed to send QR codes');
        }
    };

    const handleSendCertificates = async () => {
        try {
            const response = await sendCertificates(id);
            setMessage(response.data.message);
        } catch (error) {
            alert('Failed to send certificates');
        }
    };

    const handleSendReceipts = async () => {
        try {
            const response = await sendReceipts(id);
            setMessage(response.data.message);
        } catch (error) {
            alert('Failed to send receipts');
        }
    };

    const handleSendNotification = async () => {
        try {
            const response = await sendNotifications(id, notification);
            setMessage(response.data.message);
            setShowNotify(false);
            setNotification({ subject: '', message: '' });
        } catch (error) {
            alert('Failed to send notifications');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (!event) return <p>Event not found</p>;

    const attendedCount = participants.filter(p => p.attended).length;
    const withPayment = participants.filter(p => p.transactionId).length;

    return (
        <div className="event-detail">
            <h1>{event.name}</h1>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Description:</strong> {event.description || 'No description'}</p>

            {message && <div className="success-message">{message}</div>}

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Participants</h3>
                    <p className="stat-number">{participants.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Attended</h3>
                    <p className="stat-number">{attendedCount}</p>
                </div>
                <div className="stat-card">
                    <h3>With Payment</h3>
                    <p className="stat-number">{withPayment}</p>
                </div>
            </div>

            <div className="action-buttons">
                <button onClick={() => setShowImport(!showImport)} className="btn-secondary">
                    {showImport ? 'Cancel' : '📥 Import CSV'}
                </button>
                <button onClick={handleSendQR} className="btn-secondary">
                    📧 Send QR Codes
                </button>
                <button onClick={handleSendReceipts} className="btn-secondary">
                    🧾 Send Receipts
                </button>
                <button onClick={handleSendCertificates} className="btn-secondary">
                    📜 Send Certificates
                </button>
                <button onClick={() => setShowNotify(!showNotify)} className="btn-secondary">
                    📢 Send Notification
                </button>
            </div>

            {showImport && (
                <div className="form-card">
                    <h3>Import Participants from CSV</h3>
                    <p>Upload a CSV file with participant details.</p>

                    <div className="import-actions">
                        <button onClick={downloadTemplate} className="btn-secondary">
                            📄 Download Template
                        </button>
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
                            📁 Upload CSV File
                        </button>
                    </div>

                    <div className="template-info">
                        <h4>Required Columns:</h4>
                        <ul>
                            <li><strong>name</strong> - Participant name</li>
                            <li><strong>email</strong> - Email address</li>
                        </ul>
                        <h4>Optional Columns:</h4>
                        <ul>
                            <li><strong>phone</strong> - Phone number</li>
                            <li><strong>transactionId</strong> - Payment transaction ID</li>
                            <li><strong>transactionTime</strong> - Payment time</li>
                            <li><strong>amount</strong> - Payment amount</li>
                            <li><strong>paymentMode</strong> - UPI/Card/Cash etc.</li>
                        </ul>
                    </div>
                </div>
            )}

            {showNotify && (
                <div className="form-card">
                    <h3>Send Notification</h3>
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={notification.subject}
                            onChange={(e) => setNotification({ ...notification, subject: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            value={notification.message}
                            onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                            rows="4"
                        />
                    </div>
                    <button onClick={handleSendNotification} className="btn-primary">Send</button>
                </div>
            )}

            <h2>Participants</h2>
            {participants.length === 0 ? (
                <p>No participants yet. Import from CSV above.</p>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Transaction ID</th>
                                <th>Amount</th>
                                <th>Attended</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map(p => (
                                <tr key={p._id}>
                                    <td>{p.name}</td>
                                    <td>{p.email}</td>
                                    <td>{p.phone || '-'}</td>
                                    <td>{p.transactionId || '-'}</td>
                                    <td>{p.amount ? `₹${p.amount}` : '-'}</td>
                                    <td>
                                        <span className={`status-badge ${p.attended ? 'attended' : 'not-attended'}`}>
                                            {p.attended ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default EventDetail;
