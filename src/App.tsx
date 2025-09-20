/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import PopupTable from "./components/PopupTable";
import { fetchGoogleSheetData } from "./service/GoogleSheet";

type MapOption = {
  value: string; // file name in public/
  labelField: string;
  label: string;
};

const mapOptions: MapOption[] = [
  { value: "Batas Kecamatan.geojson", labelField: "WADMKC", label: "Batas Kecamatan" },
  { value: "KEL GAROGA.geojson", labelField: "NAMOBJ", label: "Kecamatan Garoga" },
  { value: "KEL MUARA.geojson", labelField: "NAMOBJ", label: "Kecamatan Muara" },
  { value: "KEL PAGARAN.geojson", labelField: "NAMOBJ", label: "Kecamatan Pagaran" },
  { value: "KEL PAHAE JAE.geojson", labelField: "NAMOBJ", label: "Kecamatan Pahae Jae" },
  { value: "KEL PAHAE JULU.geojson", labelField: "NAMOBJ", label: "Kecamatan Pahae Julu" },
  { value: "KEL PANGARIBUAN.geojson", labelField: "NAMOBJ", label: "Kecamatan Pangaribuan" },
  { value: "KEL PARMONANGAN.geojson", labelField: "NAMOBJ", label: "Kecamatan Parmonangan" },
  { value: "KEL PURBA TUA.geojson", labelField: "NAMOBJ", label: "Kecamatan Purba Tua" },
  { value: "KEL SIATAS BARITA.geojson", labelField: "NAMOBJ", label: "Kecamatan Siatas Barita" },
  { value: "KEL SIBORONG BORONG.geojson", labelField: "NAMOBJ", label: "Kecamatan Siborong-Borong" },
  { value: "KEL SIMANGUMBAN.geojson", labelField: "NAMOBJ", label: "Kecamatan Simangumban" },
  { value: "KEL SIPAHUTAR.geojson", labelField: "NAMOBJ", label: "Kecamatan Sipahutar" },
  { value: "KEL SIPOHOLON NEW NEW.geojson", labelField: "NAMOBJ", label: "Kecamatan Sipoholon" },
  { value: "KEL TARUTUNG.geojson", labelField: "NAMOBJ", label: "Kecamatan Tarutung" },
  { value: "KEL ADIANKONTING.geojson", labelField: "NAMOBJ", label: "Kecamatan Adiankonting" },
];

// mapping manual kalau nama di geojson beda dengan label
const kecamatanMapping: Record<string, string> = {
  "GAROGA": "Kecamatan Garoga",
  "MUARA": "Kecamatan Muara",
  "PAGARAN": "Kecamatan Pagaran",
  "PAHAE JAE": "Kecamatan Pahae Jae",
  "PAHAE JULU": "Kecamatan Pahae Julu",
  "PANGARIBUAN": "Kecamatan Pangaribuan",
  "PARMONANGAN": "Kecamatan Parmonangan",
  "PURBA TUA": "Kecamatan Purba Tua",
  "SIATAS BARITA": "Kecamatan Siatas Barita",
  "SIBORONG BORONG": "Kecamatan Siborong-Borong",
  "SIMANGUMBAN": "Kecamatan Simangumban",
  "SIPAHUTAR": "Kecamatan Sipahutar",
  "SIPOHOLON": "Kecamatan Sipoholon",
  "TARUTUNG": "Kecamatan Tarutung",
  "ADIANKONTING": "Kecamatan Adiankonting",
};

