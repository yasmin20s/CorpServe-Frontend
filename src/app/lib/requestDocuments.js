/**
 * Collect attachment rows from API (camelCase / PascalCase, RequestAttachments vs legacy names).
 */
export function getRequestAttachmentList(request) {
  if (!request || typeof request !== 'object') return [];
  const list =
    request.requestAttachments
    ?? request.RequestAttachments
    ?? request.attachments
    ?? request.Attachments
    ?? request.documents
    ?? request.Documents
    ?? request.files
    ?? request.Files;
  return Array.isArray(list) ? list : [];
}

export function toAbsoluteFileUrl(fileUrl) {
  if (!fileUrl) return '';
  if (String(fileUrl).startsWith('http')) return fileUrl;
  const normalizedBase = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');
  return `${normalizedBase}${String(fileUrl).startsWith('/') ? '' : '/'}${fileUrl}`;
}

function getDisplayFileName(fileLike, idx) {
  const explicitName = fileLike?.fileName || fileLike?.name || fileLike?.title || fileLike?.FileName;
  if (explicitName) return explicitName;
  const sourceUrl = fileLike?.fileUrl || fileLike?.FileUrl || fileLike?.url || fileLike?.path;
  if (!sourceUrl) return `Document ${idx + 1}`;
  const rawName = String(sourceUrl).split('/').pop() || `Document ${idx + 1}`;
  return decodeURIComponent(rawName).replace(/^[a-f0-9]{8}-[a-f0-9-]{27}_/i, '');
}

/**
 * Normalized list for UI: { id, name, url }
 */
export function normalizeRequestDocuments(request, requestIdFallback = '') {
  const idBase = request?.id ?? request?.Id ?? request?.requestId ?? request?.RequestId ?? requestIdFallback;
  return getRequestAttachmentList(request)
    .map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `${idBase}-doc-${idx}`,
          name: getDisplayFileName({ fileUrl: item }, idx),
          url: item,
        };
      }
      const url = item?.fileUrl || item?.FileUrl || item?.url || item?.path || '';
      return {
        id: item?.id || item?.Id || `${idBase}-doc-${idx}`,
        name: getDisplayFileName(item, idx),
        url,
      };
    })
    .filter((doc) => Boolean(doc.url));
}
