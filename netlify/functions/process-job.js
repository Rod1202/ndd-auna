import { decodeCsv, parseCsvStream, parseCsvText } from './utils/parseCsv.js'
import { normalizeRow } from './utils/normalize.js'
import { processBatches } from './insert-batch.js'
import supabase from './utils/supabaseClient.js'

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})

const normalizeLineEndings = (text) => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

const downloadStorageBuffer = async (filePath) => {
    const { data, error: downloadError } = await supabase.storage
        .from('csv-files')
        .download(filePath)

    if (downloadError) throw downloadError

    return Buffer.from(await data.arrayBuffer())
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return json(405, { error: 'Method not allowed' })
    }

    const {
        uploadId,
        filePath,
        chunkPaths,
        chunkIndex,
        headerLine: receivedHeaderLine,
        pendingLine: receivedPendingLine,
        totalProcessed
    } = JSON.parse(event.body || '{}')

    if (!uploadId || (!filePath && !Array.isArray(chunkPaths))) {
        return json(400, { error: 'uploadId and filePath or chunkPaths are required' })
    }

    let bufferRows = []
    let total = Number(totalProcessed || 0)
    let chunkTotal = 0

    try {
        const isChunkedRun = Array.isArray(chunkPaths) && Number.isInteger(chunkIndex)

        if (!isChunkedRun || chunkIndex === 0) {
            await supabase
                .from('uploads')
                .update({ estado: 'processing', total_registros: total })
                .eq('id', uploadId)
        }

        const onRow = async (row) => {
            bufferRows.push(normalizeRow(row, uploadId))
            total++
            chunkTotal++

            if (bufferRows.length >= 1000) {
                await processBatches(bufferRows)
                bufferRows = []

                await supabase
                    .from('uploads')
                    .update({ total_registros: total })
                    .eq('id', uploadId)
            }
        }

        if (isChunkedRun) {
            const chunkPath = chunkPaths[chunkIndex]

            if (!chunkPath) {
                return json(400, { error: 'chunkIndex fuera de rango' })
            }

            let headerLine = receivedHeaderLine || null
            const buffer = await downloadStorageBuffer(chunkPath)
            const combined = normalizeLineEndings(String(receivedPendingLine || '') + decodeCsv(buffer))
            const lines = combined.split('\n')
            let pendingLine = lines.pop() ?? ''

            if (!headerLine) {
                headerLine = lines.shift()
            }

            const completeLines = lines.filter((line) => line.trim() !== '')

            if (headerLine && completeLines.length > 0) {
                await parseCsvText(`${headerLine}\n${completeLines.join('\n')}`, onRow)
            }

            const done = chunkIndex >= chunkPaths.length - 1

            if (done && headerLine && pendingLine.trim() !== '') {
                await parseCsvText(`${headerLine}\n${pendingLine}`, onRow)
                pendingLine = ''
            }

            if (bufferRows.length > 0) {
                await processBatches(bufferRows)
            }

            await supabase
                .from('uploads')
                .update({ estado: done ? 'completed' : 'processing', total_registros: total })
                .eq('id', uploadId)

            return json(200, {
                uploadId,
                total,
                chunkTotal,
                done,
                nextChunkIndex: chunkIndex + 1,
                headerLine,
                pendingLine
            })
        } else {
            const buffer = await downloadStorageBuffer(filePath)

            await parseCsvStream(buffer, onRow)
        }

        if (bufferRows.length > 0) {
            await processBatches(bufferRows)
        }

        await supabase
            .from('uploads')
            .update({ estado: 'completed', total_registros: total })
            .eq('id', uploadId)

        return json(200, { uploadId, total, done: true })
    } catch (error) {
        await supabase
            .from('print_logs')
            .delete()
            .eq('upload_id', uploadId)

        await supabase
            .from('uploads')
            .update({ estado: 'failed', total_registros: total })
            .eq('id', uploadId)

        return json(500, { error: error.message, total })
    }
}
