import supabase from './utils/supabaseClient.js'

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})

export const handler = async (event) => {
    const uploadId = event.queryStringParameters?.uploadId

    if (!uploadId) {
        return json(400, { error: 'uploadId is required' })
    }

    const { data, error } = await supabase
        .from('uploads')
        .select('id, estado, total_registros, nombre_archivo, fecha_carga')
        .eq('id', uploadId)
        .single()

    if (error) {
        return json(500, { error: error.message })
    }

    return json(200, data)
}
