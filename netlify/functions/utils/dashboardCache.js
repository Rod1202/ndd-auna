import { supabase } from './supabaseClient.js'

const sumNumber = (value) => Number(value || 0)

const normalizeLabel = (value, fallback = 'Sin dato') => {
    const text = String(value ?? '').trim()
    return text || fallback
}

const toDateKey = (value) => {
    if (!value) return null
    return String(value).slice(0, 10)
}

const addDistribution = (map, category, label, row, extra = {}) => {
    const key = `${category}::${label}`
    const current = map.get(key) || {
        category,
        label,
        total_paginas: 0,
        total_costo: 0,
        total_count: 0,
        extra: {}
    }

    current.total_paginas += sumNumber(row.paginas_total)
    current.total_costo += sumNumber(row.costo_total)
    current.total_count += 1
    current.extra = { ...current.extra, ...extra }
    map.set(key, current)
}

const fetchExistingDistribution = async (category, labels) => {
    if (!labels.length) return new Map()

    const { data, error } = await supabase
        .from('dashboard_distribution')
        .select('*')
        .eq('category', category)
        .in('label', labels)

    if (error) throw error

    return new Map((data || []).map((item) => [item.label, item]))
}

const upsertDistributionCategory = async (category, items) => {
    const categoryItems = items.filter((item) => item.category === category)
    if (!categoryItems.length) return

    const existing = await fetchExistingDistribution(
        category,
        categoryItems.map((item) => item.label)
    )

    const payload = categoryItems.map((item) => {
        const previous = existing.get(item.label)

        return {
            category: item.category,
            label: item.label,
            total_paginas: sumNumber(previous?.total_paginas) + sumNumber(item.total_paginas),
            total_costo: sumNumber(previous?.total_costo) + sumNumber(item.total_costo),
            total_count: sumNumber(previous?.total_count) + sumNumber(item.total_count),
            extra: {
                ...(previous?.extra || {}),
                ...(item.extra || {})
            }
        }
    })

    const { error } = await supabase
        .from('dashboard_distribution')
        .upsert(payload, { onConflict: 'category,label' })

    if (error) throw error
}

const upsertTendencia = async (rows) => {
    const map = new Map()

    for (const row of rows) {
        const dia = toDateKey(row.fecha_impresion)
        if (!dia) continue

        const current = map.get(dia) || {
            dia,
            total_paginas: 0,
            total_costo: 0
        }

        current.total_paginas += sumNumber(row.paginas_total)
        current.total_costo += sumNumber(row.costo_total)
        map.set(dia, current)
    }

    const days = [...map.keys()]
    if (!days.length) return

    const { data, error } = await supabase
        .from('dashboard_tendencia')
        .select('*')
        .in('dia', days)

    if (error) throw error

    const existing = new Map((data || []).map((item) => [item.dia, item]))
    const payload = [...map.values()].map((item) => {
        const previous = existing.get(item.dia)

        return {
            dia: item.dia,
            total_paginas: sumNumber(previous?.total_paginas) + item.total_paginas,
            total_costo: sumNumber(previous?.total_costo) + item.total_costo
        }
    })

    const { error: upsertError } = await supabase
        .from('dashboard_tendencia')
        .upsert(payload, { onConflict: 'dia' })

    if (upsertError) throw upsertError
}

