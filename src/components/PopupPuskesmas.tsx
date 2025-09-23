interface PopupPuskesmasProps {
  onClose: () => void;
}

const puskesmasData = [
  {
    name: "Puskesmas Sitada-tada",
    img: "/articles/puskesmas/Puskesmas Sitadatada.jpg",
    address:
      "Jln. Puskesmas No. 11 Perumnas Pagarberingin Desa Pagarbatu Kec. Sipoholon",
  },
  {
    name: "Puskesmas Siatas Barita",
    img: "/articles/puskesmas/Puskesmas Siatas Barita.jpg",
    address: "Jln. Marhusa Panggabean Kec. Siatas Barita",
  },
  {
    name: "Puskesmas Aek Raja",
    img: "/articles/puskesmas/Puskesmas Aek Raja.jpg",
    address: "Jln. Onan Aek Raja Kec. Parmonangan",
  },
  {
    name: "Puskesmas Butar",
    img: "/articles/puskesmas/Puskesmas Butar.jpg",
    address: "Jln. Hutanamora Desa Banualuhu Kec. Pagaran",
  },
  {
    name: "Puskesmas Siborong-borong",
    img: "/articles/puskesmas/Puskesmas Siborongborong.jpg",
    address: "Jln. Pintu Air No. 1 Kec. Siborong-borong",
  },
  {
    name: "Puskesmas Onan Hasang",
    img: "/articles/puskesmas/Puskesmas Onan Hasang.jpg",
    address:
      "Jln. Sipirok Pahae km 18 Onan Hasang Kodepos : 22463 Kec. Pahae Julu",
  },
  {
    name: "Puskesmas Muara",
    img: "/articles/puskesmas/Puskesmas Muara.jpg",
    address: "Jln. Tanah Lapang Desa Hutuanagodang Kec. Muara",
  },
  {
    name: "Puskesmas Garoga",
    img: "/articles/puskesmas/Puskesmas Garoga.jpg",
    address: "Jln. Parluasan Kec. Garoga Kodepos : 22473",
  },
  {
    name: "Puskemas Paniaran",
    img: "/articles/puskesmas/Puskesmas Paniaran.jpg",
    address: "Jln. Tarutung km 7 Desa Paniaran Kec. Siborong-borong",
  },
  {
    name: "Puskesmas Hutabaginda",
    img: "/articles/puskesmas/Puskesmas Hutabaginda.jpg",
    address:
      "Jl. DR. TB. Simatupang no. 38 Kel. Hutatoruan VII Kec. Tarutung Kodepos : 22411",
  },
  {
    name: "Puskesmas Parsingkaman",
    img: "/articles/puskesmas/Puskesmas Parsingkam.jpg",
    address:
      "Jln. Tarutung-Sibolga km 33 Desa Pagaran Lambung I Kec. Adian Koting",
  },
  {
    name: "Puskesmas Janji Angkola",
    img: "/articles/puskesmas/Puskesmas Janji Angkola.jpg",
    address:
      "Jl. Gereja HKI Desa Pardomuan Janji Angkola Kec. Purbatua",
  },
  {
    name: "Puskesmas Situmeang Habinsaran",
    img: "/articles/puskesmas/Puskesmas Situmeang Habinsaran.jpg",
    address:
      "Jl. Pelajar Kode Pos : 22452 Kel. Situmeang Habinsaran Kec. Sipoholon",
  },
  {
    name: "Puskesmas Parmonangan",
    img: "/articles/puskesmas/Puskesmas Parmonangan.jpg",
    address: "Jl. Manalu Desa Desa Manalu Kec. Parmonangan",
  },
  {
    name: "Puskesmas Pangaribuan",
    img: "/articles/puskesmas/Puskesmas Pangaribuan.jpg",
    address: "Jl. Siliwangi Desa Pakpahan Kec. Pangaribuan",
  },
  {
    name: "Puskesmas Silangit",
    img: "/articles/puskesmas/Puskesmas Silangit.jpg",
    address: "Jl. Balige Km 5 Desa Pariksabungan Kec. Siborong-borong",
  },
  {
    name: "Puskesmas Sipahutar",
    img: "/articles/puskesmas/Puskesmas Sipahutar.jpg",
    address: "Jl. TD Pardede Sabung Nihuta 1 Kec. Sipahutar",
  },
];

export default function PopupPuskesmas({ onClose }: PopupPuskesmasProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-600 text-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] p-6 relative flex flex-col"
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
        <h2 className="text-2xl font-bold mb-4 text-center">
          Daftar Puskesmas
        </h2>

        {/* Grid foto dengan scroll */}
        <div className="grid grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto">
          {puskesmasData.map((puskesmas, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg shadow-md flex flex-col"
            >
              {/* Foto */}
              <img
                src={puskesmas.img}
                alt={puskesmas.name}
                className="w-full h-40 object-cover"
              />
              {/* Nama & Alamat */}
              <div className="p-3 flex flex-col gap-1 overflow-y-auto max-h-28">
                <h3 className="text-white font-bold text-sm">{puskesmas.name}</h3>
                <p className="text-gray-300 text-xs leading-snug break-words">
                  {puskesmas.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
