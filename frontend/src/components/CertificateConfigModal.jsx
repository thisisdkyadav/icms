import { useMemo, useState } from 'react';
import Modal from './Modal';

const SIGNATURE_MAX_FILE_SIZE = 2 * 1024 * 1024;

const EDITABLE_FIELDS = [
  { key: 'instituteTitle', label: 'Institute Title', multiline: false },
  { key: 'subtitle', label: 'Subtitle', multiline: false },
  { key: 'title', label: 'Certificate Title', multiline: false },
  { key: 'bodyParagraph', label: 'Body Paragraph', multiline: true, rows: 6 },
  { key: 'leftSignatory', label: 'Left Signatory', multiline: false },
  { key: 'rightSignatory', label: 'Right Signatory', multiline: false },
  { key: 'leftDatePrefix', label: 'Date Label Prefix', multiline: false }
];

const EVENT_TOKENS = [
  { value: 'event.name', label: 'Event Name' },
  { value: 'event.dateLong', label: 'Event Date (Long)' },
  { value: 'event.dateShort', label: 'Event Date (Short)' },
  { value: 'certificate.dateLong', label: 'Certificate Date (Long)' },
  { value: 'certificate.dateShort', label: 'Certificate Date (Short)' }
];

const createDefaultConfig = (eventDate) => ({
  certificateDate: eventDate ? new Date(eventDate).toISOString().slice(0, 10) : '',
  instituteLogoImage: '',
  instituteTitle: 'Indian Institute of Technology Indore',
  subtitle: 'Center for Pedagogy and Curricular Excellence (CPCE)',
  title: 'CERTIFICATE OF PARTICIPATION',
  bodyParagraph: 'This certificate is presented to Mr./Ms. {{participant.name}} of the Department of {{participant.department}} for participating in the {{event.name}} organised by the Centre for Pedagogy and Curricular Excellence on {{certificate.dateLong}}.',
  leftSignatory: 'Convener, CPCE',
  rightSignatory: 'Program Coordinator, TAOP',
  leftDatePrefix: 'Date:',
  leftSignatureImage: '',
  rightSignatureImage: ''
});

