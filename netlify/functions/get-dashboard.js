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

const safeQuery = async (query, fallback = []) => {
    const result = await query

    if (result.error) {
        return {
            data: fallback,
            warning: result.error.message
        }
    }

    return {
        data: result.data || fallback,
        warning: null
    }
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

const percentDistribution = (items, valueKey = 'total_paginas', limit = 8) => {
    const total = items.reduce((sum, item) => sum + sumNumber(item[valueKey]), 0)

    return items
        .sort((a, b) => sumNumber(b[valueKey]) - sumNumber(a[valueKey]))
        .slice(0, limit)
        .map((item) => ({
            label: item.label,
            value: sumNumber(item[valueKey]),
            percent: total ? Number(((sumNumber(item[valueKey]) / total) * 100).toFixed(2)) : 0
        }))
}

const readDistributionCategory = (category, limit = 20) => {
    return safeQuery(
        supabase
            .from('dashboard_distribution')
            .select('*')
            .eq('category', category)
            .order('total_paginas', { ascending: false })
            .limit(limit)
    )
}

const loadDashboardCache = async () => {
    const [
        kpis,
        tendencia,
        usuarios,
        impresoras,
        trabajos,
        unidadNegocio,
        sedes,
        areas,
        papel,
        tipoTrabajo,
        seriesNoEncontradas
    ] = await Promise.all([
        safeQuery(supabase.from('dashboard_kpis').select('*').eq('id', 1).maybeSingle(), null),
        safeQuery(supabase.from('dashboard_tendencia').select('*').order('dia', { ascending: true })),
        readDistributionCategory('usuario', 10),
        readDistributionCategory('impresora', 10),
        readDistributionCategory('trabajo', 10),
        readDistributionCategory('unidad_negocio', 8),
        readDistributionCategory('sede', 5),
        readDistributionCategory('area', 5),
        readDistributionCategory('papel', 8),
        readDistributionCategory('tipo_trabajo', 6),
        readDistributionCategory('serie_no_encontrada', 200)
    ])

    if (!kpis.data || kpis.warning) {
        return null
    }

    const kpi = kpis.data
    const totalRegistros = sumNumber(kpi.total_registros)
    const sinInventario = sumNumber(kpi.sin_inventario)

    return {
        resumen: {
            total_registros: kpi.total_registros,
            total_paginas: kpi.total_paginas,
            total_color: kpi.total_color,
            total_mono: kpi.total_mono,
            total_costo: kpi.total_costo,
            total_usuarios: kpi.total_usuarios,
            total_impresoras: kpi.total_impresoras
        },
        usuarios: usuarios.data
            .sort((a, b) => sumNumber(b.total_paginas) - sumNumber(a.total_paginas))
            .slice(0, 10)
            .map((item) => ({
                logon_nombre: item.label,
                total_paginas: item.total_paginas,
                total_costo: item.total_costo
            })),
        impresoras: impresoras.data
            .sort((a, b) => sumNumber(b.total_paginas) - sumNumber(a.total_paginas))
            .slice(0, 10)
            .map((item) => ({
                impresora_serie: item.label,
                total_paginas: item.total_paginas
            })),
        tendencia: tendencia.data || [],
        colorMono: [{
            total_color: kpi.total_color,
            total_mono: kpi.total_mono
        }],
        trabajos: trabajos.data
            .sort((a, b) => sumNumber(b.total_paginas) - sumNumber(a.total_paginas))
            .slice(0, 10)
            .map((item) => ({
                nombre_trabajo: item.label,
                frecuencia: item.total_count,
                total_paginas: item.total_paginas,
                impresoras: item.extra?.impresoras || 0,
                usuarios: item.extra?.usuarios || 0
            })),
        seriesNoEncontradas: seriesNoEncontradas.data
            .map((item) => ({ impresora_serie: item.label })),
        calidadInventario: {
            total_registros: totalRegistros,
            sin_inventario: sinInventario,
            porcentaje_sin_inventario: totalRegistros
                ? Number(((sinInventario / totalRegistros) * 100).toFixed(2))
                : 0
        },
        unidadNegocioDistribucion: percentDistribution(unidadNegocio.data),
        topSedes: percentDistribution(sedes.data, 'total_paginas', 5),
        topAreas: percentDistribution(areas.data, 'total_paginas', 5),
        papelDistribucion: percentDistribution(papel.data),
        tipoTrabajoDistribucion: percentDistribution(tipoTrabajo.data, 'total_paginas', 6),
        duplexSimplex: {
            duplex: kpi.duplex_count,
            simplex: kpi.simplex_count,
            total: sumNumber(kpi.duplex_count) + sumNumber(kpi.simplex_count),
            duplexPercent: totalRegistros ? Number(((sumNumber(kpi.duplex_count) / totalRegistros) * 100).toFixed(2)) : 0,
            simplexPercent: totalRegistros ? Number(((sumNumber(kpi.simplex_count) / totalRegistros) * 100).toFixed(2)) : 0
        },
        warnings: [
            tendencia.warning,
            usuarios.warning,
            impresoras.warning,
            trabajos.warning,
            unidadNegocio.warning,
            sedes.warning,
            areas.warning,
            papel.warning,
            tipoTrabajo.warning,
            seriesNoEncontradas.warning
        ].filter(Boolean)
    }
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
        const cachedDashboard = await loadDashboardCache()

        if (cachedDashboard) {
            return json(200, cachedDashboard)
        }

        const [
            usuarios,
            impresoras,
            tendencia,
            colorMono,
            logsSeries,
            inventario
        ] = await Promise.all([
            safeQuery(supabase.from('v_top_usuarios').select('*').limit(10)),
            safeQuery(supabase.from('v_top_impresoras').select('*').limit(10)),
            safeQuery(supabase.from('v_tendencia').select('*')),
            safeQuery(supabase.from('v_color_mono').select('*')),
            safeQuery(supabase
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
                .limit(5000)),
            safeQuery(supabase.from('inventario').select('serie, unidad_negocio, sede, area'))
        ])

        const inventoryQuality = buildInventoryQuality(
            logsSeries.data,
            inventario.data
        )
        const dashboardAnalytics = buildDashboardAnalytics(
            logsSeries.data,
            inventario.data
        )
        const warnings = [
            usuarios.warning,
            impresoras.warning,
            tendencia.warning,
            colorMono.warning,
            logsSeries.warning,
            inventario.warning
        ].filter(Boolean)

        return json(200, {
            resumen: null,
            usuarios: usuarios.data,
            impresoras: impresoras.data,
            tendencia: tendencia.data,
            colorMono: colorMono.data,
            trabajos: dashboardAnalytics.topTrabajos,
            seriesNoEncontradas: inventoryQuality.seriesNoEncontradas,
            calidadInventario: inventoryQuality.calidadInventario,
            unidadNegocioDistribucion: dashboardAnalytics.unidadNegocioDistribucion,
            topSedes: dashboardAnalytics.topSedes,
            topAreas: dashboardAnalytics.topAreas,
            papelDistribucion: dashboardAnalytics.papelDistribucion,
            tipoTrabajoDistribucion: dashboardAnalytics.tipoTrabajoDistribucion,
            duplexSimplex: dashboardAnalytics.duplexSimplex,
            warnings
        })
    } catch (error) {
        return json(500, { error: error.message })
    }
}
