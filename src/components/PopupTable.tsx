/* eslint-disable @typescript-eslint/no-explicit-any */
interface PopupTableProps {
  title: string;
  data: Record<string, any>;
  onClose: () => void;
}

export default function PopupTable({ title, data, onClose }: PopupTableProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-lg max-w-2xl w-full p-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold mb-4">{title}</h2>

        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1 text-left">Kolom</th>
                <th className="border px-2 py-1 text-left">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value], i) => (
                <tr key={i} className="odd:bg-gray-50">
                  <td className="border px-2 py-1 font-medium">{key}</td>
                  <td className="border px-2 py-1">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
