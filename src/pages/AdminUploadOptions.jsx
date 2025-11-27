import { useNavigate } from "react-router-dom";

export default function AdminUploadOptions() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
      <h1 className="text-3xl font-bold mb-6">What do you want to upload?</h1>

      <div className="space-y-4 max-w-sm">
        <button className="p-3 bg-black/60 rounded-xl hover:bg-black w-full" onClick={() => navigate("/admin/hotels")}>Upload Hotel</button>
        <button className="p-3 bg-black/60 rounded-xl hover:bg-black w-full">Upload Car</button>
        <button className="p-3 bg-black/60 rounded-xl hover:bg-black w-full">Upload Cuisine</button>
        <button className="p-3 bg-black/60 rounded-xl hover:bg-black w-full">Upload Shopping</button>
      </div>
    </div>
  );
}
