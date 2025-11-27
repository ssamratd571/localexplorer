import { useNavigate } from "react-router-dom";

export default function UploadHome() {
  const navigate = useNavigate();

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Upload Data</h1>
      <p className="text-white/70 mb-8">Select what data you want to upload</p>

      <div className="grid grid-cols-2 gap-6">
        <button onClick={()=>navigate("/dashboard/upload/hotel")}
          className="bg-purple-600 hover:bg-purple-700 p-6 rounded-xl text-xl font-semibold">
          Add Hotel
        </button>

        

        <button onClick={()=>navigate("/dashboard/cars/add")}
          className="bg-blue-600 hover:bg-blue-700 p-6 rounded-xl text-xl font-semibold">
          Add Car
        </button>

        <button onClick={()=>navigate("/dashboard/cuisine/add")}
          className="bg-pink-600 hover:bg-pink-700 p-6 rounded-xl text-xl font-semibold">
          Add Cuisine
        </button>

        <button onClick={()=>navigate("/dashboard/shopping/add")}
          className="bg-green-600 hover:bg-green-700 p-6 rounded-xl text-xl font-semibold">
          Add Shopping Item
        </button>
      </div>
    </div>
  );
}

