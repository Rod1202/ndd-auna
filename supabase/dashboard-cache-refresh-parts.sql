-- Ejecuta este archivo despues de dashboard-cache.sql si el refresh completo
-- cae por timeout. Puedes ejecutar cada bloque por separado.

truncate table public.dashboard_kpis;
truncate table public.dashboard_tendencia;
truncate table public.dashboard_distribution;

-- KPIs generales
insert into public.dashboard_kpis (
  id,
  total_registros,
  total_paginas,
  total_color,
  total_mono,
  total_costo,
  total_usuarios,
  total_impresoras,
  duplex_count,
  simplex_count,
  sin_inventario,
  refreshed_at
)
select
  1,
  count(*)::bigint,
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.paginas_color), 0)::bigint,
  coalesce(sum(l.paginas_mono), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(distinct nullif(l.logon_nombre, ''))::bigint,
  count(distinct nullif(l.impresora_serie, ''))::bigint,
  count(*) filter (where l.duplex is true)::bigint,
  count(*) filter (where l.duplex is not true)::bigint,
  count(*) filter (where i.serie is null and l.impresora_serie is not null)::bigint,
  now()
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie));

-- Tendencia
insert into public.dashboard_tendencia (dia, total_paginas, total_costo)
select
  date(l.fecha_impresion) as dia,
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0)
from public.print_logs l
where l.fecha_impresion is not null
group by date(l.fecha_impresion);

-- Usuarios
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count, extra)
select 'usuario', coalesce(nullif(l.logon_nombre, ''), 'Sin usuario'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint,
  jsonb_build_object(
    'paginas_mono', coalesce(sum(l.paginas_mono), 0),
    'paginas_color', coalesce(sum(l.paginas_color), 0),
    'costo_mono', coalesce(sum(l.costo_mono), 0),
    'costo_color', coalesce(sum(l.costo_color), 0),
    'cantidad_impresoras', count(distinct nullif(l.impresora_serie, '')),
    'impresoras', coalesce(jsonb_agg(distinct l.impresora_serie) filter (where l.impresora_serie is not null), '[]'::jsonb),
    'sedes', coalesce(jsonb_agg(distinct i.sede) filter (where i.sede is not null), '[]'::jsonb),
    'areas', coalesce(jsonb_agg(distinct i.area) filter (where i.area is not null), '[]'::jsonb),
    'unidades_negocio', coalesce(jsonb_agg(distinct i.unidad_negocio) filter (where i.unidad_negocio is not null), '[]'::jsonb)
  )
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie))
group by coalesce(nullif(l.logon_nombre, ''), 'Sin usuario');

-- Impresoras
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count, extra)
select 'impresora', coalesce(nullif(l.impresora_serie, ''), 'Sin serie'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint,
  jsonb_build_object(
    'unidad_negocio', max(i.unidad_negocio),
    'sede', max(i.sede),
    'area', max(i.area),
    'paginas_mono', coalesce(sum(l.paginas_mono), 0),
    'paginas_color', coalesce(sum(l.paginas_color), 0),
    'costo_mono', coalesce(sum(l.costo_mono), 0),
    'costo_color', coalesce(sum(l.costo_color), 0),
    'usuarios', count(distinct nullif(l.logon_nombre, ''))
  )
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie))
group by coalesce(nullif(l.impresora_serie, ''), 'Sin serie');

-- Trabajos
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count, extra)
select 'trabajo', coalesce(nullif(l.nombre_trabajo, ''), 'Sin titulo'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint,
  jsonb_build_object(
    'impresoras', count(distinct nullif(l.impresora_serie, '')),
    'usuarios', count(distinct nullif(l.logon_nombre, ''))
  )
from public.print_logs l
group by coalesce(nullif(l.nombre_trabajo, ''), 'Sin titulo');

-- Unidad de negocio
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count)
select 'unidad_negocio', coalesce(nullif(i.unidad_negocio, ''), 'Sin inventario'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie))
group by coalesce(nullif(i.unidad_negocio, ''), 'Sin inventario');

-- Sedes
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count, extra)
select 'sede', coalesce(nullif(i.sede, ''), 'Sin inventario'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint,
  jsonb_build_object(
    'unidad_negocio', max(i.unidad_negocio),
    'paginas_mono', coalesce(sum(l.paginas_mono), 0),
    'paginas_color', coalesce(sum(l.paginas_color), 0),
    'costo_mono', coalesce(sum(l.costo_mono), 0),
    'costo_color', coalesce(sum(l.costo_color), 0),
    'impresoras', count(distinct nullif(l.impresora_serie, '')),
    'usuarios', count(distinct nullif(l.logon_nombre, ''))
  )
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie))
group by coalesce(nullif(i.sede, ''), 'Sin inventario');

-- Areas
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count)
select 'area', coalesce(nullif(i.area, ''), 'Sin inventario'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie))
group by coalesce(nullif(i.area, ''), 'Sin inventario');

-- Papel
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count)
select 'papel', coalesce(nullif(l.papel, ''), 'Sin dato'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint
from public.print_logs l
group by coalesce(nullif(l.papel, ''), 'Sin dato');

-- Tipo de trabajo
insert into public.dashboard_distribution (category, label, total_paginas, total_costo, total_count)
select 'tipo_trabajo', coalesce(nullif(l.tipo_trabajo, ''), 'Sin dato'),
  coalesce(sum(l.paginas_total), 0)::bigint,
  coalesce(sum(l.costo_total), 0),
  count(*)::bigint
from public.print_logs l
group by coalesce(nullif(l.tipo_trabajo, ''), 'Sin dato');

-- Series no encontradas
insert into public.dashboard_distribution (category, label, total_count)
select 'serie_no_encontrada', l.impresora_serie, count(*)::bigint
from public.print_logs l
left join public.inventario i
  on upper(trim(l.impresora_serie)) = upper(trim(i.serie))
where i.serie is null
  and l.impresora_serie is not null
group by l.impresora_serie;
