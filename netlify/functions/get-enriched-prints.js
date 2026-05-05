import { supabase } from './utils/supabaseClient.js'

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})

const assertQuery = (result) => {
    if (result.error) throw result.error
    return result.data || []
}

const sumNumber = (value) => Number(value || 0)

export const handler = async (event) => {
    try {
        const limit = Math.min(Number(event.queryStringParameters?.limit || 500), 2000)

        const logsResult = await supabase
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
            .order('fecha_impresion', { ascending: false })
            .limit(limit)

        const logs = assertQuery(logsResult)
        const series = [...new Set(logs.map((log) => log.impresora_serie?.trim().toUpperCase()).filter(Boolean))]

        const inventoryResult = series.length
            ? await supabase
                .from('inventario')
                .select('serie, unidad_negocio, sede, area')
                .in('serie', series)
            : { data: [], error: null }

        const inventario = assertQuery(inventoryResult)
        const inventoryBySerie = new Map(
            inventario.map((item) => [item.serie?.trim().toUpperCase(), item])
        )

        const rows = logs.map((log) => {
            const serie = log.impresora_serie?.trim().toUpperCase()
            const inventory = inventoryBySerie.get(serie) || {}

            return {
                ...log,
                impresora_serie: serie || log.impresora_serie,
                unidad_negocio: inventory.unidad_negocio || null,
                sede: inventory.sede || null,
                area: inventory.area || null,
                inventario_encontrado: Boolean(inventory.serie)
            }
        })

        const sedesMap = new Map()
        const impresorasMap = new Map()
        const usuariosMap = new Map()

        for (const row of rows) {
            const sede = row.sede || 'Sin inventario'
            const current = sedesMap.get(sede) || {
                sede,
                unidad_negocio: row.unidad_negocio || '-',
                registros: 0,
                paginas_mono: 0,
                paginas_color: 0,
                paginas_total: 0,
                costo_mono: 0,
                costo_color: 0,
                costo_total: 0,
                impresoras: new Set(),
                usuarios: new Set()
            }

            current.registros += 1
            current.paginas_mono += sumNumber(row.paginas_mono)
            current.paginas_color += sumNumber(row.paginas_color)
            current.paginas_total += sumNumber(row.paginas_total)
            current.costo_mono += sumNumber(row.costo_mono)
            current.costo_color += sumNumber(row.costo_color)
            current.costo_total += sumNumber(row.costo_total)
            if (row.impresora_serie) current.impresoras.add(row.impresora_serie)
            if (row.logon_nombre) current.usuarios.add(row.logon_nombre)

            sedesMap.set(sede, current)

            const printerKey = row.impresora_serie || 'Sin serie'
            const printer = impresorasMap.get(printerKey) || {
                impresora_serie: printerKey,
                unidad_negocio: row.unidad_negocio || '-',
                sede: row.sede || 'Sin inventario',
                area: row.area || '-',
                paginas_mono: 0,
                paginas_color: 0,
                paginas_total: 0,
                costo_mono: 0,
                costo_color: 0,
                costo_total: 0,
                usuarios: new Set()
            }

            printer.paginas_mono += sumNumber(row.paginas_mono)
            printer.paginas_color += sumNumber(row.paginas_color)
            printer.paginas_total += sumNumber(row.paginas_total)
            printer.costo_mono += sumNumber(row.costo_mono)
            printer.costo_color += sumNumber(row.costo_color)
            printer.costo_total += sumNumber(row.costo_total)
            if (row.logon_nombre) printer.usuarios.add(row.logon_nombre)

            impresorasMap.set(printerKey, printer)

            const userKey = row.logon_nombre || row.nombre_completo || 'Sin usuario'
            const user = usuariosMap.get(userKey) || {
                usuario: userKey,
                nombre_completo: row.nombre_completo || null,
                impresiones: 0,
                paginas_mono: 0,
                paginas_color: 0,
                paginas_total: 0,
                costo_mono: 0,
                costo_color: 0,
                costo_total: 0,
                impresoras: new Set(),
                sedes: new Set(),
                areas: new Set(),
                unidades_negocio: new Set()
            }

            user.impresiones += 1
            user.paginas_mono += sumNumber(row.paginas_mono)
            user.paginas_color += sumNumber(row.paginas_color)
            user.paginas_total += sumNumber(row.paginas_total)
            user.costo_mono += sumNumber(row.costo_mono)
            user.costo_color += sumNumber(row.costo_color)
            user.costo_total += sumNumber(row.costo_total)
            if (row.impresora_serie) user.impresoras.add(row.impresora_serie)
            if (row.sede) user.sedes.add(row.sede)
            if (row.area) user.areas.add(row.area)
            if (row.unidad_negocio) user.unidades_negocio.add(row.unidad_negocio)

            usuariosMap.set(userKey, user)
        }

        const sedes = [...sedesMap.values()]
            .map((item) => ({
                ...item,
                impresoras: item.impresoras.size,
                usuarios: item.usuarios.size
            }))
            .sort((a, b) => b.costo_total - a.costo_total)

        const impresoras = [...impresorasMap.values()]
            .map((item) => ({
                ...item,
                usuarios: item.usuarios.size
            }))
            .sort((a, b) => b.costo_total - a.costo_total)

        const usuarios = [...usuariosMap.values()]
            .map((item) => ({
                ...item,
                impresoras: [...item.impresoras],
                sedes: [...item.sedes],
                areas: [...item.areas],
                unidades_negocio: [...item.unidades_negocio]
            }))
            .sort((a, b) => b.paginas_total - a.paginas_total)

        return json(200, { rows, sedes, impresoras, usuarios })
    } catch (error) {
        return json(500, { error: error.message })
    }
}