function CertificateConfigModal({
  isOpen,
  onClose,
  event,
  participants,
  onSend,
  onPreview,
  actionLoading
}) {
  const [config, setConfig] = useState(() => createDefaultConfig(event?.date));
  const [assetError, setAssetError] = useState('');
  const [previewParticipantId, setPreviewParticipantId] = useState('');
  const [builder, setBuilder] = useState({
    targetField: 'bodyParagraph',
    inputType: 'participant',
    participantToken: 'participant.name',
    eventToken: 'event.name',
    staticText: ''
  });

  const participantTokenOptions = useMemo(() => {
    const excluded = new Set(['_id', '__v', 'event', 'qrCode', 'createdAt', 'updatedAt', 'attended', 'receiptSent']);
    const optionsMap = new Map();

    participants.forEach((participant) => {
      Object.keys(participant || {}).forEach((key) => {
        if (excluded.has(key) || key === 'dataFields') {
          return;
        }

        optionsMap.set(`participant.${key}`, key);
      });

      const dataFields = participant?.dataFields;
      if (dataFields && typeof dataFields === 'object') {
        Object.keys(dataFields).forEach((key) => {
          optionsMap.set(`participant.dataFields.${key}`, `dataFields.${key}`);
        });
      }
    });

    if (!optionsMap.has('participant.name')) {
      optionsMap.set('participant.name', 'name');
    }

    if (!optionsMap.has('participant.department')) {
      optionsMap.set('participant.department', 'department');
    }

    return Array.from(optionsMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [participants]);

  const handleFieldChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (position, file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAssetError('Please upload a valid image file.');
      return;
    }

    if (file.size > SIGNATURE_MAX_FILE_SIZE) {
      setAssetError('Image must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAssetError('');
      setConfig((prev) => ({
        ...prev,
        [position]: typeof reader.result === 'string' ? reader.result : ''
      }));
    };
    reader.onerror = () => {
      setAssetError('Failed to read image file. Try another image.');
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = (position) => {
    setConfig((prev) => ({ ...prev, [position]: '' }));
  };

  const insertDynamicToken = () => {
    let token = '';

    if (builder.inputType === 'participant') {
      token = `{{${builder.participantToken}}}`;
    } else if (builder.inputType === 'event') {
      token = `{{${builder.eventToken}}}`;
    } else {
      token = builder.staticText;
    }

    if (!token.trim()) {
      return;
    }

    setConfig((prev) => ({
      ...prev,
      [builder.targetField]: `${prev[builder.targetField] || ''}${token}`
    }));

    if (builder.inputType === 'text') {
      setBuilder((prev) => ({ ...prev, staticText: '' }));
    }
  };

  const handlePreviewAction = async (mode) => {
    await onPreview({
      mode,
      participantId: previewParticipantId,
      certificateConfig: config
    });
  };

  const handleSendAction = async () => {
    await onSend(config);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Certificate" size="lg">
      <div className="certificate-config-shell">
        <div className="certificate-config-banner">
          <h3>Premium Certificate Studio</h3>
          <p>Use one complete paragraph for the body. It will auto-wrap into clean centered lines in the PDF.</p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Certificate Date</label>
            <input
              type="date"
              value={config.certificateDate}
              onChange={(e) => handleFieldChange('certificateDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Preview Participant</label>
            <select value={previewParticipantId} onChange={(e) => setPreviewParticipantId(e.target.value)}>
              <option value="">Auto select (first attended)</option>
              {participants.map((participant) => (
                <option key={participant._id} value={participant._id}>
                  {participant.name} - {participant.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="certificate-logo-card">
          <label>Institute Logo (Top Center)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleImageUpload('instituteLogoImage', e.target.files?.[0])}
          />
          {config.instituteLogoImage && (
            <div className="certificate-signature-preview-wrap">
              <img src={config.instituteLogoImage} alt="Institute logo preview" className="certificate-logo-preview" />
              <button type="button" className="btn-ghost btn-sm" onClick={() => clearSignature('instituteLogoImage')}>Remove</button>
            </div>
          )}
        </div>

        <div className="certificate-signature-grid">
          <div className="certificate-signature-card">
            <label>Left Signature Image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleImageUpload('leftSignatureImage', e.target.files?.[0])}
            />
            {config.leftSignatureImage && (
              <div className="certificate-signature-preview-wrap">
                <img src={config.leftSignatureImage} alt="Left signature preview" className="certificate-signature-preview" />
                <button type="button" className="btn-ghost btn-sm" onClick={() => clearSignature('leftSignatureImage')}>Remove</button>
              </div>
            )}
          </div>

          <div className="certificate-signature-card">
            <label>Right Signature Image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleImageUpload('rightSignatureImage', e.target.files?.[0])}
            />
            {config.rightSignatureImage && (
              <div className="certificate-signature-preview-wrap">
                <img src={config.rightSignatureImage} alt="Right signature preview" className="certificate-signature-preview" />
                <button type="button" className="btn-ghost btn-sm" onClick={() => clearSignature('rightSignatureImage')}>Remove</button>
              </div>
            )}
          </div>
        </div>

        {assetError && <div className="warning-box">{assetError}</div>}

        <div className="certificate-config-grid">
          <section className="certificate-config-panel">
            <h4>Certificate Texts</h4>
            {EDITABLE_FIELDS.map((field) => (
              <div className="form-group" key={field.key}>
                <label>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    rows={field.rows || 2}
                    value={config[field.key]}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    value={config[field.key]}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </section>

          <section className="certificate-config-panel certificate-config-panel--builder">
            <h4>Dynamic Input Builder</h4>
            <p className="certificate-hint">Pick where to insert text and whether it should be static text or a dynamic participant column.</p>

            <div className="form-group">
              <label>Target Text Block</label>
              <select
                value={builder.targetField}
                onChange={(e) => setBuilder((prev) => ({ ...prev, targetField: e.target.value }))}
              >
                {EDITABLE_FIELDS.map((field) => (
                  <option key={`target-${field.key}`} value={field.key}>{field.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Input Type</label>
              <select
                value={builder.inputType}
                onChange={(e) => setBuilder((prev) => ({ ...prev, inputType: e.target.value }))}
              >
                <option value="participant">Dynamic: Participant Column</option>
                <option value="event">Dynamic: Event/Certificate Value</option>
                <option value="text">Static Text</option>
              </select>
            </div>

            {builder.inputType === 'participant' && (
              <div className="form-group">
                <label>Participant Column</label>
                <select
                  value={builder.participantToken}
                  onChange={(e) => setBuilder((prev) => ({ ...prev, participantToken: e.target.value }))}
                >
                  {participantTokenOptions.map((option) => (
                    <option key={`participant-token-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {builder.inputType === 'event' && (
              <div className="form-group">
                <label>Event Value</label>
                <select
                  value={builder.eventToken}
                  onChange={(e) => setBuilder((prev) => ({ ...prev, eventToken: e.target.value }))}
                >
                  {EVENT_TOKENS.map((option) => (
                    <option key={`event-token-${option.value}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {builder.inputType === 'text' && (
              <div className="form-group">
                <label>Text</label>
                <input
                  type="text"
                  value={builder.staticText}
                  onChange={(e) => setBuilder((prev) => ({ ...prev, staticText: e.target.value }))}
                  placeholder="Type plain text to append"
                />
              </div>
            )}

            <button type="button" className="btn-primary" onClick={insertDynamicToken}>Insert Into Selected Block</button>

            <div className="template-info" style={{ marginTop: 'var(--sp-4)' }}>
              <h4>Token Format</h4>
              <p>Example: {'{{participant.name}}'} or {'{{event.name}}'}</p>
              <h4>Current Event</h4>
              <p>{event?.name || 'Event name unavailable'}</p>
            </div>
          </section>
        </div>

        <div className="modal-form-actions">
          <button type="button" className="btn-secondary" onClick={() => handlePreviewAction('view')} disabled={!!actionLoading}>
            {actionLoading === 'view' ? 'Opening...' : 'View Premium Certificate'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => handlePreviewAction('download')} disabled={!!actionLoading}>
            {actionLoading === 'download' ? 'Downloading...' : 'Download Preview Certificate'}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={!!actionLoading}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSendAction} disabled={!!actionLoading}>
            {actionLoading === 'send' ? 'Sending Certificates...' : 'Send Certificates'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CertificateConfigModal;
