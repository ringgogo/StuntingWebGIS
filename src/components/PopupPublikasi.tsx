import { useEffect, useState } from "react";

interface PopupPublikasiProps {
  onClose: () => void;
}

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink: string;
  webViewLink: string;
}

export default function PopupPublikasi({ onClose }: PopupPublikasiProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);

  const FOLDER_ID = import.meta.env.VITE_DRIVE_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

  useEffect(() => {
    async function fetchDriveFiles() {
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}' in parents and mimeType contains 'image/'&fields=files(id,name,thumbnailLink,webViewLink)&key=${API_KEY}`
        );
        const data = await res.json();
        setFiles(data.files || []);
      } catch (err) {
        console.error("Error fetching Drive files:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDriveFiles();
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-600 text-white rounded-2xl shadow-2xl max-w-6xl w-4/5 lg:w-full max-h-[90vh] p-6 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-red-700 hover:bg-red-600 text-white rounded-full p-2 shadow transition"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-2 text-left">
          Daftar Publikasi Stunting
        </h2>
        <div 
          className="text-md mb-4 text-blue-500 hover:text-blue-300 cursor-pointer"
          onClick=
          {
            () =>
              window.open(
                "https://drive.google.com/drive/folders/1pfMPxd97XzldGQ2YEfTmL49hMBGFLbnT",
                "_blank"
              )
          }
        >
          Baca Selengkapnya
        </div>

        {loading ? (
          <p className="text-center text-gray-300">Memuat data dari Google Drive...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-800 rounded-lg shadow-md flex flex-col transform transition-transform duration-300 ease-out hover:scale-95"
              >
                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`}
                    alt={file.name.replace(/\.[^/.]+$/, "")}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                </a>
                <div className="p-3">
                  <h3 className="text-white font-bold text-sm">{file.name.replace(/\.[^/.]+$/, "")}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
