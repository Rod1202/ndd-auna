import { supabase } from './utils/supabaseClient.js'

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})

const normalizeSerie = (value) => String(value || '').trim().toUpperCase()

export const handler = async (event) => {
    try {
        const usuario = decodeURIComponent(event.queryStringParameters?.usuario || '').trim()
        const limit = Math.min(Number(event.queryStringParameters?.limit || 5000), 10000)

        if (!usuario) {
            return json(400, { error: 'usuario is required' })
        }

        const { data: logs, error } = await supabase
            .from('print_logs')
            .select(`
                id,
                logon_nombre,
                nombre_completo,
                nombre_trabajo,
                impresora_serie,
                paginas_mono,
                paginas_color,
                paginas_total,
                costo_mono,
                costo_color,
                costo_total,
                fecha_impresion
            `)
            .eq('logon_nombre', usuario)
            .order('fecha_impresion', { ascending: false })
            .limit(limit)

        if (error) throw error

        const { data: inventario, error: inventoryError } = await supabase
            .from('inventario')
            .select('serie, unidad_negocio, sede, area')

        if (inventoryError) throw inventoryError

        const inventoryBySerie = new Map(
            (inventario || []).map((item) => [normalizeSerie(item.serie), item])
        )

        const rows = (logs || []).map((log) => {
            const serie = normalizeSerie(log.impresora_serie)
            const inventory = inventoryBySerie.get(serie) || {}

            return {
                ...log,
                impresora_serie: serie || log.impresora_serie,
                unidad_negocio: inventory.unidad_negocio || null,
                sede: inventory.sede || null,
                area: inventory.area || null
            }
        })

        return json(200, { rows })
    } catch (error) {
        return json(500, { error: error.message })
    }
}
