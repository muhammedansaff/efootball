/**
 * Upload avatar utility - stores compressed images in Firestore
 * No external dependencies, works globally without regional blocks
 */

/**
 * Upload avatar by compressing and returning base64 for Firestore storage
 * @param base64Image - Base64 encoded image string
 * @returns Compressed base64 string ready for Firestore
 */
export async function uploadAvatar(base64Image: string): Promise<string> {
  try {
    // Compress image to fit Firestore document size limit
    const compressed = compressImageForFirestore(base64Image);
    console.log('✅ Avatar compressed for Firestore');
    return compressed;
  } catch (error) {
    console.error('❌ Avatar compression failed:', error);
    // Return original if compression fails
    return base64Image;
  }
}

/**
 * Compress image to fit Firestore document size limit
 * Target: ~100-150KB for good quality while staying under 1MB limit
 */
function compressImageForFirestore(base64Image: string): string {
  // If it's already small enough, return as-is
  if (base64Image.length < 150000) {
    console.log('📊 Image already small enough:', base64Image.length, 'bytes');
    return base64Image;
  }

  // Create image element
  const img = new window.Image();
  img.src = base64Image;
  
  // Wait for image to load (synchronous in this context)
  if (!img.complete) {
    // If image isn't loaded yet, return original
    // This shouldn't happen in practice as we're using base64
    console.warn('⚠️ Image not loaded, returning original');
    return base64Image;
  }
  
  const canvas = document.createElement('canvas');
  const MAX_SIZE = 150; // Smaller size for Firestore
  
  let width = img.width;
  let height = img.height;
  
  // Calculate new dimensions maintaining aspect ratio
  if (width > height) {
    if (width > MAX_SIZE) {
      height = Math.round((height * MAX_SIZE) / width);
      width = MAX_SIZE;
    }
  } else {
    if (height > MAX_SIZE) {
      width = Math.round((width * MAX_SIZE) / height);
      height = MAX_SIZE;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('❌ Could not get canvas context');
    return base64Image;
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // Use moderate quality for good balance
  const compressed = canvas.toDataURL('image/jpeg', 0.6);
  
  console.log(`📊 Compressed: ${base64Image.length} → ${compressed.length} bytes (${Math.round(compressed.length / base64Image.length * 100)}%)`);
  
  return compressed;
}

/**
 * Check if a URL is a base64 data URL
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image');
}

/**
 * Check if a URL is an external image URL (not base64)
 */
export function isExternalImageUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}
