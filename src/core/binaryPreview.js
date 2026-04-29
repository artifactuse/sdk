const MIME_MAP = {
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	ico: 'image/x-icon',
	bmp: 'image/bmp',
	tiff: 'image/tiff',
	tif: 'image/tiff',
	svg: 'image/svg+xml',
	mp3: 'audio/mpeg',
	wav: 'audio/wav',
	ogg: 'audio/ogg',
	flac: 'audio/flac',
	aac: 'audio/aac',
	mp4: 'video/mp4',
	m4a: 'video/mp4',
	webm: 'video/webm',
	pdf: 'application/pdf',
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	eot: 'application/vnd.ms-fontobject',
	otf: 'font/otf',
	bin: 'application/octet-stream',
};

export function getMimeType(ext) {
	return MIME_MAP[ext?.toLowerCase()] ?? 'application/octet-stream';
}

export function base64ToObjectUrl(base64, mimeType) {
	const bytes = atob(base64);
	const arr = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
	const blob = new Blob([arr], { type: mimeType });
	return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url) {
	if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}
