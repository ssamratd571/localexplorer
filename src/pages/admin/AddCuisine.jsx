import { useState } from "react";
import { db, auth } from "../../services/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../services/CloudinaryUpload";

export default function AddCuisine() {
  const [form, setForm] = useState({
    restaurantName: "",
    owner: "",
    category: "",
    description: "",
  });

  // Zomato-style menu items: each with Veg & Non-Veg price
  const [menuItems, setMenuItems] = useState([
    { name: "", vegPrice: "", nonVegPrice: "" },
  ]);

  // Single restaurant cover image
  const [restaurantImageFile, setRestaurantImageFile] = useState(null);
  const [restaurantImagePreview, setRestaurantImagePreview] = useState("");

  // Unlimited cuisine / food gallery images
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [status, setStatus] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Menu item change
  const handleMenuItemChange = (index, field, value) => {
    const updated = [...menuItems];
    updated[index][field] = value;
    setMenuItems(updated);
  };

  const addMenuItemRow = () => {
    setMenuItems([...menuItems, { name: "", vegPrice: "", nonVegPrice: "" }]);
  };

  const removeMenuItemRow = (index) => {
    if (menuItems.length === 1) return; // keep at least one row
    const updated = menuItems.filter((_, i) => i !== index);
    setMenuItems(updated);
  };

  // Restaurant cover image
  const handleRestaurantImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRestaurantImageFile(file);
    setRestaurantImagePreview(URL.createObjectURL(file));
  };

  const clearRestaurantImage = () => {
    setRestaurantImageFile(null);
    setRestaurantImagePreview("");
  };

  // Cuisine gallery images (unlimited)
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeGalleryImage = (index) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("You must be logged in to add cuisine.");
      return;
    }

    // Clean menu items: keep only valid rows
    const cleanedItems = menuItems
      .map((item) => ({
        name: item.name.trim(),
        vegPrice: item.vegPrice ? Number(item.vegPrice) : null,
        nonVegPrice: item.nonVegPrice ? Number(item.nonVegPrice) : null,
      }))
      .filter(
        (item) =>
          item.name !== "" && (item.vegPrice !== null || item.nonVegPrice !== null)
      );

    if (cleanedItems.length === 0) {
      alert("Please add at least one food item with Veg or Non-Veg price.");
      return;
    }

    if (!restaurantImageFile) {
      const confirmNoCover = window.confirm(
        "No restaurant picture selected. Continue without cover image?"
      );
      if (!confirmNoCover) return;
    }

    setStatus("Uploading images...");

    try {
      // Upload restaurant cover image (if any)
      let restaurantImageUrl = "";
      if (restaurantImageFile) {
        restaurantImageUrl = await uploadToCloudinary(restaurantImageFile);
      }

      // Upload gallery images (if any)
      let galleryUrls = [];
      if (galleryFiles.length > 0) {
        galleryUrls = await Promise.all(
          galleryFiles.map(async (file) => {
            const url = await uploadToCloudinary(file);
            return url;
          })
        );
      }

      // Save in Firestore
      await addDoc(collection(db, "cuisine"), {
        ...form,
        menuItems: cleanedItems, // each has vegPrice & nonVegPrice
        restaurantImage: restaurantImageUrl || null,
        galleryImages: galleryUrls,
        ownerUid: auth.currentUser.uid,
        createdAt: Date.now(),
      });

      setStatus("✅ Restaurant & Cuisine Added Successfully!");

      // Reset form
      setForm({
        restaurantName: "",
        owner: "",
        category: "",
        description: "",
      });
      setMenuItems([{ name: "", vegPrice: "", nonVegPrice: "" }]);
      setRestaurantImageFile(null);
      setRestaurantImagePreview("");
      setGalleryFiles([]);
      setGalleryPreviews([]);
    } catch (error) {
      console.error(error);
      setStatus("❌ Failed to add cuisine: " + error.message);
    }
  };

  return (
    <div className="p-10 text-white min-h-screen bg-gradient-to-br from-rose-700 to-orange-700">
      <h1 className="text-4xl font-bold mb-6">Add Restaurant & Cuisine 🍲</h1>

      <form
        onSubmit={submit}
        className="grid gap-4 max-w-3xl bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg"
      >
        {/* Restaurant / Cuisine Name */}
        <input
          name="restaurantName"
          placeholder="Restaurant / Cloud Kitchen Name"
          value={form.restaurantName}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
          required
        />

        {/* Owner / Department Name */}
        <input
          name="owner"
          placeholder="Owner / Chef / Department Name"
          value={form.owner}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
          required
        />

        {/* Category */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
          required
        >
          <option value="">Select Cuisine Category</option>
          <option value="Indian">Indian</option>
          <option value="Chinese">Chinese</option>
          <option value="Continental">Continental</option>
          <option value="Dessert">Dessert</option>
          <option value="Fast Food">Fast Food</option>
          <option value="Beverage">Beverage</option>
        </select>

        {/* Description */}
        <textarea
          name="description"
          placeholder="Short description (e.g. speciality, timings, location details)"
          rows="3"
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
        />

        {/* Restaurant Cover Image */}
        <div className="mt-2">
          <h2 className="text-xl font-semibold mb-2">Restaurant Picture 🏠</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleRestaurantImageChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          {restaurantImagePreview && (
            <div className="mt-3 flex items-center gap-4">
              <img
                src={restaurantImagePreview}
                alt="Restaurant Preview"
                className="w-32 h-28 object-cover rounded-xl border border-white/30"
              />
              <button
                type="button"
                onClick={clearRestaurantImage}
                className="px-3 py-2 bg-red-600/80 hover:bg-red-700 rounded-xl text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Zomato-style Menu Items */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">
            Menu Items (Veg & Non-Veg Price) 🍽️
          </h2>
          <p className="text-sm opacity-80 mb-2">
            For each dish, you can set Veg price, Non-Veg price, or both.
          </p>

          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 md:flex-row md:items-center bg-white/10 p-3 rounded-xl"
              >
                <input
                  type="text"
                  placeholder="Dish Name (e.g. Momos)"
                  value={item.name}
                  onChange={(e) =>
                    handleMenuItemChange(index, "name", e.target.value)
                  }
                  className="flex-1 px-3 py-2 rounded-xl bg-white text-black w-full"
                  required={index === 0}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Veg Price (₹)"
                  value={item.vegPrice}
                  onChange={(e) =>
                    handleMenuItemChange(index, "vegPrice", e.target.value)
                  }
                  className="w-full md:w-32 px-3 py-2 rounded-xl bg-white text-black"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Non-Veg Price (₹)"
                  value={item.nonVegPrice}
                  onChange={(e) =>
                    handleMenuItemChange(index, "nonVegPrice", e.target.value)
                  }
                  className="w-full md:w-40 px-3 py-2 rounded-xl bg-white text-black"
                />
                <button
                  type="button"
                  onClick={() => removeMenuItemRow(index)}
                  className="px-3 py-2 rounded-xl bg-red-600/80 hover:bg-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMenuItemRow}
            className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
          >
            + Add More Dishes
          </button>
        </div>

        {/* Cuisine / Food Gallery Images (unlimited) */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">
            Cuisine / Food Pictures 📸
          </h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          <p className="text-sm opacity-80">
            You can select multiple images. They will show as a gallery like Zomato.
          </p>

          {galleryPreviews.length > 0 && (
            <div className="flex gap-3 flex-wrap justify-start mt-3">
              {galleryPreviews.map((src, i) => (
                <div
                  key={i}
                  className="relative w-28 h-24 rounded-xl overflow-hidden border border-white/30"
                >
                  <img
                    src={src}
                    alt={`Cuisine ${i}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 bg-red-700 text-xs px-2 py-1 rounded-full"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          className="mt-4 p-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition"
          type="submit"
        >
          Upload Restaurant & Menu
        </button>
      </form>

      <p className="mt-4 text-lg">{status}</p>
    </div>
  );
}



