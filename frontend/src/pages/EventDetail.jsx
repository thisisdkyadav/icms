import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useMemo } from "react";
import {
  getEvent,
  getParticipants,
  getAssignableUsers,
  importParticipants,
  sendQRCodes,
  previewCertificate,
  sendCertificates,
  sendReceipts,
  sendNotifications,
  assignUserToEvent,
  unassignUserFromEvent,
  exportParticipants,
} from "../services/api";
import { usePage } from "../contexts/PageContext";
import StatCard from "../components/StatCard";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import CertificateConfigModal from "../components/CertificateConfigModal";

const IconUsers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
const IconCheck = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconCreditCard = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPage } = usePage();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [showCertificateConfig, setShowCertificateConfig] = useState(false);
  const [notification, setNotification] = useState({
    subject: "",
    message: "",
  });
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [certificateActionLoading, setCertificateActionLoading] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [importConfirm, setImportConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const [showExport, setShowExport] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    type: "all",
    columns: [],
  });
  const [exportLoading, setExportLoading] = useState(false);

  const extraColumns = useMemo(
    () =>
      Array.from(
        new Set(
          participants.flatMap((p) =>
            p.dataFields && typeof p.dataFields === "object"
              ? Object.keys(p.dataFields).filter(
                  (col) => col && col.trim() !== "",
                )
              : [],
          ),
        ),
      ).sort(),
    [participants],
  );

  useEffect(() => {
    loadData();
  }, [id]);
  useEffect(() => {
    if (event && canManageAssignments(event)) {
      loadAssignableUsers();
    }
  }, [event]);

  useEffect(() => {
    if (event) {
      const canManage = canManageAssignments(event);
      setPage(
        event.name,
        `${new Date(event.date).toLocaleDateString()} — ${participants.length} participants`,
        <>
          {canManage && (
            <button
              onClick={() => setShowAssignments(true)}
              className="btn-secondary btn-sm"
              disabled={!!actionLoading || !!assignmentLoading}
            >
              Manage Access
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary btn-sm"
            disabled={!!actionLoading}
          >
            Import Participants
          </button>
          <button
            onClick={() => {
              if (participants.length === 0) {
                setToast({
                  message: "No participants found",
                  type: "error",
                });
                return;
              }
              setShowExport(true);
            }}
            className={`btn-secondary btn-sm ${participants.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Export Participants
          </button>
          <button
            onClick={() => setShowNotify(true)}
            className="btn-secondary btn-sm"
            disabled={!!actionLoading}
          >
            Notify
          </button>
          <button
            onClick={() => navigate("/events")}
            className="btn-ghost btn-sm"
          >
            Back
          </button>
        </>,
      );
    }
  }, [event, participants.length, actionLoading]);

  const loadData = async () => {
    try {
      const [eventRes, participantsRes] = await Promise.all([
        getEvent(id),
        getParticipants(id),
      ]);
      setEvent(eventRes.data);
      setParticipants(participantsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => currentUser.id || currentUser._id;
  const isEventCreator = (loadedEvent) => {
    const creatorId = loadedEvent?.createdBy?._id || loadedEvent?.createdBy;
    return creatorId === getCurrentUserId();
  };
  const canManageAssignments = (loadedEvent) =>
    currentUser.role === "superadmin" ||
    (currentUser.role === "admin" && isEventCreator(loadedEvent));

  const loadAssignableUsers = async () => {
    try {
      const response = await getAssignableUsers();
      setAssignableUsers(response.data);
    } catch (error) {
      console.error("Failed to load assignable users:", error);
    }
  };

  const downloadTemplate = () => {
    const headers =
      "name,email,department,phone,transactionId,transactionTime,amount,paymentMode";
    const example =
      "John Doe,john@example.com,Engineering,9876543210,TXN123456,2026-02-09 10:30,500,UPI";
    const blob = new Blob([`${headers}\n${example}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Normalize column header names
  const normalizeHeaderName = (headerName) => {
    if (!headerName) return "";
    const normalized = headerName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalized;
  };

  // Map normalized header to field name
  const mapHeaderToField = (normalizedHeader) => {
    if (normalizedHeader.includes("name")) return "name";
    if (normalizedHeader.includes("email")) return "email";
    if (
      normalizedHeader.includes("department") ||
      normalizedHeader.includes("dept") ||
      normalizedHeader.includes("branch")
    )
      return "department";
    if (
      normalizedHeader.includes("phone") ||
      normalizedHeader.includes("mobile") ||
      normalizedHeader.includes("contact")
    )
      return "phone";
    if (
      normalizedHeader.includes("transactionid") ||
      normalizedHeader.includes("txnid")
    )
      return "transactionId";
    if (
      normalizedHeader.includes("transactiontime") ||
      normalizedHeader.includes("txntime")
    )
      return "transactionTime";
    if (normalizedHeader.includes("amount")) return "amount";
    if (
      normalizedHeader.includes("paymentmode") ||
      normalizedHeader.includes("mode")
    )
      return "paymentMode";
    return null;
  };

  // Helper function to clean up undefined values
  const sanitizeParticipant = (participant) => {
    const sanitized = {};

    Object.entries(participant).forEach(([key, value]) => {
      if (key === "dataFields" && value) {
        // Clean up dataFields object
        sanitized.dataFields = {};
        Object.entries(value).forEach(([fieldKey, fieldValue]) => {
          sanitized.dataFields[fieldKey] =
            fieldValue === undefined || fieldValue === null ? "" : fieldValue;
        });
      } else {
        // Replace undefined/null with empty string
        sanitized[key] = value === undefined || value === null ? "" : value;
      }
    });

    return sanitized;
  };

  // Parse spreadsheet data (Excel, ODS)
  const parseSpreadsheetData = (jsonData) => {
    return jsonData
      .map((row) => {
        const parsed = {};

        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = normalizeHeaderName(key);
          const fieldName = mapHeaderToField(normalizedKey);

          if (fieldName) {
            parsed[fieldName] = value ? String(value).trim() : "";
          } else {
            const cleanKey = normalizedKey;

            if (cleanKey) {
              if (!parsed.dataFields) parsed.dataFields = {};
              parsed.dataFields[cleanKey] = value ? String(value).trim() : "";
            }
          }
        });

        return sanitizeParticipant(parsed);
      })
      .filter((p) => p.name && p.email && p.department);
  };

  // Helper function to properly parse CSV lines with quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Handle escaped quotes ("")
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        // Found a field separator
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Parse CSV text with proper handling of quoted values
  const parseCSVText = (csvText) => {
    try {
      const lines = csvText.split("\n").filter((l) => l.trim());
      if (lines.length < 2) return null;

      const headers = parseCSVLine(lines[0]);
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 2) continue;

        const p = {};
        headers.forEach((h, idx) => {
          const v = values[idx] || "";
          const normalizedHeader = normalizeHeaderName(h);
          const fieldName = mapHeaderToField(normalizedHeader);

          if (fieldName) {
            p[fieldName] = v;
          } else {
            const cleanKey = normalizedHeader;

            if (cleanKey) {
              if (!p.dataFields) p.dataFields = {};
              p.dataFields[cleanKey] = v;
            }
          }
        });

        // Sanitize the participant to remove undefined values
        const sanitized = sanitizeParticipant(p);
        if (sanitized.name && sanitized.email && sanitized.department) {
          parsed.push(sanitized);
        }
      }

      return parsed.length > 0 ? parsed : null;
    } catch (error) {
      console.error("CSV parse error:", error);
      return null;
    }
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();
    const isExcel = ["xlsx", "xltx", "xls"].includes(fileExtension);
    const isODS = fileExtension === "ods";
    const isCSV = fileExtension === "csv";

    if (!isCSV && !isExcel && !isODS) {
      setToast({
        message: "Please upload a CSV, XLSX, XLTX, XLS, or ODS file",
        type: "error",
      });
      return;
    }

    const reader = new FileReader();

    if (isExcel || isODS) {
      // For Excel and ODS files
      reader.onload = async (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: "binary" });
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          if (!jsonData || jsonData.length === 0) {
            setToast({ message: "Spreadsheet is empty", type: "error" });
            return;
          }

          const parsed = parseSpreadsheetData(jsonData);

          if (parsed.length === 0) {
            setToast({
              message:
                "No valid participants found (name, email, department required)",
              type: "error",
            });
            return;
          }

          setImportConfirm({ count: parsed.length, data: parsed });
        } catch (error) {
          console.error("File parse error:", error);
          setToast({
            message: `Failed to parse ${fileExtension.toUpperCase()} file`,
            type: "error",
          });
        }
      };
      reader.readAsBinaryString(file);
    } else if (isCSV) {
      // For CSV files
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const parsed = parseCSVText(csvText);

          if (!parsed) {
            setToast({
              message:
                "CSV file is empty or no valid participants found (name, email, department required)",
              type: "error",
            });
            return;
          }

          setImportConfirm({ count: parsed.length, data: parsed });
        } catch (error) {
          console.error("CSV parse error:", error);
          setToast({ message: "Failed to parse CSV file", type: "error" });
        }
      };
      reader.readAsText(file);
    }

    e.target.value = "";
  };

  const doImport = async () => {
    if (!importConfirm) return;
    try {
      const response = await importParticipants(id, importConfirm.data);
      setToast({ message: response.data.message, type: "success" });
      setShowImport(false);
      loadData();
    } catch {
      setToast({ message: "Failed to import", type: "error" });
    } finally {
      setImportConfirm(null);
    }
  };

  const requestAction = (action, label, warning) =>
    setConfirmAction({ action, label, warning });

  const executeAction = async () => {
    if (!confirmAction) return;
    const { action, label } = confirmAction;
    setConfirmAction(null);
    setActionLoading(label);
    try {
      const res = await action(id);
      setToast({ message: res.data.message, type: "success" });
    } catch {
      setToast({ message: `Failed: ${label}`, type: "error" });
    } finally {
      setActionLoading("");
    }
  };

  const handleSendNotification = async () => {
    if (!notification.subject.trim() || !notification.message.trim()) {
      setToast({ message: "Subject and message are required", type: "error" });
      return;
    }
    try {
      const res = await sendNotifications(id, notification);
      setToast({ message: res.data.message, type: "success" });
      setShowNotify(false);
      setNotification({ subject: "", message: "" });
    } catch {
      setToast({ message: "Failed to send notifications", type: "error" });
    }
  };

  const handlePreviewCertificate = async ({
    mode,
    participantId,
    certificateConfig,
  }) => {
    setCertificateActionLoading(mode);

    try {
      const response = await previewCertificate(id, {
        participantId,
        certificateConfig,
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileName = `certificate_preview_${id}.pdf`;
      const blobUrl = URL.createObjectURL(blob);

      if (mode === "view") {
        const openedWindow = window.open(
          blobUrl,
          "_blank",
          "noopener,noreferrer",
        );
        if (!openedWindow) {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName;
          link.click();
        }
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      setToast({
        message: "Failed to generate preview certificate",
        type: "error",
      });
    } finally {
      setCertificateActionLoading("");
    }
  };

  const handleSendCertificates = async (certificateConfig) => {
    setCertificateActionLoading("send");
    try {
      const response = await sendCertificates(id, { certificateConfig });
      setToast({ message: response.data.message, type: "success" });
      setShowCertificateConfig(false);
    } catch {
      setToast({ message: "Failed to send certificates", type: "error" });
    } finally {
      setCertificateActionLoading("");
    }
  };

  const handleAssignUser = async () => {
    if (!selectedAssignee) {
      setToast({
        message: "Select an admin or sub-admin first",
        type: "error",
      });
      return;
    }

    setAssignmentLoading("assign");
    try {
      const response = await assignUserToEvent(id, selectedAssignee);
      setEvent(response.data);
      setSelectedAssignee("");
      setToast({ message: "User assigned to event", type: "success" });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to assign user",
        type: "error",
      });
    } finally {
      setAssignmentLoading("");
    }
  };

  const handleUnassignUser = async (userId) => {
    setAssignmentLoading(userId);
    try {
      const response = await unassignUserFromEvent(id, userId);
      setEvent(response.data);
      setToast({ message: "User removed from event", type: "success" });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to remove user",
        type: "error",
      });
    } finally {
      setAssignmentLoading("");
    }
  };

  const handleExportFinal = async () => {
    if (participants.length === 0) {
      setToast({ message: "No participants available", type: "error" });
      return;
    }

    if (
      exportOptions.type === "attended" &&
      participants.filter((p) => p.attended).length === 0
    ) {
      setToast({ message: "No attended participants found", type: "error" });
      return;
    }

    setExportLoading(true);

    try {
      const response = await exportParticipants(id, exportOptions);

      if (!response || !response.data) {
        throw new Error("Empty response");
      }

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `participants_${exportOptions.type}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);

      setShowExport(false);
      setToast({ message: "Export successful", type: "success" });
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message || error.message || "Export failed";

      setToast({ message, type: "error" });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div> Loading...
      </div>
    );
  if (!event)
    return (
      <div className="empty-state">
        <p>Event not found</p>
      </div>
    );

  const attendedCount = participants.filter((p) => p.attended).length;
  const withPayment = participants.filter((p) => p.transactionId).length;
  const attendanceRate =
    participants.length > 0
      ? Math.round((attendedCount / participants.length) * 100)
      : 0;
  const creatorId = event.createdBy?._id || event.createdBy;
  const assignedUserIds = new Set(
    (event.assignedUsers || []).map((user) => user._id || user),
  );
  const availableAssignees = assignableUsers.filter(
    (user) => !assignedUserIds.has(user._id) && user._id !== creatorId,
  );

  return (
    <div>
      <div className="action-buttons">
        <button
          onClick={() =>
            requestAction(
              sendQRCodes,
              "QR Codes",
              `This will send QR code emails to all ${participants.length} participants.`,
            )
          }
          className="btn-secondary"
          disabled={!!actionLoading || participants.length === 0}
        >
          {actionLoading === "QR Codes" ? "Sending..." : "Send QR Codes"}
        </button>
        <button
          onClick={() =>
            requestAction(
              sendReceipts,
              "Receipts",
              `This will send receipt emails to ${withPayment} participants with payment data.`,
            )
          }
          className="btn-secondary"
          disabled={!!actionLoading || withPayment === 0}
        >
          {actionLoading === "Receipts" ? "Sending..." : "Send Receipts"}
        </button>
        <button
          onClick={() => setShowCertificateConfig(true)}
          className="btn-secondary"
          disabled={
            !!actionLoading || !!certificateActionLoading || attendedCount === 0
          }
        >
          {certificateActionLoading === "send"
            ? "Sending..."
            : "Send Certificates"}
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<IconUsers />}
          label="Participants"
          value={participants.length}
          color="primary"
        />
        <StatCard
          icon={<IconCheck />}
          label="Attended"
          value={`${attendedCount} (${attendanceRate}%)`}
          color="success"
        />
        <StatCard
          icon={<IconCreditCard />}
          label="With Payment"
          value={withPayment}
          color="warning"
        />
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import Participants"
      >
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            marginBottom: "var(--sp-4)",
          }}
        >
          Upload a spreadsheet or CSV file with participant details.
        </p>
        <div className="warning-box">
          <strong>Warning:</strong> Duplicate rows are matched by email. Only
          the first occurrence for each email is imported.
        </div>
        <div className="import-actions">
          <button onClick={downloadTemplate} className="btn-secondary">
            Download CSV Template
          </button>
          <input
            type="file"
            accept=".csv,.xlsx,.xltx,.xls,.ods"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            Upload File
          </button>
        </div>
        <div className="template-info">
          <h4>Supported Formats</h4>
          <ul
            style={{
              margin: "8px 0",
              paddingLeft: "20px",
              fontSize: "var(--text-sm)",
            }}
          >
            <li>CSV (.csv)</li>
            <li>Excel (.xlsx, .xltx, .xls)</li>
            <li>LibreOffice Calc (.ods)</li>
          </ul>
          <h4 style={{ marginTop: "12px" }}>Column Names (case-insensitive)</h4>
          <ul
            style={{
              margin: "8px 0",
              paddingLeft: "20px",
              fontSize: "var(--text-sm)",
            }}
          >
            <li>
              <strong>Required:</strong> name, email, department
            </li>
            <li>
              <strong>Optional:</strong> phone (mobile, contact), transactionId
              (txn_id, txnid), transactionTime (txn_time, txntime), amount,
              paymentMode (mode)
            </li>
          </ul>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        title="Export Options"
      >
        <div className="form-group">
          <label>Export Type</label>
          <select
            value={exportOptions.type}
            onChange={(e) =>
              setExportOptions({ ...exportOptions, type: e.target.value })
            }
          >
            <option value="all">All Participants</option>
            <option value="attended">Only Attended</option>
          </select>
        </div>

        <p style={{ fontSize: "12px", color: "gray", marginTop: "6px" }}>
          {exportOptions.type === "attended"
            ? `${participants.filter((p) => p.attended).length} attended participants will be exported`
            : `${participants.length} participants will be exported`}
        </p>

        <div className="form-group">
          <label>Select Columns</label>

          <div style={{ marginBottom: "10px" }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() =>
                setExportOptions({
                  ...exportOptions,
                  columns: [
                    "Name",
                    "Email",
                    "Department",
                    "Phone",
                    "TransactionID",
                    "TransactionTime",
                    "Amount",
                    "PaymentMode",
                    "Status",
                    ...extraColumns,
                  ],
                })
              }
            >
              Select All
            </button>

            <button
              type="button"
              className="btn-secondary btn-sm"
              style={{ marginLeft: "8px" }}
              onClick={() =>
                setExportOptions({ ...exportOptions, columns: [] })
              }
            >
              Clear
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              maxHeight: "260px",
              overflowY: "auto",
              paddingRight: "6px",
            }}
          >
            {[
              "Name",
              "Email",
              "Department",
              "Phone",
              "TransactionID",
              "TransactionTime",
              "Amount",
              "PaymentMode",
              "Status",
              ...extraColumns,
            ].map((col) => {
              const isSelected = exportOptions.columns.includes(col);

              return (
                <div
                  key={col}
                  onClick={() => {
                    const updated = isSelected
                      ? exportOptions.columns.filter((c) => c !== col)
                      : [...exportOptions.columns, col];

                    setExportOptions({
                      ...exportOptions,
                      columns: updated,
                    });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    padding: "10px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    background: isSelected
                      ? "var(--primary-50)"
                      : "var(--bg-card)",
                    transition: "all var(--transition-fast)",
                    userSelect: "none",
                  }}
                >
                  <span
                    style={{ fontSize: "13px", color: "var(--text-primary)" }}
                  >
                    {col}
                  </span>

                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      border: "2px solid var(--border-color)",
                      background: isSelected
                        ? "var(--primary-500)"
                        : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-form-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowExport(false)}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleExportFinal}
            disabled={exportLoading}
          >
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal
        isOpen={showNotify}
        onClose={() => setShowNotify(false)}
        title="Send Notification"
      >
        <div className="warning-box">
          This will send an email to all {participants.length} participants.
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            value={notification.subject}
            onChange={(e) =>
              setNotification({ ...notification, subject: e.target.value })
            }
            placeholder="Notification subject"
          />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea
            value={notification.message}
            onChange={(e) =>
              setNotification({ ...notification, message: e.target.value })
            }
            placeholder="Write your message..."
            rows="4"
          />
        </div>
        <div className="modal-form-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowNotify(false)}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSendNotification}>
            Send to All
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignments}
        onClose={() => setShowAssignments(false)}
        title="Manage Event Access"
        size="lg"
      >
        <div className="form-row">
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "var(--sp-2)",
              }}
            >
              Created By
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-2)",
                flexWrap: "wrap",
              }}
            >
              <strong>{event.createdBy?.name}</strong>
              <span>{event.createdBy?.email}</span>
              <Badge variant={event.createdBy?.role}>
                {event.createdBy?.role}
              </Badge>
            </div>
          </div>
          <div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "var(--sp-2)",
              }}
            >
              Assign Admin / Sub-Admin
            </p>
            <div
              style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}
            >
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                style={{ minWidth: 260 }}
              >
                <option value="">Select a user</option>
                {availableAssignees.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignUser}
                className="btn-primary"
                disabled={
                  assignmentLoading === "assign" ||
                  availableAssignees.length === 0
                }
              >
                {assignmentLoading === "assign"
                  ? "Assigning..."
                  : "Assign User"}
              </button>
            </div>
          </div>
        </div>

        {availableAssignees.length === 0 && (
          <div className="warning-box" style={{ marginTop: "var(--sp-4)" }}>
            All available admins and sub-admins are already assigned to this
            event.
          </div>
        )}

        <div style={{ marginTop: "var(--sp-5)" }}>
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--sp-3)",
            }}
          >
            Assigned Users
          </p>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(event.assignedUsers || []).map((assignedUser) => {
                  const isCreator = assignedUser._id === creatorId;
                  return (
                    <tr key={assignedUser._id}>
                      <td>{assignedUser.name}</td>
                      <td>{assignedUser.email}</td>
                      <td>
                        <Badge variant={assignedUser.role}>
                          {assignedUser.role}
                        </Badge>
                      </td>
                      <td>{isCreator ? "Creator" : "Assigned"}</td>
                      <td>
                        {!isCreator ? (
                          <button
                            onClick={() => handleUnassignUser(assignedUser._id)}
                            className="btn-danger btn-sm"
                            disabled={assignmentLoading === assignedUser._id}
                          >
                            {assignmentLoading === assignedUser._id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <CertificateConfigModal
        isOpen={showCertificateConfig}
        onClose={() => setShowCertificateConfig(false)}
        event={event}
        participants={participants}
        onSend={handleSendCertificates}
        onPreview={handlePreviewCertificate}
        actionLoading={certificateActionLoading}
      />

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={`Send ${confirmAction?.label || ""}?`}
        message={confirmAction?.warning || "Are you sure?"}
        confirmText={`Send ${confirmAction?.label || ""}`}
      />
      <ConfirmDialog
        isOpen={!!importConfirm}
        onClose={() => setImportConfirm(null)}
        onConfirm={doImport}
        title="Confirm Import"
        message={`Found ${importConfirm?.count || 0} valid participants. Proceed?`}
        confirmText="Import"
      />

      <h2 className="section-title">Participants</h2>
      {participants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <p>No participants yet. Import from a file above.</p>
        </div>
      ) : (
        <Card noPad>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  {extraColumns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.department || "—"}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.transactionId || "—"}</td>
                    <td>{p.amount ? `₹${p.amount}` : "—"}</td>
                    <td>
                      <Badge variant={p.attended ? "success" : "default"}>
                        {p.attended ? "Attended" : "Pending"}
                      </Badge>
                    </td>
                    {extraColumns.map((col) => (
                      <td key={col}>
                        {p.dataFields?.[col] ? p.dataFields[col] : "—"}
                      </td>
                    ))}
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
