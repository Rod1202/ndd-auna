import supabase from './utils/supabaseClient.js'

const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})

const assertQuery = (result) => {
    if (result.error) throw result.error
    return result.data || []
}

const buildInventoryQuality = (logs, inventario) => {
    const inventorySeries = new Set(
        inventario
            .map((item) => item.serie?.trim().toUpperCase())
            .filter(Boolean)
    )

    const missingRows = logs.filter((log) => {
        const serie = log.impresora_serie?.trim().toUpperCase()
        return serie && !inventorySeries.has(serie)
    })

    const missingSeries = [...new Set(missingRows.map((log) => log.impresora_serie?.trim().toUpperCase()))]
        .filter(Boolean)
        .sort()
        .map((impresora_serie) => ({ impresora_serie }))

    const totalRegistros = logs.length
    const sinInventario = missingRows.length

    return {
        seriesNoEncontradas: missingSeries,
        calidadInventario: {
            total_registros: totalRegistros,
            sin_inventario: sinInventario,
            porcentaje_sin_inventario: totalRegistros
                ? Number(((sinInventario / totalRegistros) * 100).toFixed(2))
                : 0
        }
    }
}

const sumNumber = (value) => Number(value || 0)

const normalizeLabel = (value, fallback = 'Sin dato') => {
    const text = String(value ?? '').trim()
    return text || fallback
}

const addToGroup = (map, key, amount) => {
    const label = normalizeLabel(key)
    const current = map.get(label) || { label, value: 0 }
    current.value += sumNumber(amount)
    map.set(label, current)
}

const toSortedDistribution = (map, limit = 8) => {
    const total = [...map.values()].reduce((sum, item) => sum + item.value, 0)

    return [...map.values()]
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)
        .map((item) => ({
            ...item,
            percent: total ? Number(((item.value / total) * 100).toFixed(2)) : 0
        }))
}

const buildDashboardAnalytics = (logs, inventario) => {
    const inventoryBySerie = new Map(
        inventario.map((item) => [item.serie?.trim().toUpperCase(), item])
    )

    const unidadMap = new Map()
    const sedesMap = new Map()
    const areasMap = new Map()
    const papelMap = new Map()
    const tipoTrabajoMap = new Map()
    const trabajosMap = new Map()
    let duplex = 0
    let simplex = 0

    for (const log of logs) {
        const serie = log.impresora_serie?.trim().toUpperCase()
        const inventory = inventoryBySerie.get(serie) || {}
        const paginas = sumNumber(log.paginas_total)

        if (inventory.unidad_negocio) addToGroup(unidadMap, inventory.unidad_negocio, paginas)
        if (inventory.sede) addToGroup(sedesMap, inventory.sede, paginas)
        if (inventory.area) addToGroup(areasMap, inventory.area, paginas)
        addToGroup(papelMap, log.papel, paginas)
        addToGroup(tipoTrabajoMap, log.tipo_trabajo, paginas)

        if (log.duplex) {
            duplex += 1
        } else {
            simplex += 1
        }

        const trabajoKey = normalizeLabel(log.nombre_trabajo, 'Sin titulo')
        const trabajo = trabajosMap.get(trabajoKey) || {
            nombre_trabajo: trabajoKey,
            frecuencia: 0,
            total_paginas: 0,
            impresoras: new Set(),
            usuarios: new Set()
        }

        trabajo.frecuencia += 1
        trabajo.total_paginas += paginas
        if (serie) trabajo.impresoras.add(serie)
        if (log.logon_nombre) trabajo.usuarios.add(log.logon_nombre)
        trabajosMap.set(trabajoKey, trabajo)
    }

    const totalDuplexSimplex = duplex + simplex

    return {
        unidadNegocioDistribucion: toSortedDistribution(unidadMap),
        topSedes: toSortedDistribution(sedesMap, 5),
        topAreas: toSortedDistribution(areasMap, 5),
        papelDistribucion: toSortedDistribution(papelMap, 8),
        tipoTrabajoDistribucion: toSortedDistribution(tipoTrabajoMap, 6),
        duplexSimplex: {
            duplex,
            simplex,
            total: totalDuplexSimplex,
            duplexPercent: totalDuplexSimplex ? Number(((duplex / totalDuplexSimplex) * 100).toFixed(2)) : 0,
            simplexPercent: totalDuplexSimplex ? Number(((simplex / totalDuplexSimplex) * 100).toFixed(2)) : 0
        },
        topTrabajos: [...trabajosMap.values()]
            .map((item) => ({
                ...item,
                impresoras: item.impresoras.size,
                usuarios: item.usuarios.size
            }))
            .sort((a, b) => b.total_paginas - a.total_paginas)
            .slice(0, 10)
    }
}

export const handler = async () => {
    try {
        const [
            usuarios,
            impresoras,
            tendencia,
            colorMono,
            logsSeries,
            inventario
        ] = await Promise.all([
            supabase.from('v_top_usuarios').select('*').limit(10),
            supabase.from('v_top_impresoras').select('*').limit(10),
            supabase.from('v_tendencia').select('*'),
            supabase.from('v_color_mono').select('*'),
            supabase
                .from('print_logs')
                .select(`
                    logon_nombre,
                    impresora_serie,
                    paginas_total,
                    duplex,
                    papel,
                    tipo_trabajo,
                    nombre_trabajo
                `)
                .limit(10000),
            supabase.from('inventario').select('serie, unidad_negocio, sede, area')
        ])

        const inventoryQuality = buildInventoryQuality(
            assertQuery(logsSeries),
            assertQuery(inventario)
        )
        const dashboardAnalytics = buildDashboardAnalytics(
            assertQuery(logsSeries),
            assertQuery(inventario)
        )

        return json(200, {
            usuarios: assertQuery(usuarios),
            impresoras: assertQuery(impresoras),
            tendencia: assertQuery(tendencia),
            colorMono: assertQuery(colorMono),
            trabajos: dashboardAnalytics.topTrabajos,
            seriesNoEncontradas: inventoryQuality.seriesNoEncontradas,
            calidadInventario: inventoryQuality.calidadInventario,
            unidadNegocioDistribucion: dashboardAnalytics.unidadNegocioDistribucion,
            topSedes: dashboardAnalytics.topSedes,
            topAreas: dashboardAnalytics.topAreas,
            papelDistribucion: dashboardAnalytics.papelDistribucion,
            tipoTrabajoDistribucion: dashboardAnalytics.tipoTrabajoDistribucion,
            duplexSimplex: dashboardAnalytics.duplexSimplex
        })
    } catch (error) {
        return json(500, { error: error.message })
    }
}
