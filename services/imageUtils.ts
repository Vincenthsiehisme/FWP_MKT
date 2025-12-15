
/**
 * Compresses a Base64 image string by drawing it to a canvas and exporting as JPEG.
 * This significantly reduces the payload size for Google Sheet uploads, 
 * improving success rates on mobile networks.
 * 
 * @param base64Str The original Base64 string (including data:image/png;base64 prefix)
 * @param quality Quality from 0 to 1 (default 0.6)
 * @param maxWidth Max width to resize to (default 1024px)
 */
export const compressBase64Image = (base64Str: string, quality = 0.6, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize logic
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with reduced quality
      // JPEG is much smaller than PNG for complex photos like crystals
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};
