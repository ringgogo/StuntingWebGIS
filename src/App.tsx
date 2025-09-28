/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import PopupTable from "./components/PopupTable";
import PopupBalai from "./components/PopupBalai";
import { fetchGoogleSheetData } from "./service/GoogleSheet";
import PopupPuskesmas from "./components/PopupPuskesmas";
import { BookOpen } from "lucide-react";

type MapOption = {
  value: string;
  labelField: string;
  label: string;
};

type TotalData = {
  bst: string;
  bnpt: string;
  pkh: string;
  sembako: string;
  prakerja: string;
  kur: string;
  cbp: string;
  data_stunting: string;
  beresiko_stunting: string;
  wasting: string;
  under_weight: string;
}

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
  { value: "KEL SIPOHOLON.geojson", labelField: "NAMOBJ", label: "Kecamatan Sipoholon" },
  { value: "KEL TARUTUNG.geojson", labelField: "NAMOBJ", label: "Kecamatan Tarutung" },
  { value: "KEL ADIANKOTING.geojson", labelField: "NAMOBJ", label: "Kecamatan Adiankoting" },
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
  "ADIANKOTING": "Kecamatan Adiankoting",
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

  const [totalData, setTotalData] = useState<TotalData | null>(null);
  const [grandTotal, setGrandTotal] = useState<TotalData | null>(null);

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
            setInfo(null);
          }
        }
      }

      if (!detail?.isKecamatan && selected.value !== "Batas Kecamatan.geojson") {
        const namaDesa: string = detail.properties?.NAMOBJ || "";
        if (namaDesa) {
          setSelectedKelurahan(namaDesa.toUpperCase());
        }

        const kecamatanName: string = selected.label.replace("Kecamatan ", "");
        setLoading(true);
        try {
          const data = await fetchGoogleSheetData(kecamatanName);
          setSheetData(data);

          if (data.length > 0) {
            const desaData = data.find(
              (row: any) => row.Nama_Desa?.toUpperCase() === namaDesa
            );
            setTotalData(extractTotalData(desaData));
          }
          console.log(totalData)
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
    const kelurahanName = selectedKelurahan.toUpperCase();

    if (kelurahanName) {
      setSelectedKelurahan(kelurahanName);
    }

    setLoading(true);
    fetchGoogleSheetData(kecamatanName)
      .then((data) => {
        setSheetData(data);

        const desaData = data.find(
          (row: any) => row.Nama_Desa?.toUpperCase() === kelurahanName
        );

        if (desaData) {
          setTotalData(extractTotalData(desaData));
        } else {
          setTotalData(null);
        }
      })
      .catch((err) => {
        console.error(err);
        setSheetData([]);
        setTotalData(null);
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
      case "Fasilitas Pelayanan": 
        slice = entries.slice(2, 28); 
        break;
      case "Sasaran Pelayanan Pencegahan dan Percepatan Penurunan Stunting":
        slice = entries.slice(28, 47);
        break;
      case "Pelayanan Masyarakat":
        slice = entries.slice(47, 96);
        break;
      case "Jumlah Pelayanan KB":
        slice = entries.slice(96, 137);
        break;
      case "Indikator Layanan":
        slice = entries.slice(137, 161);
        break;
      case "Dasa Wisma TP PKK":
        slice = entries.slice(161, 267);
        break;
      case "Kasus Kekerasan":
        slice = entries.slice(267, 269);
        break;
      case "Jumlah Penerima Bantuan":
        slice = entries.slice(269, 276);
        break;
    }

    const kategoriData = Object.fromEntries(slice);

    setPopup({
      title: `Data kategori ${category} untuk ${kelurahan} (${kecamatanName})`,
      data: kategoriData,
    });
  };

  const toNumber = (val: any) => {
    if (val === "" || val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  function sumTotalData(allData: any[]): Record<string, number> {
    return allData.reduce((acc, desa) => {
      const t = extractTotalData(desa);
      acc.bst += toNumber(t.bst);
      acc.bnpt += toNumber(t.bnpt);
      acc.pkh += toNumber(t.pkh);
      acc.sembako += toNumber(t.sembako);
      acc.prakerja += toNumber(t.prakerja);
      acc.kur += toNumber(t.kur);
      acc.cbp += toNumber(t.cbp);
      acc.data_stunting += toNumber(t.data_stunting);
      acc.beresiko_stunting += toNumber(t.beresiko_stunting);
      acc.wasting += toNumber(t.wasting);
      acc.under_weight += toNumber(t.under_weight);
      return acc;
    }, { bst: 0, bnpt: 0, pkh: 0, sembako: 0, prakerja: 0, kur: 0, cbp: 0, data_stunting: 0, beresiko_stunting: 0, wasting: 0, under_weight: 0});
  }

  function extractTotalData(desaData: any): TotalData {
    if (!desaData) {
      return {
        bst: "",
        bnpt: "",
        pkh: "",
        sembako: "",
        prakerja: "",
        kur: "",
        cbp: "",
        data_stunting: "",
        beresiko_stunting: "",
        wasting: "",
        under_weight: "",
      };
    }

    const entries = Object.entries(desaData);
    const slice = entries.slice(269, 276);


    return {
      bst: String(slice[0]?.[1] ?? ""),
      bnpt: String(slice[1]?.[1] ?? ""),
      pkh: String(slice[2]?.[1] ?? ""),
      sembako: String(slice[3]?.[1] ?? ""),
      prakerja: String(slice[4]?.[1] ?? ""),
      kur: String(slice[5]?.[1] ?? ""),
      cbp: String(slice[6]?.[1] ?? ""),
      data_stunting: String(entries[44]?.[1] ?? ""),
      beresiko_stunting: String(entries[137]?.[1] ?? ""),
      wasting: String(entries[46]?.[1] ?? ""),
      under_weight: String(entries[45]?.[1] ?? ""),
    };
  }

  useEffect(() => {
    const loadTotalAllKecamatan = async () => {
      setLoading(true);
      try {
        const kecamatanOptions = mapOptions.filter(
          (o) => o.value !== "Batas Kecamatan.geojson"
        );

        const allTotals: Record<string, number>[] = [];

        // loop fetch per kecamatan
        for (const kec of kecamatanOptions) {
          const kecName = kec.label.replace("Kecamatan ", "");
          const data = await fetchGoogleSheetData(kecName);
          const totalSum = sumTotalData(data);
          allTotals.push(totalSum);
        }

        // sum semua kecamatan
        const grandTotal = allTotals.reduce(
          (acc, t) => {
            acc.bst += t.bst;
            acc.bnpt += t.bnpt;
            acc.pkh += t.pkh;
            acc.sembako += t.sembako;
            acc.prakerja += t.prakerja;
            acc.kur += t.kur;
            acc.cbp += t.cbp;
            acc.data_stunting += t.data_stunting;
            acc.beresiko_stunting += t.beresiko_stunting;
            acc.under_weight += t.under_weight;
            acc.wasting += t.wasting;
            return acc;
          },
          { bst: 0, bnpt: 0, pkh: 0, sembako: 0, prakerja: 0, kur: 0, cbp: 0, data_stunting: 0, beresiko_stunting: 0, wasting: 0, under_weight: 0 }
        );

        const grandTotalData: TotalData = {
          bst: String(grandTotal.bst),
          bnpt: String(grandTotal.bnpt),
          pkh: String(grandTotal.pkh),
          sembako: String(grandTotal.sembako),
          prakerja: String(grandTotal.prakerja),
          kur: String(grandTotal.kur),
          cbp: String(grandTotal.cbp),
          data_stunting: String(grandTotal.data_stunting),
          beresiko_stunting: String(grandTotal.beresiko_stunting),
          wasting: String(grandTotal.wasting),
          under_weight: String(grandTotal.under_weight),
        };

        setGrandTotal(grandTotalData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTotalAllKecamatan();
  }, []);


  return (
    <div className="w-screen min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-800 p-4 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <img
              src="/logo_taput.png"
              alt="Logo"
              className="h-14 w-14 object-contain drop-shadow-lg"
            />
            <div>
              <div className="text-md lg:text-2xl font-extrabold tracking-wide text-white">
                HUTA SEHAT
              </div>
              <p className="text-xs lg:text-sm text-gray-300">
                Hidup Unggul Tapanuli, Sistem Elektronik Hapus Stunting
              </p>
            </div>
          </div>
          <div>
            <a
              href="/https://drive.google.com/file/d/1vAE72bD-Mgt91CTidN6L_7SM-jSwqurK/view"
              className="text-gray-300 hover:text-white transition-colors"
              title="Buku Stunting"
            >
              <BookOpen className="w-7 h-7" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 gap-2 p-2">
        {/* Sidebar kiri */}
        <aside className="top-0 left-0 lg:w-1/5 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto bg-gray-800 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {[
              { label: "Jumlah Penerima BNPT", value: grandTotal?.bnpt || 'xxxx', color: "from-[#0f2027] to-[#2c5364]" },
              { label: "Jumlah Penerima BST", value: grandTotal?.bst || 'xxxx', color: "from-[#09203f] to-[#537895]" },
              { label: "Jumlah Penerima PKH", value: grandTotal?.pkh || 'xxxx', color: "from-[#1e3c72] to-[#2a5298]" },
              { label: "Jumlah Penerima Sembako", value: grandTotal?.sembako || 'xxxx', color: "from-[#141e30] to-[#243b55]" },
              { label: "Jumlah Penerima Prakerja", value: grandTotal?.prakerja || 'xxxx', color: "from-[#2c3e50] to-[#3498db]" },
              { label: "Jumlah Penerima KUR", value: grandTotal?.kur || 'xxxx', color: "from-[#000428] to-[#004e92]" },
              { label: "Jumlah Penerima CBP", value: grandTotal?.cbp || 'xxxx', color: "from-[#283e51] to-[#485563]" },
            ].map((item) => (
              <div
                key={item.label}
                className={`px-4 py-2 rounded-xl shadow-md bg-gradient-to-r ${item.color} transform hover:scale-[1.02] transition`}
              >
                <h2 className="text-xl font-extrabold text-white drop-shadow">{item.value}</h2>
                <p className="text-sm text-white/90">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Balai */}
          <div className="flex flex-col gap-4 items-center justify-center p-6 
            bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 
            rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white text-center">
              Informasi Balai Penyuluhan Stunting
            </h2>

            {/* List Balai */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="bg-gray-700 rounded-lg shadow-md overflow-hidden w-full max-w-xs hidden md:block">
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
              <div className="bg-gray-700 rounded-lg shadow-md overflow-hidden w-full max-w-xs hidden md:block">
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
              onClick={() =>
                window.open(
                  "https://docs.google.com/document/d/1WQ6g-LgzycKHi_RhWzkl5l0ouR-Vr84f/edit?usp=sharing&ouid=106512193936314426030&rtpof=true&sd=true",
                  "_blank"
                )
              }
              className="mt-4 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition"
            >
              Baca Selengkapnya
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col">
          <div className="flex flex-col lg:flex-row justify-between bg-gray-800 p-3 rounded-lg mb-2 gap-3">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div className="py-2 px-1 rounded-xl bg-gray-700 shadow-2xl border border-gray-600 text-center transition-transform transform hover:-translate-y-1 flex flex-col justify-center items-center">
                <h2 className="text-lg font-bold text-white">{grandTotal?.data_stunting || "XXXX"}</h2>
                <p className="text-gray-300 mt-1">Jumlah Data Stunting</p>
              </div>
              <div className="py-2 px-1 rounded-xl bg-gray-700 shadow-2xl border border-gray-600 text-center transition-transform transform hover:-translate-y-1 flex flex-col justify-center items-center">
                <h2 className="text-lg font-bold text-white">{grandTotal?.beresiko_stunting || "XXXX"}</h2>
                <p className="text-gray-300 mt-1">Keluarga Berisiko Stunting</p>
              </div>
              <div className="py-2 px-1 rounded-xl bg-gray-700 shadow-2xl border border-gray-600 text-center transition-transform transform hover:-translate-y-1 flex flex-col justify-center items-center">
                <h2 className="text-lg font-bold text-white">{grandTotal?.under_weight || "XXXX"}</h2>
                <p className="text-gray-300 mt-1">Jumlah Anak Yang Mengalami Under Weight</p>
              </div>
              <div className="py-2 px-1 rounded-xl bg-gray-700 shadow-2xl border border-gray-600 text-center transition-transform transform hover:-translate-y-1 flex flex-col justify-center items-center">
                <h2 className="text-lg font-bold text-white">{grandTotal?.wasting || "XXXX"}</h2>
                <p className="text-gray-300 mt-1">Jumlah Anak Yang Mengalami Wasting</p>
              </div>
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
                  <label className="text-gray-300 font-medium">Pilih Desa / Kelurahan</label>
                  <select
                    onChange={(e) => setSelectedKelurahan(e.target.value)}
                    value={selectedKelurahan}
                    className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="">-- Pilih Desa / Kelurahan --</option>
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
        <aside className="w-full lg:w-1/5 bg-gray-800 p-4 rounded-lg h-auto lg:h-[calc(100vh-8rem)] lg:overflow-y-auto flex flex-col">
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
                <h2 className="text-lg font-bold text-center mb-3">
                  {info.properties?.NAMOBJ}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {/* Data Stunting */}
                  <div className="p-4 rounded-lg bg-gray-900 shadow-md border border-gray-700 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
                    <h2 className="text-base font-bold text-white">
                      {totalData?.data_stunting || "xxxx"}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Jumlah Data Stunting</p>
                  </div>

                  {/* Keluarga Berisiko */}
                  <div className="p-4 rounded-lg bg-gray-900 shadow-md border border-gray-700 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
                    <h2 className="text-base font-bold text-white">
                      {totalData?.beresiko_stunting || "xxxx"}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Keluarga Berisiko Stunting</p>
                  </div>

                  {/* Wasting */}
                  <div className="p-4 rounded-lg bg-gray-900 shadow-md border border-gray-700 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
                    <h2 className="text-base font-bold text-white">
                      {totalData?.wasting || "xxxx"}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Jumlah Anak Mengalami Wasting</p>
                  </div>

                  {/* Under Weight */}
                  <div className="p-4 rounded-lg bg-gray-900 shadow-md border border-gray-700 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform">
                    <h2 className="text-base font-bold text-white">
                      {totalData?.under_weight || "xxxx"}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">Jumlah Anak Mengalami Under Weight</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  {/* Kolom kiri */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.bnpt || 'xxxx'} <span className="font-semibold">Penerima BNPT</span>
                    </div>
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.bst || 'xxxx'} <span className="font-semibold">Penerima BST</span>
                    </div>
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.pkh || 'xxxx'} <span className="font-semibold">Penerima PKH</span>
                    </div>
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.cbp || 'xxxx'} <span className="font-semibold">Penerima CBP</span>
                    </div>
                  </div>

                  {/* Kolom kanan */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.sembako || 'xxxx'} <span className="font-semibold">Penerima Sembako</span>
                    </div>
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.prakerja || 'xxxx'} <span className="font-semibold">Penerima Prakerja</span>
                    </div>
                    <div className="bg-blue-50 text-blue-900 rounded-lg px-4 py-2 text-sm shadow-sm">
                      {totalData?.kur || 'xxxx'} <span className="font-semibold">Penerima KUR</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  {[
                    { label: "Fasilitas Pelayanan", gradient: "from-[#1e3c72] to-[#2a5298]" },
                    { label: "Sasaran Pelayanan Pencegahan dan Percepatan Penurunan Stunting", gradient: "from-[#434343] to-[#000000]" },
                    { label: "Pelayanan Masyarakat", gradient: "from-[#232526] to-[#414345]" }, 
                    { label: "Jumlah Pelayanan KB", gradient: "from-[#283E51] to-[#485563]" }, 
                    { label: "Indikator Layanan", gradient: "from-[#0f2027] to-[#203a43] to-[#2c5364]" },
                    { label: "Dasa Wisma TP PKK", gradient: "from-[#141E30] to-[#243B55]" }, 
                    { label: "Kasus Kekerasan", gradient: "from-[#2c3e50] to-[#4ca1af]" }, 
                    { label: "Jumlah Penerima Bantuan", gradient: "from-[#283048] to-[#859398]" },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCategoryClick(item.label, info)}
                      className={`
                        bg-gradient-to-r ${item.gradient} 
                        text-white w-full py-3 px-4 rounded-xl 
                        shadow-md font-medium text-sm tracking-wide
                        transition transform hover:scale-[1.03] active:scale-[0.97]
                        hover:shadow-lg
                      `}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700 text-gray-300 space-y-1">
            <h3 className="font-bold text-xs">Sekretariat Tim Pencegahan dan Percepatan Penurunan Stunting</h3>
            <p className="leading-relaxed text-[9px]">Dinas Pengendalian Penduduk, Keluarga Berencana,</p>
            <p className="leading-relaxed text-[9px]">Pemberdayaan Perempuan dan Perlindungan Anak</p>
            <p className="leading-relaxed text-[9px]">Jl. JCT. Simorangkir No. 4 Tarutung</p>
            <p className="leading-relaxed text-[9px]">Kabupaten Tapanuli Utara</p>
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
