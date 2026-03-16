import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, getParticipants, importParticipants, sendQRCodes, sendCertificates, sendReceipts, sendNotifications } from '../services/api';
import { usePage } from '../contexts/PageContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconCreditCard = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;

function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPage } = usePage();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);
    const [showNotify, setShowNotify] = useState(false);
    const [notification, setNotification] = useState({ subject: '', message: '' });
    const [toast, setToast] = useState(null);
    const [actionLoading, setActionLoading] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [importConfirm, setImportConfirm] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => { loadData(); }, [id]);

    useEffect(() => {
        if (event) {
            setPage(
                event.name,
                `${new Date(event.date).toLocaleDateString()} — ${participants.length} participants`,
                <>
                    <button onClick={() => setShowImport(true)} className="btn-secondary btn-sm" disabled={!!actionLoading}>Import CSV</button>
                    <button onClick={() => setShowNotify(true)} className="btn-secondary btn-sm" disabled={!!actionLoading}>Notify</button>
                    <button onClick={() => navigate('/events')} className="btn-ghost btn-sm">Back</button>
                </>
            );
        }
    }, [event, participants.length, actionLoading]);

    const loadData = async () => {
        try {
            const [eventRes, participantsRes] = await Promise.all([getEvent(id), getParticipants(id)]);
            setEvent(eventRes.data);
            setParticipants(participantsRes.data);
        } catch (error) { console.error('Failed to load data:', error); }
        finally { setLoading(false); }
    };

    const downloadTemplate = () => {
        const headers = 'name,email,phone,transactionId,transactionTime,amount,paymentMode';
        const example = 'John Doe,john@example.com,9876543210,TXN123456,2026-02-09 10:30,500,UPI';
        const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'participants_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const lines = event.target.result.split('\n').filter(l => l.trim());
                if (lines.length < 2) { setToast({ message: 'CSV file is empty', type: 'error' }); return; }
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const parsed = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length < 2) continue;
                    const p = {};
                    headers.forEach((h, idx) => {
                        const v = values[idx] || '';
                        if (h === 'name') p.name = v;
                        else if (h === 'email') p.email = v;
                        else if (h === 'phone' || h === 'mobile') p.phone = v;
                        else if (h.includes('transactionid') || h === 'txn_id') p.transactionId = v;
                        else if (h.includes('transactiontime') || h === 'txn_time') p.transactionTime = v;
                        else if (h === 'amount') p.amount = v;
                        else if (h.includes('paymentmode') || h === 'mode') p.paymentMode = v;
                    });
                    if (p.name && p.email) parsed.push(p);
                }
                if (parsed.length === 0) { setToast({ message: 'No valid participants found', type: 'error' }); return; }
                setImportConfirm({ count: parsed.length, data: parsed });
            } catch { setToast({ message: 'Failed to parse CSV', type: 'error' }); }
        };
        reader.readAsText(file); e.target.value = '';
    };

    const doImport = async () => {
        if (!importConfirm) return;
        try {
            await importParticipants(id, importConfirm.data);
            setToast({ message: `Imported ${importConfirm.count} participants`, type: 'success' });
            setShowImport(false); loadData();
        } catch { setToast({ message: 'Failed to import', type: 'error' }); }
        finally { setImportConfirm(null); }
    };

    const requestAction = (action, label, warning) => setConfirmAction({ action, label, warning });

    const executeAction = async () => {
        if (!confirmAction) return;
        const { action, label } = confirmAction;
        setConfirmAction(null); setActionLoading(label);
        try { const res = await action(id); setToast({ message: res.data.message, type: 'success' }); }
        catch { setToast({ message: `Failed: ${label}`, type: 'error' }); }
        finally { setActionLoading(''); }
    };

    const handleSendNotification = async () => {
        if (!notification.subject.trim() || !notification.message.trim()) { setToast({ message: 'Subject and message are required', type: 'error' }); return; }
        try { const res = await sendNotifications(id, notification); setToast({ message: res.data.message, type: 'success' }); setShowNotify(false); setNotification({ subject: '', message: '' }); }
        catch { setToast({ message: 'Failed to send notifications', type: 'error' }); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div> Loading...</div>;
    if (!event) return <div className="empty-state"><p>Event not found</p></div>;

    const attendedCount = participants.filter(p => p.attended).length;
    const withPayment = participants.filter(p => p.transactionId).length;
    const attendanceRate = participants.length > 0 ? Math.round((attendedCount / participants.length) * 100) : 0;

    return (
        <div>
            <div className="action-buttons">
                <button onClick={() => requestAction(sendQRCodes, 'QR Codes', `This will send QR code emails to all ${participants.length} participants.`)} className="btn-secondary" disabled={!!actionLoading || participants.length === 0}>
                    {actionLoading === 'QR Codes' ? 'Sending...' : 'Send QR Codes'}
                </button>
                <button onClick={() => requestAction(sendReceipts, 'Receipts', `This will send receipt emails to ${withPayment} participants with payment data.`)} className="btn-secondary" disabled={!!actionLoading || withPayment === 0}>
                    {actionLoading === 'Receipts' ? 'Sending...' : 'Send Receipts'}
                </button>
                <button onClick={() => requestAction(sendCertificates, 'Certificates', `This will send certificates to ${attendedCount} attended participants. Make sure attendance is finalized.`)} className="btn-secondary" disabled={!!actionLoading || attendedCount === 0}>
                    {actionLoading === 'Certificates' ? 'Sending...' : 'Send Certificates'}
                </button>
            </div>

            <div className="stats-grid">
                <StatCard icon={<IconUsers />} label="Participants" value={participants.length} color="primary" />
                <StatCard icon={<IconCheck />} label="Attended" value={`${attendedCount} (${attendanceRate}%)`} color="success" />
                <StatCard icon={<IconCreditCard />} label="With Payment" value={withPayment} color="warning" />
            </div>

            {/* Import Modal */}
            <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Participants">
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-4)' }}>Upload a CSV file with participant details.</p>
                <div className="warning-box"><strong>Warning:</strong> Importing will add new participants. Duplicates are matched by email.</div>
                <div className="import-actions">
                    <button onClick={downloadTemplate} className="btn-secondary">Download Template</button>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-primary">Upload CSV File</button>
                </div>
                <div className="template-info">
                    <h4>Required: name, email</h4>
                    <h4>Optional: phone, transactionId, transactionTime, amount, paymentMode</h4>
                </div>
            </Modal>

            {/* Notification Modal */}
            <Modal isOpen={showNotify} onClose={() => setShowNotify(false)} title="Send Notification">
                <div className="warning-box">This will send an email to all {participants.length} participants.</div>
                <div className="form-group"><label>Subject</label><input type="text" value={notification.subject} onChange={(e) => setNotification({ ...notification, subject: e.target.value })} placeholder="Notification subject" /></div>
                <div className="form-group"><label>Message</label><textarea value={notification.message} onChange={(e) => setNotification({ ...notification, message: e.target.value })} placeholder="Write your message..." rows="4" /></div>
                <div className="modal-form-actions">
                    <button className="btn-secondary" onClick={() => setShowNotify(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleSendNotification}>Send to All</button>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={executeAction} title={`Send ${confirmAction?.label || ''}?`} message={confirmAction?.warning || 'Are you sure?'} confirmText={`Send ${confirmAction?.label || ''}`} />
            <ConfirmDialog isOpen={!!importConfirm} onClose={() => setImportConfirm(null)} onConfirm={doImport} title="Confirm Import" message={`Found ${importConfirm?.count || 0} valid participants. Proceed?`} confirmText="Import" />

            <h2 className="section-title">Participants</h2>
            {participants.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div>
                    <p>No participants yet. Import from CSV above.</p>
                </div>
            ) : (
                <Card noPad>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Transaction ID</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                {participants.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.name}</td><td>{p.email}</td><td>{p.phone || '—'}</td>
                                        <td>{p.transactionId || '—'}</td><td>{p.amount ? `₹${p.amount}` : '—'}</td>
                                        <td><Badge variant={p.attended ? 'success' : 'default'}>{p.attended ? 'Attended' : 'Pending'}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}

export default EventDetail;
