interface PopupBalaiProps {
  onClose: () => void;
}

const balaiData = [
  {
    name: "Balai Sipoholon",
    img: "/articles/balai/Balai KB Sipoholon.jpg",
    address: "Jl. Pancasila No. 7 Desa Hutauruk Kec. Sipoholon",
  },
  {
    name: "Balai Muara",
    img: "/articles/balai/Balai KB Muara.jpg",
    address: "Jl. RM. Aritonang No. 1 Desa Hutanagodang Kec. Muara",
  },
  {
    name: "Balai Purbatua",
    img: "/articles/balai/Balai KB Sitadatada.jpg",
    address:
      "Jl. Ir. Mananti Sitompul Desa Parsoaran Janji Angkola Kec. Purbatua",
  },
  {
    name: "Balai Simangumban",
    img: "/articles/balai/Balai KB Simangumban.jpg",
    address:
      "Jl. Sipirok Tarutung Desa Simangumban Julu Kec. Simangumban",
  },
  {
    name: "Balai Adian Koting",
    img: "/articles/balai/Balai KB Adian Koting.jpg",
    address: "Jl. Sibolga Tarutung Kec. Adian Koting",
  },
  {
    name: "Balai Pangaribuan",
    img: "/articles/balai/Balai KB Pangaribuan.jpg",
    address: "Jl. Siliwangi Desa Pakpahan Kec. Pangaribuan",
  },
  {
    name: "Balai Pagaran",
    img: "/articles/balai/Balai KB Pagaran.jpg",
    address: "Jl. Raya Sipultak Kec. Pagaran",
  },
  {
    name: "Balai Pahae Julu",
    img: "/articles/balai/Balai KB Pahae Julu.jpg",
    address: "Jl. Sipirok-Tarutung",
  },
  {
    name: "Balai Siborong-borong",
    img: "/articles/balai/Balai KB Siborong Borong.jpg",
    address: "Jl. Pacuan Kuda Kec. Siborong-borong",
  },
  {
    name: "Balai Parmonangan",
    img: "/articles/balai/Balai KB Parmonangan.jpg",
    address: "Desa Manalu Kec. Parmonangan",
  },
  {
    name: "Balai Sipahutar",
    img: "/articles/balai/Balai KB Sipahutar.jpg",
    address:
      "Jl. Pasar Batu No. 17 Desa Sabungan Nihuta I Kec. Sipahutar Kodepos : 22471",
  },
  {
    name: "Balai Garoga",
    img: "/articles/balai/Balai KB Garoga.jpg",
    address: "Jl. Perluasan Kec. Garoga",
  },
];

export default function PopupBalai({ onClose }: PopupBalaiProps) {
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
        <h2 className="text-xl font-bold mb-4 text-left">
          Daftar Balai Penyuluhan Stunting
        </h2>

        {/* Grid foto dengan scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-h-[80vh] overflow-y-auto">
          {balaiData.map((balai, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg shadow-md flex flex-col"
            >
              {/* Foto */}
              <img
                src={`${balai.img}`}
                alt={balai.name}
                className="w-full h-40 object-cover"
              />
              {/* Nama & Alamat */}
              <div className="p-3 flex flex-col gap-1 overflow-y-auto max-h-28">
                <h3 className="text-white font-bold text-sm">{balai.name}</h3>
                <p className="text-gray-300 text-xs leading-snug break-words">
                  {balai.address}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
