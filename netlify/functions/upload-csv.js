import { parseCsvStream } from './utils/parseCsv.js'
import { normalizeRow } from './utils/normalize.js'
import { processBatches } from './insert-batch.js'
import { supabase } from './utils/supabaseClient.js'

export const handler = async (event) => {
    try {
        // 📦 1. Obtener archivo
        const body = JSON.parse(event.body)
        const fileContent = Buffer.from(body.file, 'base64')

        // 📊 2. Crear upload
        const { data: upload } = await supabase
            .from('uploads')
            .insert([{ nombre_archivo: body.filename, estado: 'processing' }])
            .select()
            .single()

        const uploadId = upload.id

        let bufferRows = []
        let total = 0

        // 🔄 3. Parsear CSV en streaming
        await parseCsvStream(fileContent, async (row) => {
            const normalized = normalizeRow(row, uploadId)

            bufferRows.push(normalized)
            total++

            // 🚀 Insert por bloques
            if (bufferRows.length >= 1000) {
                await processBatches(bufferRows)
                bufferRows = []
            }
        })

        // 📌 Insert restante
        if (bufferRows.length > 0) {
            await processBatches(bufferRows)
        }

        // ✅ 4. Actualizar upload
        await supabase
            .from('uploads')
            .update({
                estado: 'completed',
                total_registros: total
            })
            .eq('id', uploadId)

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Procesado OK', total })
        }

    } catch (error) {
        console.error(error)

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }
    }
}