const updateKpis = async (rows, missingInventory) => {
    const totals = rows.reduce((current, row) => {
        current.total_registros += 1
        current.total_paginas += sumNumber(row.paginas_total)
        current.total_color += sumNumber(row.paginas_color)
        current.total_mono += sumNumber(row.paginas_mono)
        current.total_costo += sumNumber(row.costo_total)
        current.duplex_count += row.duplex ? 1 : 0
        current.simplex_count += row.duplex ? 0 : 1
        return current
    }, {
        total_registros: 0,
        total_paginas: 0,
        total_color: 0,
        total_mono: 0,
        total_costo: 0,
        duplex_count: 0,
        simplex_count: 0
    })

    const { data } = await supabase
        .from('dashboard_kpis')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

    const next = {
        id: 1,
        total_registros: sumNumber(data?.total_registros) + totals.total_registros,
        total_paginas: sumNumber(data?.total_paginas) + totals.total_paginas,
        total_color: sumNumber(data?.total_color) + totals.total_color,
        total_mono: sumNumber(data?.total_mono) + totals.total_mono,
        total_costo: sumNumber(data?.total_costo) + totals.total_costo,
        total_usuarios: sumNumber(data?.total_usuarios),
        total_impresoras: sumNumber(data?.total_impresoras),
        duplex_count: sumNumber(data?.duplex_count) + totals.duplex_count,
        simplex_count: sumNumber(data?.simplex_count) + totals.simplex_count,
        sin_inventario: sumNumber(data?.sin_inventario) + missingInventory,
        refreshed_at: new Date().toISOString()
    }

    const { error } = await supabase
        .from('dashboard_kpis')
        .upsert(next, { onConflict: 'id' })

    if (error) throw error
}

const updateDistinctKpis = async () => {
    const [usuarios, impresoras] = await Promise.all([
        supabase
            .from('dashboard_distribution')
            .select('label', { count: 'exact', head: true })
            .eq('category', 'usuario'),
        supabase
            .from('dashboard_distribution')
            .select('label', { count: 'exact', head: true })
            .eq('category', 'impresora')
    ])

    const { error } = await supabase
        .from('dashboard_kpis')
        .update({
            total_usuarios: usuarios.count || 0,
            total_impresoras: impresoras.count || 0
        })
        .eq('id', 1)

    if (error) throw error
}

export const updateDashboardCache = async (rows) => {
    if (!rows.length) return

    const series = [...new Set(rows.map((row) => row.impresora_serie).filter(Boolean))]
    const inventoryResult = series.length
        ? await supabase
            .from('inventario')
            .select('serie, unidad_negocio, sede, area')
            .in('serie', series)
        : { data: [], error: null }

    if (inventoryResult.error) throw inventoryResult.error

    const inventoryBySerie = new Map(
        (inventoryResult.data || []).map((item) => [item.serie?.trim().toUpperCase(), item])
    )
    const distributions = new Map()
    let missingInventory = 0

    for (const row of rows) {
        const serie = row.impresora_serie?.trim().toUpperCase()
        const inventory = inventoryBySerie.get(serie)

        if (serie && !inventory) {
            missingInventory += 1
            addDistribution(distributions, 'serie_no_encontrada', serie, { paginas_total: 0, costo_total: 0 })
        }

        addDistribution(distributions, 'usuario', normalizeLabel(row.logon_nombre, 'Sin usuario'), row)
        addDistribution(distributions, 'impresora', normalizeLabel(serie, 'Sin serie'), row)
        addDistribution(distributions, 'trabajo', normalizeLabel(row.nombre_trabajo, 'Sin titulo'), row)
        addDistribution(distributions, 'unidad_negocio', normalizeLabel(inventory?.unidad_negocio, 'Sin inventario'), row)
        addDistribution(distributions, 'sede', normalizeLabel(inventory?.sede, 'Sin inventario'), row)
        addDistribution(distributions, 'area', normalizeLabel(inventory?.area, 'Sin inventario'), row)
        addDistribution(distributions, 'papel', normalizeLabel(row.papel), row)
        addDistribution(distributions, 'tipo_trabajo', normalizeLabel(row.tipo_trabajo), row)
    }

    await updateKpis(rows, missingInventory)
    await upsertTendencia(rows)

    const items = [...distributions.values()]
    const categories = [...new Set(items.map((item) => item.category))]

    for (const category of categories) {
        await upsertDistributionCategory(category, items)
    }

    await updateDistinctKpis()
}
