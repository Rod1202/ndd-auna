import csv from 'csv-parser'
import { Readable } from 'stream'

export const decodeCsv = (buffer) => {
    const utf8 = buffer.toString('utf8')

    if (!utf8.includes('\uFFFD')) {
        return utf8
    }

    return new TextDecoder('windows-1252').decode(buffer)
}

export const parseCsvText = async (text, onRow) => {
    const stream = Readable
        .from([text])
        .pipe(csv({ separator: ';' }))

    for await (const row of stream) {
        await onRow(row)
    }
}

export const parseCsvStream = async (buffer, onRow) => {
    await parseCsvText(decodeCsv(buffer), onRow)
}
