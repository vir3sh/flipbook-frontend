import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import HTMLFlipBook from "react-pageflip";
import "./App.css";

// Base URL for API requests
const API_URL = "http://localhost:5000/api";

// Main App Component
function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>PDF Flipbook Creator</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/upload">Upload PDF</Link>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecentFlipbooks />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/flipbook/:id" element={<FlipbookViewer />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} PDF Flipbook Creator</p>
        </footer>
      </div>
    </Router>
  );
}

// Home page showing recent flipbooks
function RecentFlipbooks() {
  const [flipbooks, setFlipbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentFlipbooks = async () => {
      try {
        const response = await axios.get(`${API_URL}/flipbooks/recent`);
        setFlipbooks(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch recent flipbooks");
        setLoading(false);
        console.error(err);
      }
    };

    fetchRecentFlipbooks();
  }, []);

  if (loading)
    return <div className="loading">Loading recent flipbooks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="recent-flipbooks">
      <h2>Recent Flipbooks</h2>
      {flipbooks.length === 0 ? (
        <p>
          No flipbooks available. <Link to="/upload">Upload one now!</Link>
        </p>
      ) : (
        <div className="flipbooks-grid">
          {flipbooks.map((book) => (
            <div key={book.publicId} className="flipbook-card">
              <div className="flipbook-thumbnail">
                <img
                  src={`http://localhost:5000/uploads/images/${book.publicId}/page-01.png`}
                  alt={book.title}
                />
              </div>
              <div className="flipbook-info">
                <h3>{book.title}</h3>
                <p>Created: {new Date(book.createdAt).toLocaleDateString()}</p>
                <Link to={`/flipbook/${book.publicId}`} className="view-btn">
                  View Flipbook
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Upload page component
function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [flipbookId, setFlipbookId] = useState(null);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          uploadPdf(acceptedFiles[0]);
        }
      },
    });

  const uploadPdf = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setUploadSuccess(true);
      setFlipbookId(response.data.id);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload PDF to Create Flipbook</h2>

      {!uploadSuccess && (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "active" : ""}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the PDF file here...</p>
          ) : (
            <div>
              <p>Drag & drop a PDF file here, or click to select</p>
              <p className="dropzone-info">Maximum file size: 20MB</p>
            </div>
          )}
        </div>
      )}

      {acceptedFiles.length > 0 && !uploadSuccess && (
        <div className="selected-file">
          <p>
            Selected file: {acceptedFiles[0].name} (
            {(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>{uploadProgress}% uploaded</p>
        </div>
      )}

      {uploadError && (
        <div className="upload-error">
          <p>Error: {uploadError}</p>
        </div>
      )}

      {uploadSuccess && (
        <div className="upload-success">
          <p>PDF uploaded successfully!</p>
          <Link to={`/flipbook/${flipbookId}`} className="view-flipbook-btn">
            View Your Flipbook
          </Link>
          <button
            className="upload-another-btn"
            onClick={() => {
              setUploadSuccess(false);
              setFlipbookId(null);
            }}
          >
            Upload Another PDF
          </button>
        </div>
      )}
    </div>
  );
}

// Flipbook viewer component
function FlipbookViewer() {
  const [flipbook, setFlipbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the flipbook ID from the URL
  const id = window.location.pathname.split("/").pop();

  useEffect(() => {
    const fetchFlipbook = async () => {
      try {
        const response = await axios.get(`${API_URL}/flipbooks/${id}`);
        setFlipbook(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load flipbook");
        setLoading(false);
        console.error(err);
      }
    };

    if (id) {
      fetchFlipbook();
    }
  }, [id]);

  if (loading) return <div className="loading">Loading flipbook...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!flipbook) return <div className="error">Flipbook not found</div>;

  return (
    <div className="flipbook-viewer">
      <h2>{flipbook.title}</h2>

      <div className="flipbook-container">
        <HTMLFlipBook
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          drawShadow={true}
          flippingTime={1000}
          className="demo-book"
          startPage={0}
        >
          {flipbook.images.map((imagePath, index) => (
            <div key={index} className="page">
              <img
                src={`http://localhost:5000${imagePath}`}
                alt={`Page ${index + 1}`}
                className="page-img"
              />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      <div className="flipbook-info">
        <p>Created: {new Date(flipbook.createdAt).toLocaleDateString()}</p>
        <div className="flipbook-controls">
          <Link to="/" className="back-btn">
            Back to Home
          </Link>
          <a
            href={`http://localhost:5000${flipbook.pdfUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="download-btn"
          >
            Download Original PDF
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
