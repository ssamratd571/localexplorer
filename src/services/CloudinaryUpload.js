// src/services/CloudinaryUpload.js

/**
 * Upload a single file to Cloudinary.
 * Returns: { url, secure_url, public_id }
 */
export async function uploadToCloudinary(file) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "localexplorer"); // your preset
  data.append("cloud_name", "djdnhwyx5");        // your cloud name

  try {
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/djdnhwyx5/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();

    if (!json.secure_url && !json.url) {
      console.error("Cloudinary Upload Error:", json);
      throw new Error(json.error?.message || "Upload failed");
    }

    // RETURN BOTH VALUES
    return {
      secure_url: json.secure_url || null,
      url: json.url || null,
      public_id: json.public_id || null,
    };
  } catch (error) {
    console.error("Cloudinary Exception:", error);
    throw new Error("Cloudinary upload failed: " + error.message);
  }
}

/**
 * Upload array of files
 */
export async function uploadMultipleToCloudinary(files) {
  const uploads = files.map((file) => uploadToCloudinary(file));
  return await Promise.all(uploads);
}