export default function App() {
  const [selected, setSelected] = useState<MapOption>(mapOptions[0]);
  const [info, setInfo] = useState<{ properties?: any; isKecamatan?: boolean } | null>(null);
  const [popup, setPopup] = useState<{ title: string; data: any } | null>(null);

  const [sheetData, setSheetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // contoh fetch data eksternal
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchGoogleSheetData("Sipoholon");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // event handler klik peta
  useEffect(() => {
    const handler = async (e: any) => {
      const detail = e.detail || null;
      setInfo(detail);

      // khusus kalau lagi di Batas Kecamatan
      if (detail?.isKecamatan && selected.value === "Batas Kecamatan.geojson") {
        const namaKec: string = detail.properties?.WADMKC || "";
        if (namaKec) {
          // cari kecamatan sesuai mapping
          const mappedLabel = kecamatanMapping[namaKec.toUpperCase()];
          const target = mappedLabel
            ? mapOptions.find((o) => o.label === mappedLabel)
            : mapOptions.find((o) =>
                o.label.toLowerCase().includes(namaKec.toLowerCase())
              );

          if (target) {
            setSelected(target);
            setInfo(null); // reset detail biar pas klik ulang muncul data kecamatan
          }
        }
      }

      if (!detail?.isKecamatan && selected.value !== "Batas Kecamatan.geojson") {
        const kecamatanName: string = selected.label.replace("Kecamatan ", "");
        setLoading(true);
        try {
          const data = await fetchGoogleSheetData(kecamatanName);
          setSheetData(data);
        } catch (err) {
          console.error(err);
          setSheetData([]);
        } finally {
          setLoading(false);
        }
      }
    };

    const resetHandler = () => {
      setInfo(null);
    };

    window.addEventListener("feature-click", handler);
    window.addEventListener("layer-loaded", resetHandler);

    return () => {
      window.removeEventListener("feature-click", handler);
      window.removeEventListener("layer-loaded", resetHandler);
    };
  }, [selected]);

  const handleCategoryClick = (category: string, detail: any) => {
    const kecamatanName: string = selected.label.replace("Kecamatan ", "");
    const kelurahan = detail.properties?.NAMOBJ?.toUpperCase() || "";

    const desaData = sheetData.find(
      (row: any) => row.Nama_Desa?.toUpperCase() === kelurahan
    );

    if (!desaData) {
      alert(`Data tidak ditemukan untuk ${kelurahan} (${kecamatanName})`);
      return;
    }

    const entries = Object.entries(desaData);

    let slice: [string, any][] = [];

    switch (category) {
      case "Kategori 1": // C - AK
        slice = entries.slice(2, 37); // kolom C (index 2) s.d. AK (index 36)
        break;
      case "Kategori 2": // AL - BL
        slice = entries.slice(37, 64);
        break;
      case "Kategori 3": // BM - CQ
        slice = entries.slice(64, 95);
        break;
      case "Kategori 4": // CR - GY
        slice = entries.slice(95, 204);
        break;
      case "Kategori 5": // hanya GZ
        slice = entries.slice(204, 205);
        break;
      case "Kategori 6": // HA - HB
        slice = entries.slice(205, 207);
        break;
      case "Kategori 7": // HC - HI
        slice = entries.slice(207, 214);
        break;
    }

    // jadikan object kembali
    const kategoriData = Object.fromEntries(slice);


    setPopup({
      title: `Data kategori ${category} untuk ${kelurahan} (${kecamatanName})`,
      data: kategoriData,
    });
  };

  return (
    <div className="w-screen min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 p-4 flex items-center">
        <img src="/logo_taput.png" alt="Logo" className="h-10 mr-3" />
        <h1 className="text-lg font-semibold">
          TAPUTKAB.GO.ID - Portal Kabupaten Tapanuli Utara
        </h1>
      </header>

      <div className="flex flex-1 gap-2 p-2">
        {/* Sidebar kiri */}
        <aside className="w-1/5 bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 bg-gray-700 p-3 rounded text-center">99.865 Kecamatan</div>
          <div className="mb-4 bg-gray-700 p-3 rounded text-center">99.865 Kelurahan/Desa</div>
          <div className="mb-4 bg-gray-700 p-3 rounded text-center">33.047 Keluarga P3KE</div>
          <div className="bg-gray-700 p-3 rounded text-center">99.965 Penerima BPNT</div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <div className="flex justify-between bg-gray-800 p-3 rounded-lg mb-2">
            <div className="bg-gray-700 p-4 rounded text-center flex-1 mx-1">
              <h2 className="text-xl font-bold">23.579</h2>
              <p>Stunting</p>
            </div>
            <div className="bg-gray-700 p-4 rounded text-center flex-1 mx-1">
              <h2 className="text-xl font-bold">13.051</h2>
              <p>Berisiko Stunting</p>
            </div>
            <div className="flex-1 mx-1">
              <select
                onChange={(e) => {
                  const opt = mapOptions.find((o) => o.value === e.target.value);
                  if (opt) {
                    setSelected(opt);
                    setInfo(null); // reset side panel
                  }
                }}
                value={selected.value}
                className="w-full p-2 rounded bg-gray-700"
              >
                {mapOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <MapView selectedFile={selected.value} labelField={selected.labelField} />
          </div>
        </main>

        {/* Sidebar kanan */}
        <aside className="w-1/5 bg-gray-800 p-4 rounded-lg overflow-y-auto">
          <h3 className="font-bold mb-2">Detail Data Terpilih</h3>

          {loading ? (
            <p className="text-yellow-400">Loading data...</p>
          ) : !info ? (
            <p>Klik wilayah untuk melihat detail data</p>
          ) : selected.value === "Batas Kecamatan.geojson" ? (
            // === Masih level kabupaten ===
            <div>
              <strong>{info.properties?.WADMKC}</strong>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(info.properties, null, 2)}
              </pre>
            </div>
          ) : (
            // === Level kecamatan / kelurahan ===
            <div>
              <strong>{info.properties?.NAMOBJ}</strong>
              <div className="mt-4 grid grid-cols-1 gap-2">
                <button
                  className="text-black w-full py-2 rounded bg-[#ffc000] hover:bg-[#ffa600] transition"
                  onClick={() => handleCategoryClick("Kategori 1", info)}
                >
                  Kategori 1
                </button>

                <button
                  className="text-black w-full py-2 rounded bg-[#fff4cc] hover:bg-[#ffd27d] transition"
                  onClick={() => handleCategoryClick("Kategori 2", info)}
                >
                  Kategori 2
                </button>

                <button
                  className="text-black w-full py-2 rounded bg-[#fce4d4] hover:bg-[#ffc9a5] transition"
                  onClick={() => handleCategoryClick("Kategori 3", info)}
                >
                  Kategori 3
                </button>

                <button
                  className="text-black w-full py-2 rounded bg-[#c4e4b4] hover:bg-[#849474] transition"
                  onClick={() => handleCategoryClick("Kategori 4", info)}
                >
                  Kategori 4
                </button>

                <button
                  className="text-black w-full py-2 rounded bg-[#00b0f0] hover:bg-[#028dbf] transition"
                  onClick={() => handleCategoryClick("Kategori 5", info)}
                >
                  Kategori 5
                </button>

                <button
                  className="text-black w-full py-2 rounded bg-[#c55a11] hover:bg-[#9d470e] transition"
                  onClick={() => handleCategoryClick("Kategori 6", info)}
                >
                  Kategori 6
                </button>

                <button
                  className="text-black w-full py-2 rounded bg-[#deeaf6] hover:bg-[#b5d8fc] transition"
                  onClick={() => handleCategoryClick("Kategori 7", info)}
                >
                  Kategori 7
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
      {popup && (
        <PopupTable
          title={popup.title}
          data={popup.data}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
