export const getDashboard = async () => {
    const res = await fetch('/.netlify/functions/get-dashboard', {
        cache: 'no-store'
    })

    const contentType = res.headers.get('content-type') || ''

    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'No se pudo cargar el dashboard')
    }

    if (!contentType.includes('application/json')) {
        throw new Error('Las funciones Netlify no estan activas. Ejecuta npm run dev y abre la URL de Netlify Dev.')
    }

    return res.json()
}

export const getEnrichedPrints = async () => {
    const res = await fetch('/.netlify/functions/get-enriched-prints?limit=1000')
    const contentType = res.headers.get('content-type') || ''

    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'No se pudo cargar el detalle enriquecido')
    }

    if (!contentType.includes('application/json')) {
        throw new Error('Las funciones Netlify no estan activas. Ejecuta npm run dev y abre la URL de Netlify Dev.')
    }

    return res.json()
}
