/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import PopupTable from "./components/PopupTable";
import PopupBalai from "./components/PopupBalai";
import { fetchGoogleSheetData } from "./service/GoogleSheet";
import PopupPuskesmas from "./components/PopupPuskesmas";

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
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("");
  const [info, setInfo] = useState<{ properties?: any; isKecamatan?: boolean } | null>(null);

  const [popup, setPopup] = useState<{ title: string; data: any } | null>(null);
  const [popupBalai, setPopupBalai] = useState<boolean>(false);
  const [popupPuskesmas, setPopupPuskesmas] = useState<boolean>(false);

  const [sheetData, setSheetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const res = await fetch("/areas.json");
        const data = await res.json();
        setAreas(data);
      } catch (err) {
        console.error("Gagal load areas.json", err);
      }
    };
    loadAreas();
  }, []);

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

  useEffect(() => {
    if (!selectedKelurahan) return;

    // bentuk info mirip hasil klik geojson
    const fakeDetail = {
      properties: {
        NAMOBJ: selectedKelurahan,
      },
      isKecamatan: false,
    };

    setInfo(fakeDetail);

    const kecamatanName: string = selected.label.replace("Kecamatan ", "");

    setLoading(true);
    fetchGoogleSheetData(kecamatanName)
      .then((data) => {
        setSheetData(data);
      })
      .catch((err) => {
        console.error(err);
        setSheetData([]);
      })
      .finally(() => setLoading(false));
  }, [selectedKelurahan, selected]);

  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
      <header className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-800 p-4 flex items-center">
        <div className="flex items-center space-x-3">
          <img
            src="/logo_taput.png"
            alt="Logo"
            className="h-14 w-14 object-contain drop-shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide text-white">
              HUTA SEHAT
            </h1>
            <p className="text-sm text-gray-300">
              Hidup Unggul Tapanuli, Sistem Elektronik Hapus Stunting
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-2 p-2">
        {/* Sidebar kiri */}
        <aside className="top-0 left-0 w-1/5 h-[calc(100vh-8rem)] overflow-y-auto bg-gray-800 p-4 rounded-lg space-y-4">
          {[
            { label: "Jumlah Penerima BNPT", value: "99.865", color: "from-[#0f2027] to-[#2c5364]" },
            { label: "Jumlah Penerima BST", value: "99.865", color: "from-[#09203f] to-[#537895]" },
            { label: "Jumlah Penerima PKH", value: "33.047", color: "from-[#1e3c72] to-[#2a5298]" },
            { label: "Jumlah Penerima Sembako", value: "99.965", color: "from-[#141e30] to-[#243b55]" },
            { label: "Jumlah Penerima Prakerja", value: "99.965", color: "from-[#2c3e50] to-[#3498db]" },
            { label: "Jumlah Penerima KUR", value: "99.965", color: "from-[#000428] to-[#004e92]" },
            { label: "Jumlah Penerima CBP", value: "99.965", color: "from-[#283e51] to-[#485563]" },
          ].map((item) => (
            <div
              key={item.label}
              className={`px-4 py-2 rounded-xl shadow-md bg-gradient-to-r ${item.color} transform hover:scale-[1.02] transition`}
            >
              <h2 className="text-xl font-extrabold text-white drop-shadow">{item.value}</h2>
              <p className="text-sm text-white/90">{item.label}</p>
            </div>
          ))}

          {/* Balai */}
          <div className="flex flex-col gap-4 items-center justify-center p-6 
            bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 
            rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white text-center">
              Informasi Balai Penyuluhan Stunting
            </h2>

            {/* List Balai */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="bg-gray-700 rounded-lg shadow-md overflow-hidden w-full max-w-xs">
                <img
                  src="/articles/balai/Balai KB Pahae Julu.jpg"
                  alt="Balai KB Pahae Julu"
                  className="w-full h-24 object-cover"
                />
                <div className="p-2 text-center text-gray-300 text-sm">
                  Jl. Sipirok-Tarutung
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg shadow-md overflow-hidden w-full max-w-xs">
                <img
                  src="/articles/balai/Balai KB Pangaribuan.jpg"
                  alt="Balai KB Pangaribuan"
                  className="w-full h-24 object-cover"
                />
                <div className="p-2 text-center text-gray-300 text-sm">
                  Jl. Siliwangi Desa Pakpahan
                </div>
              </div>
            </div>

            <button
              onClick={() => setPopupBalai(true)}
              className="mt-4 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition"
            >
              Baca Selengkapnya
            </button>
          </div>


          {/* Puskesmas */}
          <div className="flex flex-col gap-4 items-center justify-center p-6 
            bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 
            rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white">
              Informasi Puskesmas
            </h2>

            {/* List Puskesma */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="bg-gray-700 rounded-lg shadow-md overflow-hidden w-full max-w-xs">
                <img
                  src="/articles/puskesmas/Puskesmas Garoga.jpg"
                  alt="Puskesmas Garoga"
                  className="w-full h-24 object-cover"
                />
                <div className="p-2 text-center text-gray-300 text-sm">
                  Jln. Parluasan
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg shadow-md overflow-hidden w-full max-w-xs">
                <img
                  src="/articles/puskesmas/Puskesmas Muara.jpg"
                  alt="Puskesmas Muara"
                  className="w-full h-24 object-cover"
                />
                <div className="p-2 text-center text-gray-300 text-sm">
                  Jln. Tanah Lapang Desa Hutuanagodang
                </div>
              </div>
            </div>

            <button
              onClick={() => setPopupPuskesmas(true)}
              className="mt-4 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition"
            >
              Baca Selengkapnya
            </button>
          </div>

          {/* Aksi Konvergensi */}
          <div className="flex flex-col gap-4 items-center justify-center p-6 
            bg-gradient-to-br from-sky-950 via-sky-700 to-sky-950
            rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white text-center">
              Aksi Konvergensi  Pencegahan  dan Percepatan Penurunan Stunting
            </h2>

            {/* List Puskesma */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-justify">
              Aksi konvergensi pencegahan dan percepatan penurunan stunting Kabupaten Tapanuli Utara meliputi:.....
            </div>

            <button
              onClick={() => setPopupPuskesmas(true)}
              className="mt-4 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition"
            >
              Baca Selengkapnya
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <div className="flex justify-between bg-gray-800 p-3 rounded-lg mb-2 gap-3">
            <div className="flex-1 mx-1 p-6 rounded-lg bg-gray-700 shadow-md border border-gray-600 text-center transition-transform transform hover:-translate-y-1 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-white">23.579</h2>
              <p className="text-gray-300 mt-1">Jumlah Data Stunting</p>
            </div>
            <div className="flex-1 mx-1 p-6 rounded-lg bg-gray-700 shadow-md border border-gray-600 text-center transition-transform transform hover:-translate-y-1 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-bold text-white">13.051</h2>
              <p className="text-gray-300 mt-1">Keluarga Berisiko Stunting</p>
            </div>
            <div className="flex-1 flex flex-col mx-1 gap-4">
              {/* Dropdown Kecamatan */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-300 font-medium">Pilih Kecamatan</label>
                <select
                  onChange={(e) => {
                    const opt = mapOptions.find((o) => o.value === e.target.value);
                    if (opt) {
                      setSelected(opt);
                      setInfo(null); // reset side panel
                    }
                  }}
                  value={selected.value}
                  className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {mapOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Kelurahan */}
              {selected.value !== "Batas Kecamatan.geojson" && (
                <div className="flex flex-col gap-1">
                  <label className="text-gray-300 font-medium">Pilih Kelurahan</label>
                  <select
                    onChange={(e) => setSelectedKelurahan(e.target.value)}
                    value={selectedKelurahan}
                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">-- Pilih Kelurahan --</option>
                    {(areas[selected.label.replace("Kecamatan ", "")] || []).map((kel) => (
                      <option key={kel} value={kel}>
                        Kelurahan {capitalizeWords(kel)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <MapView selectedFile={selected.value} labelField={selected.labelField} />
          </div>
        </main>

        {/* Sidebar kanan */}
        <aside className="w-1/5 bg-gray-800 p-4 rounded-lg overflow-y-auto flex flex-col">
          <div className="flex-1 overflow-y-auto">
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
          </div>
          <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700 text-gray-300 space-y-1">
            <h3 className="font-bold text-lg">Sekretariat Tim Pencegahan dan Percepatan Penurunan Stunting</h3>
            <p className="leading-relaxed">Dinas Pengendalian Penduduk, Keluarga Berencana,</p>
            <p className="leading-relaxed">Pemberdayaan Perempuan dan Perlindungan Anak</p>
            <p className="leading-relaxed">Jl. JCT. Simorangkir No. 4 Tarutung</p>
            <p className="leading-relaxed">Kabupaten Tapanuli Utara</p>
          </div>
        </aside>
      </div>
      {popup && (
        <PopupTable
          title={popup.title}
          data={popup.data}
          onClose={() => setPopup(null)}
        />
      )}

      {popupBalai && (
        <PopupBalai
          onClose={() => setPopupBalai(false)}
        />
      )}

      {popupPuskesmas && (
        <PopupPuskesmas
          onClose={() => setPopupPuskesmas(false)}
        />
      )}
    </div>
  );
}
