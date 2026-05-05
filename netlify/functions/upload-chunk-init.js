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

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' })
    }

    try {
        const { uploadId, filename, chunkIndex } = JSON.parse(event.body || '{}')

        if (!uploadId || !filename || !Number.isInteger(chunkIndex)) {
            return json(400, { error: 'uploadId, filename and chunkIndex are required' })
        }

        const partNumber = String(chunkIndex + 1).padStart(5, '0')
        const path = `uploads/${uploadId}/part-${partNumber}-${safeFileName(filename)}`
        const { data: signedUpload, error } = await supabase.storage
            .from('csv-files')
            .createSignedUploadUrl(path)

        if (error) throw error

        return json(200, { signedUpload, path })
    } catch (error) {
        return json(500, { error: error.message })
    }
}
