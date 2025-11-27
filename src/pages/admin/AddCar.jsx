import { useState } from "react";
import { db, auth } from "../../services/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../services/CloudinaryUpload";

export default function AddCar() {
  const [form, setForm] = useState({
    orgName: "",
    carName: "",
    brand: "",
    city: "",
    address: "",
    phone: "",
    whatsapp: "",
    description: "",
  });

  const [freeCancellation, setFreeCancellation] = useState(true);

  // IMAGES (max 10)
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // 2-WHEELER TARIFFS
  const [twoWheelerTariffs, setTwoWheelerTariffs] = useState([
    {
      name: "Scooty",
      available: false,
      pricePerDay: "",
      maxSeats: "2",
    },
    {
      name: "Scooter",
      available: false,
      pricePerDay: "",
      maxSeats: "2",
    },
    {
      name: "Bike",
      available: false,
      pricePerDay: "",
      maxSeats: "2",
    },
    {
      name: "Sports Bike",
      available: false,
      pricePerDay: "",
      maxSeats: "2",
    },
  ]);

  // 4-WHEELER TARIFFS
  const [fourWheelerTariffs, setFourWheelerTariffs] = useState([
    {
      name: "Hatchback",
      available: false,
      acPricePerDay: "",
      nonAcPricePerDay: "",
      maxSeats: "4",
    },
    {
      name: "Sedan",
      available: false,
      acPricePerDay: "",
      nonAcPricePerDay: "",
      maxSeats: "4",
    },
    {
      name: "SUV",
      available: false,
      acPricePerDay: "",
      nonAcPricePerDay: "",
      maxSeats: "7",
    },
    {
      name: "MUV / Traveller",
      available: false,
      acPricePerDay: "",
      nonAcPricePerDay: "",
      maxSeats: "12",
    },
    {
      name: "Luxury",
      available: false,
      acPricePerDay: "",
      nonAcPricePerDay: "",
      maxSeats: "4",
    },
  ]);

  const [status, setStatus] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // HANDLE 2W / 4W TARIFF CHANGES
  const updateTariff = (type, index, field, value) => {
    if (type === "2W") {
      setTwoWheelerTariffs((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    } else {
      setFourWheelerTariffs((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], [field]: value };
        return copy;
      });
    }
  };

  const toggleTariffAvailable = (type, index) => {
    if (type === "2W") {
      setTwoWheelerTariffs((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          available: !copy[index].available,
        };
        return copy;
      });
    } else {
      setFourWheelerTariffs((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          available: !copy[index].available,
        };
        return copy;
      });
    }
  };

  // IMAGES: max 10
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = 10 - imageFiles.length;
    const limited = files.slice(0, remainingSlots);

    const newFiles = [...imageFiles, ...limited];
    const newPreviews = [
      ...previews,
      ...limited.map((file) => URL.createObjectURL(file)),
    ];

    setImageFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeImage = (index) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    setImageFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("Please login before adding a vehicle listing.");
      return;
    }

    // At least one image
    if (imageFiles.length === 0) {
      alert("Please upload at least 1 image (max 10).");
      return;
    }

    // At least one available tariff
    const any2W = twoWheelerTariffs.some((t) => t.available);
    const any4W = fourWheelerTariffs.some((t) => t.available);
    if (!any2W && !any4W) {
      alert("Please mark at least one 2-wheeler or 4-wheeler category as available.");
      return;
    }

    setStatus("⏳ Uploading images...");

    try {
      // Upload all images to Cloudinary
      const imageUrls = await Promise.all(
        imageFiles.map((file) => uploadToCloudinary(file))
      );

      // Clean tariffs (convert to numbers)
      const cleanTwo = twoWheelerTariffs.map((t) => ({
        name: t.name,
        available: !!t.available,
        pricePerDay: Number(t.pricePerDay) || 0,
        maxSeats: Number(t.maxSeats) || 0,
      }));

      const cleanFour = fourWheelerTariffs.map((t) => ({
        name: t.name,
        available: !!t.available,
        acPricePerDay: Number(t.acPricePerDay) || 0,
        nonAcPricePerDay: Number(t.nonAcPricePerDay) || 0,
        maxSeats: Number(t.maxSeats) || 0,
      }));

      // Compute a base price (min non-zero across all tariffs)
      const priceCandidates = [];

      cleanTwo.forEach((t) => {
        if (t.available && t.pricePerDay > 0) {
          priceCandidates.push(t.pricePerDay);
        }
      });

      cleanFour.forEach((t) => {
        if (t.available && t.acPricePerDay > 0) {
          priceCandidates.push(t.acPricePerDay);
        }
        if (t.available && t.nonAcPricePerDay > 0) {
          priceCandidates.push(t.nonAcPricePerDay);
        }
      });

      const basePricePerDay =
        priceCandidates.length > 0
          ? Math.min(...priceCandidates)
          : 0;

      const supportsTwoWheeler = cleanTwo.some((t) => t.available);
      const supportsFourWheeler = cleanFour.some((t) => t.available);

      let vehicleType = "";
      if (supportsTwoWheeler && supportsFourWheeler) {
        vehicleType = "Both";
      } else if (supportsTwoWheeler) {
        vehicleType = "2-Wheeler";
      } else if (supportsFourWheeler) {
        vehicleType = "4-Wheeler";
      }

      const payload = {
        ...form,
        freeCancellation: !!freeCancellation,
        twoWheelerTariffs: cleanTwo,
        fourWheelerTariffs: cleanFour,
        supportsTwoWheeler,
        supportsFourWheeler,
        vehicleType, // used by filter in Cars.jsx
        images: imageUrls,
        pricePerDay: basePricePerDay,
        ownerUid: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email || null,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "cars"), payload);

      // Cleanup previews
      previews.forEach((url) => URL.revokeObjectURL(url));

      setStatus("✅ Vehicle listing added successfully!");
      // Reset form
      setForm({
        orgName: "",
        carName: "",
        brand: "",
        city: "",
        address: "",
        phone: "",
        whatsapp: "",
        description: "",
      });
      setFreeCancellation(true);
      setImageFiles([]);
      setPreviews([]);
      setTwoWheelerTariffs((prev) =>
        prev.map((t) => ({
          ...t,
          available: false,
          pricePerDay: "",
        }))
      );
      setFourWheelerTariffs((prev) =>
        prev.map((t) => ({
          ...t,
          available: false,
          acPricePerDay: "",
          nonAcPricePerDay: "",
        }))
      );
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to save listing: " + err.message);
    }
  };

  return (
    <div className="p-10 text-white">
      <h1 className="text-4xl font-bold mb-6">Add Transport Partner 🚐</h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 max-w-3xl bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg"
      >
        {/* BASIC INFO */}
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="orgName"
            placeholder="Agency / Owner Name"
            value={form.orgName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
            required
          />
          <input
            name="carName"
            placeholder="Listing Title (e.g., Darjeeling Car Rental)"
            value={form.carName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
            required
          />
          <input
            name="brand"
            placeholder="Primary Brand (optional)"
            value={form.brand}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          <input
            name="city"
            placeholder="City / Location"
            value={form.city}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          <input
            name="address"
            placeholder="Pickup Base Address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black md:col-span-2"
          />
          <input
            name="phone"
            placeholder="Contact Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
            required
          />
          <input
            name="whatsapp"
            placeholder="WhatsApp Number (optional)"
            value={form.whatsapp}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
        </div>

        <textarea
          name="description"
          placeholder="Description (routes covered, special services, etc.)"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
        />

        {/* FREE CANCELLATION */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={freeCancellation}
            onChange={(e) => setFreeCancellation(e.target.checked)}
            className="accent-purple-500 w-4 h-4"
          />
          Free cancellation available
        </label>

        {/* IMAGES */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Images (max 10)</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          <p className="text-sm text-white/70 mt-1">
            Upload clear photos of vehicles, logo, etc.
          </p>
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${i}`}
                    className="w-28 h-24 object-cover rounded-xl border border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-WHEELER SECTION */}
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-2">2-Wheeler Tariffs 🛵</h2>
          <p className="text-sm text-white/70 mb-3">
            Tick which categories are available and set per-day price & max seats.
          </p>
          <div className="space-y-3">
            {twoWheelerTariffs.map((t, index) => (
              <div
                key={t.name}
                className="grid md:grid-cols-4 gap-3 items-center bg-black/20 rounded-xl p-3 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.available}
                    onChange={() => toggleTariffAvailable("2W", index)}
                    className="accent-emerald-500"
                  />
                  <span className="font-medium">{t.name}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Price / day (₹)"
                  value={t.pricePerDay}
                  onChange={(e) =>
                    updateTariff("2W", index, "pricePerDay", e.target.value)
                  }
                  className="px-3 py-2 rounded-xl bg-white text-black text-sm"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Max seats"
                  value={t.maxSeats}
                  onChange={(e) =>
                    updateTariff("2W", index, "maxSeats", e.target.value)
                  }
                  className="px-3 py-2 rounded-xl bg-white text-black text-sm"
                />
                <p className="text-xs text-white/60">
                  Example: local sightseeing, short trips.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4-WHEELER SECTION */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">4-Wheeler Tariffs 🚗</h2>
          <p className="text-sm text-white/70 mb-3">
            AC / Non-AC prices, seats for each category.
          </p>
          <div className="space-y-3">
            {fourWheelerTariffs.map((t, index) => (
              <div
                key={t.name}
                className="grid md:grid-cols-5 gap-3 items-center bg-black/20 rounded-xl p-3 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.available}
                    onChange={() => toggleTariffAvailable("4W", index)}
                    className="accent-emerald-500"
                  />
                  <span className="font-medium">{t.name}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="AC / day (₹)"
                  value={t.acPricePerDay}
                  onChange={(e) =>
                    updateTariff("4W", index, "acPricePerDay", e.target.value)
                  }
                  className="px-3 py-2 rounded-xl bg-white text-black text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Non-AC / day (₹)"
                  value={t.nonAcPricePerDay}
                  onChange={(e) =>
                    updateTariff("4W", index, "nonAcPricePerDay", e.target.value)
                  }
                  className="px-3 py-2 rounded-xl bg-white text-black text-sm"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Max seats"
                  value={t.maxSeats}
                  onChange={(e) =>
                    updateTariff("4W", index, "maxSeats", e.target.value)
                  }
                  className="px-3 py-2 rounded-xl bg-white text-black text-sm"
                />
                <p className="text-xs text-white/60">
                  Example: airport pickup, outstation trips.
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 p-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-lg"
        >
          Save Vehicle Listing
        </button>
      </form>

      <p className="mt-4 text-lg">{status}</p>
    </div>
  );
}







