import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import HTMLFlipBook from "react-pageflip";
import { Toaster, toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

// Base URL for API requests
const API_URL = "http://localhost:5000/api";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-black text-white px-4 md:px-8 py-6 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Logo on the left */}
              <div className="mr-4">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 3V21"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 8H16.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 12H18"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 16H15"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">PDF Flipbook Creator</h1>
            </div>

            {/* Navigation on the right */}
            <nav className="flex gap-6">
              <Link to="/" className="font- hover:underline relative">
                Home
              </Link>
              <Link
                to="/upload"
                className="font-medium hover:underline relative"
              >
                Upload PDF
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<RecentFlipbooks />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/flipbook/:id" element={<FlipbookViewer />} />
          </Routes>
        </main>

        <footer className="bg-gray-200 text-gray-600 py-4 text-center mt-auto">
          <p>&copy; {new Date().getFullYear()} PDF Flipbook Creator</p>
        </footer>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </Router>
  );
}

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
        // toast.success("Flipbooks loaded successfully");
      } catch (err) {
        setError("Failed to fetch recent flipbooks");
        setLoading(false);
        toast.error("Failed to load flipbooks");
        console.error(err);
      }
    };

    fetchRecentFlipbooks();
  }, []);

  const deleteFlip = async (id) => {
    try {
      const confirmed = window.confirm("Are You Sure");
      console.log("id", id);
      if (!confirmed) return;
      await axios.delete(`${API_URL}/flipbooks/${id}`);
      toast.success("Flipbook Deleted Successfully");
      window.location.href = "/";
    } catch (error) {
      console.log(error);
      toast.error("Flipbook Deleted");
    }
  };

  if (loading)
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        Loading recent flipbooks...
      </div>
    );
  if (error)
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8 text-black">Recent Flipbooks</h2>
      {flipbooks.length === 0 ? (
        <Alert className="my-4">
          <AlertTitle>No flipbooks available</AlertTitle>
          <AlertDescription>
            You haven't created any flipbooks yet.
            <Button variant="link" asChild className="p-0 h-auto font-normal">
              <Link to="/upload">Upload one now!</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {flipbooks.map((book) => (
            <Card key={book.publicId} className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src={`http://localhost:5000/uploads/images/${book.publicId}/page-01.png`}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>
                  Created: {new Date(book.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild>
                  <Link to={`/flipbook/${book.publicId}`}>View Flipbook</Link>
                </Button>
                <Button onClick={() => deleteFlip(book.publicId)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [flipbookId, setFlipbookId] = useState(null);
  const [title, setTitle] = useState("");

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          // Set title from filename by default
          const fileName = acceptedFiles[0].name;
          setTitle(fileName.replace(".pdf", ""));
        }
      },
    });

  const uploadPdf = async () => {
    if (!acceptedFiles.length) {
      toast.error("Please select a PDF file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("pdf", acceptedFiles[0]);
    formData.append(
      "title",
      title || acceptedFiles[0].name.replace(".pdf", "")
    );

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
      toast.success("PDF uploaded successfully!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Upload failed";
      setUploadError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8 text-black">
        Upload PDF to Create Flipbook
      </h2>

      {!uploadSuccess && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose PDF File</CardTitle>
              <CardDescription>
                Drag and drop or select a PDF file to convert to a flipbook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer transition hover:border-black hover:bg-gray-50 mb-6 ${
                  isDragActive ? "border-black bg-gray-50" : ""
                }`}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p className="text-lg">Drop the PDF file here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">
                      Drag & drop a PDF file here, or click to select
                    </p>
                    <p className="text-gray-600 text-sm">
                      Maximum file size: 20MB
                    </p>
                  </div>
                )}
              </div>

              {acceptedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p>
                      Selected file: {acceptedFiles[0].name} (
                      {(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Flipbook Title
                    </label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title for your flipbook"
                    />
                  </div>

                  <Button
                    onClick={uploadPdf}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? "Uploading..." : "Create Flipbook"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {uploading && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center">{uploadProgress}% uploaded</p>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Upload Failed</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {uploadSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Upload Successful!</CardTitle>
            <CardDescription>
              Your PDF has been converted to a flipbook
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to={`/flipbook/${flipbookId}`}>View Your Flipbook</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUploadSuccess(false);
                setFlipbookId(null);
              }}
            >
              Upload Another PDF
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function FlipbookViewer() {
  const [flipbook, setFlipbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const flipbookRef = React.useRef(null);
  const [flipbookKey, setFlipbookKey] = useState(0);

  // Get the flipbook ID from the URL
  const id = window.location.pathname.split("/").pop();

  useEffect(() => {
    const fetchFlipbook = async () => {
      try {
        const response = await axios.get(`${API_URL}/flipbooks/${id}`);
        setFlipbook(response.data);
        setLoading(false);
        // toast.success("Flipbook loaded successfully");
      } catch (err) {
        setError("Failed to load flipbook");
        setLoading(false);
        toast.error("Failed to load flipbook");
        console.error(err);
      }
    };

    if (id) {
      fetchFlipbook();
    }
  }, [id]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      setIsFullscreen(!!isNowFullscreen);

      // Force flipbook to rerender after exiting fullscreen
      if (!isNowFullscreen) {
        setTimeout(() => {
          setFlipbookKey((prev) => prev + 1);
        }, 300); // Allow a brief moment to exit fullscreen before rerender
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = () => {
    const element = flipbookRef.current;

    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const handlePageChange = (e) => {
    setCurrentPage(e.data);
  };

  if (loading)
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        Loading flipbook...
      </div>
    );
  if (error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!flipbook)
    return (
      <Alert variant="destructive">
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Flipbook not found</AlertDescription>
      </Alert>
    );

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {flipbook.title}
          </CardTitle>
          <CardDescription className="text-center">
            Created: {new Date(flipbook.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      <div
        ref={flipbookRef}
        className={`flex flex-col items-center my-8 ${
          isFullscreen ? "fixed inset-0 z-50 bg-gray-900 pt-8" : "min-h-96"
        }`}
      >
        {isFullscreen && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M8 3v4a2 2 0 0 1-2 2H2"></path>
                <path d="M16 3v4a2 2 0 0 0 2 2h4"></path>
                <path d="M8 21v-4a2 2 0 0 0-2-2H2"></path>
                <path d="M16 21v-4a2 2 0 0 1 2-2h4"></path>
              </svg>
              <span className="ml-2">Exit Fullscreen</span>
            </Button>
          </div>
        )}

        <HTMLFlipBook
          key={flipbookKey}
          width={isFullscreen ? 800 : 550}
          height={isFullscreen ? 1066 : 733}
          size="stretch"
          minWidth={315}
          maxWidth={isFullscreen ? 1200 : 1000}
          minHeight={400}
          maxHeight={isFullscreen ? 1600 : 1533}
          drawShadow={true}
          flippingTime={1000}
          className={`shadow-xl ${isFullscreen ? "mt-6" : ""}`}
          startPage={0}
          onFlip={handlePageChange}
        >
          {flipbook.images.map((imagePath, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 overflow-hidden"
            >
              <img
                src={`http://localhost:5000${imagePath}`}
                alt={`Page ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </HTMLFlipBook>

        <div className={`mt-6 ${isFullscreen ? "text-white" : ""}`}>
          <p className="text-center mb-2">
            Page {currentPage + 1} of {flipbook.images.length}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-center text-gray-600 mb-2">
            Page {currentPage + 1} of {flipbook.images.length}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
          <Button
            variant="outline"
            onClick={toggleFullscreen}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
              <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
              <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
              <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
            </svg>
            {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </Button>
          <Button asChild>
            <a
              href={`http://localhost:5000${flipbook.pdfUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Original PDF
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
