import { formatPrice } from './helpers'

/**
 * Generate shareable URL for a specific product.
 */
export const getShareUrl = (gunId) => {
  const origin = window.location.origin
  const pathname = window.location.pathname
  return `${origin}${pathname}?id=${encodeURIComponent(gunId)}`
}

/**
 * Share a product using Web Share API with automatic fallback to Clipboard API.
 *
 * @param {Object} gun - The product object to share
 * @returns {Promise<{ method: 'native'|'clipboard'|'error', success: boolean, message?: string }>}
 */
export const shareGun = async (gun) => {
  if (!gun || !gun.id) {
    return { method: 'error', success: false, message: 'Invalid product data' }
  }

  const url = getShareUrl(gun.id)
  const title = `${gun.name || 'Hardware'} · Bore & Barrel`
  const text = `Check out ${gun.name} (${gun.type || gun.category || 'Hardware'} - ${gun.caliber || 'Standard'}) for ${formatPrice(gun.price ?? gun.cook_time ?? 0)}.`

  // 1. Try native Web Share API (Mobile browsers, Chrome Android, Safari iOS)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      })
      return { method: 'native', success: true, message: 'Shared successfully' }
    } catch (err) {
      // If user cancelled / dismissed the native share sheet, do not copy to clipboard
      if (err.name === 'AbortError') {
        return { method: 'native', success: false, message: 'Share cancelled' }
      }
      // Otherwise, fall through to clipboard copy
    }
  }

  // 2. Fallback: Clipboard API (Desktop, browsers without Web Share)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url)
      return {
        method: 'clipboard',
        success: true,
        message: 'Tautan produk berhasil disalin ke clipboard!',
      }
    } else {
      // Fallback for older environments without clipboard API
      const input = document.createElement('textarea')
      input.value = url
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      return {
        method: 'clipboard',
        success: true,
        message: 'Tautan produk berhasil disalin ke clipboard!',
      }
    }
  } catch (err) {
    return {
      method: 'error',
      success: false,
      message: 'Gagal menyalin tautan: ' + (err.message || 'Izin ditolak'),
    }
  }
}
