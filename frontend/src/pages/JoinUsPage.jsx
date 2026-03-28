import { useEffect, useMemo, useState } from "react";
import { cvApi } from "../api/cvApi";

const STATUS_LABELS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const JoinUsPage = () => {
  const [applications, setApplications] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const serverBaseUrl = useMemo(() => {
    const api = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    return api.replace(/\/api\/?$/, "");
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await cvApi.getMyCvApplications();
      setApplications(response?.data?.applications || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load your CV applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const resolveFileUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${serverBaseUrl}${path}`;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please choose a PDF file");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("cvFile", selectedFile);

    try {
      setUploading(true);
      setError("");
      setMessage("");

      await cvApi.uploadMyCv(formData);
      setMessage("CV uploaded successfully. Status is now pending.");
      setSelectedFile(null);
      await loadApplications();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to upload CV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrap}>
        <h1 style={styles.title}>Join Us - CV Application</h1>
        <p style={styles.subtitle}>
          Upload your CV in PDF format. We will review and update your application status.
        </p>

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleUpload} style={styles.form}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={styles.fileInput}
          />
          <button type="submit" disabled={uploading} style={styles.button}>
            {uploading ? "Uploading..." : "Upload CV"}
          </button>
        </form>

        <h2 style={styles.sectionTitle}>Your Uploaded CVs</h2>

        {loading ? (
          <p style={styles.info}>Loading...</p>
        ) : applications.length === 0 ? (
          <p style={styles.info}>No CV uploaded yet.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Uploaded At</th>
                  <th style={styles.th}>File</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Admin Note</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item) => (
                  <tr key={item._id}>
                    <td style={styles.td}>{new Date(item.createdAt).toLocaleString()}</td>
                    <td style={styles.td}>
                      <a
                        href={resolveFileUrl(item.cvFileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.fileLink}
                      >
                        {item.originalFileName || "View PDF"}
                      </a>
                    </td>
                    <td style={styles.td}>{STATUS_LABELS[item.status] || item.status}</td>
                    <td style={styles.td}>{item.adminNote || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "2rem 1rem",
    background: "#f3f5f9",
  },
  wrap: {
    maxWidth: "980px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
  },
  title: {
    marginTop: 0,
    marginBottom: "0.4rem",
    color: "#1f2937",
  },
  subtitle: {
    marginTop: 0,
    color: "#6b7280",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.8rem",
    alignItems: "center",
    marginBottom: "1.3rem",
  },
  fileInput: {
    padding: "0.55rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "#fff",
    flex: "1 1 280px",
  },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "0.7rem 1rem",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  success: {
    background: "#ecfdf3",
    border: "1px solid #86efac",
    color: "#166534",
    padding: "0.7rem",
    borderRadius: "8px",
    marginBottom: "0.8rem",
  },
  error: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "0.7rem",
    borderRadius: "8px",
    marginBottom: "0.8rem",
  },
  sectionTitle: {
    margin: "1rem 0 0.7rem",
    color: "#1f2937",
  },
  info: {
    color: "#6b7280",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "0.65rem",
    color: "#374151",
    fontSize: "0.9rem",
  },
  td: {
    borderBottom: "1px solid #f1f5f9",
    padding: "0.65rem",
    color: "#111827",
    verticalAlign: "top",
    fontSize: "0.94rem",
  },
  fileLink: {
    color: "#1d4ed8",
    textDecoration: "none",
    fontWeight: 600,
  },
};

export default JoinUsPage;
