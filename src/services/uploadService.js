import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const uploadFileToStorage = async (file, signedUpload) => {
    const { error } = await supabase.storage
        .from('csv-files')
        .uploadToSignedUrl(signedUpload.path, signedUpload.token, file)

    if (error) {
        const message = String(error.message || '')

        if (message.toLowerCase().includes('maximum allowed size')) {
            throw new Error('El archivo supera el tamano maximo permitido por el bucket csv-files de Supabase Storage.')
        }

        throw error
    }

    return signedUpload.path
}

export const createChunkUpload = async ({ uploadId, filename, chunkIndex }) => {
    const res = await fetch('/.netlify/functions/upload-chunk-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, filename, chunkIndex })
    })

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, `No se pudo preparar la parte ${chunkIndex + 1}`))
    }

    return res.json()
}

export const uploadFileChunksToStorage = async ({
    file,
    uploadId,
    signedUpload,
    totalChunks,
    chunkSizeBytes,
    onProgress
}) => {
    const uploadedPaths = []

    for (let index = 0; index < totalChunks; index++) {
        const chunkUpload = index === 0
            ? { signedUpload }
            : await createChunkUpload({
                uploadId,
                filename: file.name,
                chunkIndex: index
            })
        const signedChunk = chunkUpload.signedUpload
        const start = index * chunkSizeBytes
        const end = Math.min(start + chunkSizeBytes, file.size)
        const chunk = file.slice(start, end, file.type || 'text/csv')

        const path = await uploadFileToStorage(chunk, signedChunk)
        uploadedPaths.push(path)

        if (typeof onProgress === 'function') {
            onProgress({
                uploadedChunks: index + 1,
                totalChunks,
                percent: Math.round(((index + 1) / totalChunks) * 45)
            })
        }
    }

    return uploadedPaths
}

const formatMb = (bytes) => {
    if (!Number.isFinite(bytes)) return 'desconocido'
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const readErrorMessage = async (res, fallback) => {
    const text = await res.text().catch(() => '')

    if (!text) return fallback

    try {
        const data = JSON.parse(text)
        return data.error || fallback
    } catch {
        return text.includes('<!DOCTYPE') || text.includes('<html')
            ? fallback
            : text
    }
}

export const createUploadJob = async (file) => {
    const res = await fetch('/.netlify/functions/upload-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: file.name,
            size: file.size
        })
    })

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, `No se pudo iniciar la carga. Tamano del archivo: ${formatMb(file.size)}`))
    }

    return res.json()
}

export const processFile = async (uploadId, filePath, chunkPaths = null) => {
    const res = await fetch('/.netlify/functions/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, filePath, chunkPaths })
    })

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, 'No se pudo procesar el archivo'))
    }

    return res.json()
}

export const processFileChunk = async ({
    uploadId,
    chunkPaths,
    chunkIndex,
    headerLine,
    pendingLine,
    totalProcessed
}) => {
    const res = await fetch('/.netlify/functions/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uploadId,
            chunkPaths,
            chunkIndex,
            headerLine,
            pendingLine,
            totalProcessed
        })
    })

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, `No se pudo procesar la parte ${chunkIndex + 1}`))
    }

    return res.json()
}

export const getUploadStatus = async (uploadId) => {
    const res = await fetch(`/.netlify/functions/upload-status?uploadId=${encodeURIComponent(uploadId)}`)

    if (!res.ok) {
        throw new Error(await readErrorMessage(res, 'No se pudo consultar el estado'))
    }

    return res.json()
}
