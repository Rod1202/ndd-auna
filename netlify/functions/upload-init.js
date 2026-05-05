import { supabase } from './utils/supabaseClient.js'

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})

const safeFileName = (filename) => {
    return String(filename || 'upload.csv')
        .replace(/[^\w.\-]+/g, '_')
        .replace(/_+/g, '_')
}

const parsePositiveNumber = (value, fallback) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const mbToBytes = (mb) => Math.floor(mb * 1024 * 1024)

const csvBucketLimitMb = parsePositiveNumber(process.env.SUPABASE_CSV_MAX_FILE_SIZE_MB, 50)
const requestedChunkSizeMb = parsePositiveNumber(process.env.CSV_UPLOAD_CHUNK_SIZE_MB, 2)
const chunkSizeMb = Math.min(requestedChunkSizeMb, csvBucketLimitMb, 2)
const chunkSizeBytes = mbToBytes(chunkSizeMb)

const CSV_BUCKET_OPTIONS = {
    public: false,
    fileSizeLimit: mbToBytes(csvBucketLimitMb),
    allowedMimeTypes: [
        'text/csv',
        'application/csv',
        'text/plain',
        'application/vnd.ms-excel'
    ]
}

const ensureCsvBucket = async () => {
    const { error: getError } = await supabase.storage.getBucket('csv-files')

    if (!getError) {
        const { error: updateError } = await supabase.storage.updateBucket('csv-files', CSV_BUCKET_OPTIONS)

        if (updateError) {
            const message = String(updateError.message || '')

            if (message.toLowerCase().includes('maximum allowed size')) {
                throw new Error(`Supabase no permite configurar el bucket csv-files con limite de ${csvBucketLimitMb} MB. Ajusta SUPABASE_CSV_MAX_FILE_SIZE_MB al limite real de tu cuenta.`)
            }

            throw new Error(`No se pudo actualizar el bucket csv-files: ${updateError.message}`)
        }

        return
    }

    const { error: createError } = await supabase.storage.createBucket('csv-files', CSV_BUCKET_OPTIONS)

    if (createError) {
        throw new Error(`No se pudo crear/acceder al bucket csv-files: ${createError.message}`)
    }
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' })
    }

    try {
        const { filename, size } = JSON.parse(event.body || '{}')

        await ensureCsvBucket()

        const { data, error } = await supabase
            .from('uploads')
            .insert([{ nombre_archivo: filename, estado: 'pending', total_registros: 0 }])
            .select()
            .single()

        if (error) throw error

        const totalChunks = Math.max(1, Math.ceil(Number(size || 0) / chunkSizeBytes))
        const filePath = `uploads/${data.id}/part-00001-${safeFileName(filename)}`
        const { data: signedUpload, error: signedError } = await supabase.storage
            .from('csv-files')
            .createSignedUploadUrl(filePath)

        if (signedError) throw signedError

        return json(200, {
            uploadId: data.id,
            safeFilename: safeFileName(filename),
            chunkSizeBytes,
            chunkSizeMb,
            totalChunks,
            signedUpload,
            filePath
        })
    } catch (error) {
        return json(500, { error: error.message })
    }
}
