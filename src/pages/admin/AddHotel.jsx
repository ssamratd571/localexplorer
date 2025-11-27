import { useState } from "react";
import { db, auth } from "../../services/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../services/CloudinaryUpload";

export default function AddHotel() {
  const [form, setForm] = useState({
    title: "",
    category: "hotel",
    address: "",
    city: "",
    price: "",
    phone: "",
    description: "",
    acType: "AC",
    powerBackup: "Yes",
    freeCancellation: false,
    checkIn: "",
    checkOut: "",
  });

  // Property images: File + preview URL
  const [categoryImages, setCategoryImages] = useState([]);

  // Room types with AC/Non-AC prices per 1–4 guests + images
  const [rooms, setRooms] = useState([
    {
      name: "Standard",
      acPrice1: "",
      acPrice2: "",
      acPrice3: "",
      acPrice4: "",
      nonAcPrice1: "",
      nonAcPrice2: "",
      nonAcPrice3: "",
      nonAcPrice4: "",
      images: [],
    },
    {
      name: "Deluxe",
      acPrice1: "",
      acPrice2: "",
      acPrice3: "",
      acPrice4: "",
      nonAcPrice1: "",
      nonAcPrice2: "",
      nonAcPrice3: "",
      nonAcPrice4: "",
      images: [],
    },
    {
      name: "Suite",
      acPrice1: "",
      acPrice2: "",
      acPrice3: "",
      acPrice4: "",
      nonAcPrice1: "",
      nonAcPrice2: "",
      nonAcPrice3: "",
      nonAcPrice4: "",
      images: [],
    },
  ]);

  const [status, setStatus] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoomFieldChange = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    setRooms(updated);
  };

  // Property image selection with preview (append mode)
  const handleCategoryImages = (files) => {
    const fileArray = Array.from(files || []).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setCategoryImages((prev) => [...prev, ...fileArray]);
  };

  // Room image selection with preview (append mode)
  const handleRoomImages = (index, files) => {
    const fileArray = Array.from(files || []).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setRooms((prev) => {
      const updated = [...prev];
      const existing = updated[index]?.images || [];
      updated[index] = {
        ...updated[index],
        images: [...existing, ...fileArray],
      };
      return updated;
    });
  };

  // 🔴 Remove property image
  const removeCategoryImage = (index) => {
    setCategoryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔴 Remove room image
  const removeRoomImage = (roomIndex, imgIndex) => {
    setRooms((prev) => {
      const updated = [...prev];
      updated[roomIndex].images = updated[roomIndex].images.filter(
        (_, i) => i !== imgIndex
      );
      return updated;
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    if (categoryImages.length === 0) {
      alert("Please upload at least one property image.");
      return;
    }

    for (const room of rooms) {
      if (room.images.length === 0) {
        alert(`Add at least one image for ${room.name}.`);
        return;
      }
    }

    setStatus("⏳ Uploading images...");

    try {
      // helper: works for both File and { file, preview }
      const getFile = (img) => (img && img.file ? img.file : img);

      // 1️⃣ Upload main property images
      const categoryUploads = await Promise.all(
        categoryImages.map((img) => uploadToCloudinary(getFile(img)))
      );
      // uploadToCloudinary returns a STRING (secure_url),
      // so this is already an array of URLs:
      const categoryImageURLs = categoryUploads;

      // 2️⃣ Upload each room's images
      const uploadedRooms = await Promise.all(
        rooms.map(async (room) => {
          const uploads = await Promise.all(
            room.images.map((img) => uploadToCloudinary(getFile(img)))
          );
          const urls = uploads; // array of URL strings

          return {
            name: room.name,
            acPrice1: Number(room.acPrice1) || 0,
            acPrice2: Number(room.acPrice2) || 0,
            acPrice3: Number(room.acPrice3) || 0,
            acPrice4: Number(room.acPrice4) || 0,
            nonAcPrice1: Number(room.nonAcPrice1) || 0,
            nonAcPrice2: Number(room.nonAcPrice2) || 0,
            nonAcPrice3: Number(room.nonAcPrice3) || 0,
            nonAcPrice4: Number(room.nonAcPrice4) || 0,
            imageURLs: urls, // what Hotels.jsx reads
          };
        })
      );

      const cleanData = (obj) =>
        Object.fromEntries(
          Object.entries(obj).filter(([_, v]) => v !== undefined)
        );

      const finalData = cleanData({
        ...form,
        price: Number(form.price) || 0,
        categoryImages: categoryImageURLs,
        rooms: uploadedRooms,
        ownerUid: auth.currentUser?.uid || "unknown",
        ownerEmail: auth.currentUser?.email || null,
        createdAt: Date.now(),
      });

      await addDoc(collection(db, "hotels"), finalData);
      setStatus("✅ Property uploaded successfully!");

      // reset states
      setForm({
        title: "",
        category: "hotel",
        address: "",
        city: "",
        price: "",
        phone: "",
        description: "",
        acType: "AC",
        powerBackup: "Yes",
        freeCancellation: false,
        checkIn: "",
        checkOut: "",
      });
      setCategoryImages([]);
      setRooms(
        rooms.map((r) => ({
          ...r,
          acPrice1: "",
          acPrice2: "",
          acPrice3: "",
          acPrice4: "",
          nonAcPrice1: "",
          nonAcPrice2: "",
          nonAcPrice3: "",
          nonAcPrice4: "",
          images: [],
        }))
      );
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("❌ Upload failed: " + err.message);
    }
  };

  return (
    <div className="p-10 text-white relative">
      <h1 className="text-4xl font-bold mb-6 typing">Add Property 🏠</h1>

      <form
        onSubmit={submit}
        className="grid gap-4 max-w-md bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg"
      >
        <input
          name="title"
          placeholder="Property Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        >
          <option value="hotel">Hotel</option>
          <option value="residential">Residential</option>
          <option value="room">Room</option>
          <option value="guesthouse">Guest House</option>
        </select>

        <input
          name="address"
          placeholder="Full Address"
          value={form.address}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />

        <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />

        <input
          name="price"
          placeholder="Starting Price per night"
          type="number"
          value={form.price}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />

        <select
          name="acType"
          value={form.acType}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        >
          <option value="AC">AC</option>
          <option value="Non-AC">Non-AC</option>
        </select>

        <select
          name="powerBackup"
          value={form.powerBackup}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        >
          <option value="Yes">Power Backup: Yes</option>
          <option value="No">Power Backup: No</option>
        </select>

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={form.freeCancellation}
            onChange={(e) =>
              setForm({ ...form, freeCancellation: e.target.checked })
            }
            className="accent-purple-600 w-4 h-4"
          />
          Free Cancellation Available
        </label>

        <div className="flex gap-3">
          <input
            name="checkIn"
            type="time"
            value={form.checkIn}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black border"
          />
          <input
            name="checkOut"
            type="time"
            value={form.checkOut}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black border"
          />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />

        {/* Property images with preview */}
        <h2 className="text-xl mt-2 font-semibold">Property Images (2–3)</h2>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleCategoryImages(e.target.files)}
          className="w-full px-4 py-3 rounded-xl bg-white text-black border"
        />
        {categoryImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {categoryImages.map((imgObj, i) => (
              <div key={i} className="relative">
                <img
                  src={imgObj.preview}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeCategoryImage(i)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Room types with guest-wise prices + images */}
        <h2 className="text-xl mt-4 font-semibold">Room Types</h2>
        {rooms.map((room, index) => (
          <div
            key={index}
            className="p-3 border border-white/30 rounded-xl space-y-2"
          >
            <p className="font-semibold mb-1">{room.name}</p>

            <p className="text-sm font-semibold mt-1">AC Prices (₹)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="number"
                placeholder="AC - 1 Guest"
                value={room.acPrice1}
                onChange={(e) =>
                  handleRoomFieldChange(index, "acPrice1", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
              <input
                type="number"
                placeholder="AC - 2 Guests"
                value={room.acPrice2}
                onChange={(e) =>
                  handleRoomFieldChange(index, "acPrice2", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
              <input
                type="number"
                placeholder="AC - 3 Guests"
                value={room.acPrice3}
                onChange={(e) =>
                  handleRoomFieldChange(index, "acPrice3", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
              <input
                type="number"
                placeholder="AC - 4 Guests"
                value={room.acPrice4}
                onChange={(e) =>
                  handleRoomFieldChange(index, "acPrice4", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
            </div>

            <p className="text-sm font-semibold mt-2">Non-AC Prices (₹)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="number"
                placeholder="Non-AC - 1 Guest"
                value={room.nonAcPrice1}
                onChange={(e) =>
                  handleRoomFieldChange(index, "nonAcPrice1", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
              <input
                type="number"
                placeholder="Non-AC - 2 Guests"
                value={room.nonAcPrice2}
                onChange={(e) =>
                  handleRoomFieldChange(index, "nonAcPrice2", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
              <input
                type="number"
                placeholder="Non-AC - 3 Guests"
                value={room.nonAcPrice3}
                onChange={(e) =>
                  handleRoomFieldChange(index, "nonAcPrice3", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
              <input
                type="number"
                placeholder="Non-AC - 4 Guests"
                value={room.nonAcPrice4}
                onChange={(e) =>
                  handleRoomFieldChange(index, "nonAcPrice4", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-white text-black border"
              />
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleRoomImages(index, e.target.files)}
              className="w-full px-4 py-3 rounded-xl bg-white text-black border"
            />

            {room.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {room.images.map((imgObj, i) => (
                  <div key={i} className="relative">
                    <img
                      src={imgObj.preview}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeRoomImage(index, i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="p-3 bg-purple-600 hover:bg-purple-700 rounded-xl"
        >
          Upload Property
        </button>
      </form>

      <p className="mt-4 text-lg">{status}</p>
    </div>
  );
}


