import { supabase } from './utils/supabaseClient.js'

const BATCH_SIZE = 1000

export const insertBatch = async (rows) => {
    const { error } = await supabase
        .from('print_logs')
        .insert(rows)

    if (error) {
        console.error('Error insert batch:', error)
        throw error
    }
}

export const processBatches = async (bufferRows) => {
    for (let i = 0; i < bufferRows.length; i += BATCH_SIZE) {
        const batch = bufferRows.slice(i, i + BATCH_SIZE)
        await insertBatch(batch)
    }
}
