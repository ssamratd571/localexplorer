import { useState } from "react";
import { db, auth } from "../../services/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "../../services/CloudinaryUpload";

export default function AddShopping() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    ownerName: "",
    ownerPhone: "",
    description: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [status, setStatus] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please login to add a product.");
      return;
    }

    if (imageFiles.length === 0) {
      alert("Please upload at least one product image.");
      return;
    }

    setStatus("Uploading images...");

    try {
      const imageUrls = [];
      for (const file of imageFiles) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }

      await addDoc(collection(db, "shopping"), {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        stock: form.stock ? Number(form.stock) : null,
        ownerName: form.ownerName || auth.currentUser.displayName || "",
        ownerPhone: form.ownerPhone || "",
        description: form.description,
        images: imageUrls,
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setStatus("✅ Product added successfully!");

      setForm({
        name: "",
        price: "",
        category: "",
        stock: "",
        ownerName: "",
        ownerPhone: "",
        description: "",
      });
      setImageFiles([]);
      setPreviews([]);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to add product: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-700 to-sky-700 p-6 text-white">
      <h1 className="text-4xl font-bold mb-6">Add New Product 🛍️</h1>

      <form
        onSubmit={submit}
        className="max-w-xl bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-md shadow-lg space-y-4"
      >
        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="price"
            type="number"
            placeholder="Price (₹)"
            value={form.price}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
            required
          />
          <input
            name="stock"
            type="number"
            placeholder="Stock (optional)"
            value={form.stock}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
        </div>

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
          required
        >
          <option value="">Select Category</option>
          <option value="Groceries">Groceries</option>
          <option value="Handicraft">Handicraft</option>
          <option value="Tea & Spices">Tea & Spices</option>
          <option value="Clothing">Clothing</option>
          <option value="Electronics">Electronics</option>
          <option value="Others">Others</option>
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="ownerName"
            placeholder="Shop / Owner Name"
            value={form.ownerName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          <input
            name="ownerPhone"
            placeholder="Owner Contact Number"
            value={form.ownerPhone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
        </div>

        <textarea
          name="description"
          placeholder="Product Description"
          rows="3"
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl bg-white text-black"
        />

        {/* Images */}
        <div>
          <label className="block mb-1 text-sm text-white/80">
            Product Images (you can upload multiple)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full px-4 py-3 rounded-xl bg-white text-black"
          />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`img-${i}`}
                    className="w-24 h-24 object-cover rounded-xl border border-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-semibold"
          type="submit"
        >
          Save Product
        </button>
      </form>

      <p className="mt-4 text-lg">{status}</p>
    </div>
  );
}



