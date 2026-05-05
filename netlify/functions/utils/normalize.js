export const normalizeRow = (row, uploadId) => {
    const cleanText = (value) => {
        const text = String(value ?? '').trim()
        return text === '' ? null : text
    }

    const toInt = (value) => {
        const number = parseInt(String(value ?? '0').replace(/\D+/g, ''), 10)
        return Number.isNaN(number) ? 0 : number
    }

    const toBooleanDuplex = (value) => {
        const text = String(value ?? '').trim().toLowerCase()
        return ['true', '1', 'si', 'sí', 'duplex', 'doble cara', 'duplexed'].includes(text)
    }

    const toTimestamp = (value) => {
        const text = cleanText(value)
        if (!text) return null

        const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
        if (!match) return text

        const [, day, month, year, hour, minute, second = '00'] = match
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}:${second}`
    }

    return {
        upload_id: uploadId,

        logon_nombre: cleanText(row.Logon_Nombre),
        nombre_completo: cleanText(row.Nombre_Completo),
        correo_electronico: cleanText(row.Correo_electronico),
        dominio: cleanText(row.Dominio),
        cuenta: cleanText(row.Cuenta),
        codigo: cleanText(row.Codigo),

        ordenador: cleanText(row.Ordenador),
        ip: cleanText(row.IP),

        nombre_impresora: cleanText(row.Nombre_de_Impresora),
        puerto_impresora: cleanText(row.Puerto_de_Impresora),
        modelo: cleanText(row.Modelo),
        direccion: cleanText(row.Direccion),
        tipo: cleanText(row.Tipo),
        impresora_serie: cleanText(row.Numero_de_Serie)?.toUpperCase() ?? null,
        direccion_mac: cleanText(row.Direccion_MAC),

        nombre_site: cleanText(row.Nombre_del_Site),
        nombre_departamento: cleanText(row.Nombre_del_Departamento),

        nombre_cola: cleanText(row.Nombre_de_la_Cola),
        driver: cleanText(row.Driver),
        puerto_cola: cleanText(row.Puerto_de_cola),
        compartiendo: cleanText(row.Compartiendo),

        color: cleanText(row.Color),
        calidad: cleanText(row.Calidad),
        aplicacion: cleanText(row.Aplicacion),
        tamano: cleanText(row.Tamano),
        duplex: toBooleanDuplex(row.Duplex),

        paginas_color: toInt(row.Paginas_Color),
        paginas_mono: toInt(row.Paginas_Mono),

        fecha_impresion: toTimestamp(row.Fecha_de_Impresion),
        fecha_inclusion: toTimestamp(row.Fecha_de_Inclusion),

        papel: cleanText(row.Papel),
        origen: cleanText(row.Origen),
        tipo_trabajo: cleanText(row.Tipo_de_Trabajo_de_Impresion),
        confianza_logica: cleanText(row.Confianza_Logica),
        nombre_trabajo: cleanText(row.Titulo),

        raw_payload: row
    }
}
