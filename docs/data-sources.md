# Fuentes de datos

| Dato | Fuente | Uso |
|---|---|---|
| Consumo de coches | [Agencia Europea de Medio Ambiente (EEA)](https://www.eea.europa.eu/en/datahub/datahubitem-view/fa8b1229-3db6-495d-b18e-9c9b3267c02b), «Monitoring of CO2 emissions from passenger cars» (Reglamento UE 2019/631), vía la API pública Discodata | Catálogo `car_models` (`pnpm db:import-cars`) |
| Rutas | OSRM público, datos © OpenStreetMap | `/api/route` |
| Búsqueda de lugares | Photon (Komoot), datos © OpenStreetMap | `/api/geocode` |
| Mapa | OpenFreeMap, © OpenMapTiles, datos © OpenStreetMap | MapLibre |

## Catálogo de coches

- Filas agregadas de **España**, matriculaciones de 2021 (definitivo) y 2022 (provisional), que es lo último que publica la API.
- Solo gasolina, diésel (incluidos híbridos no enchufables) y eléctricos. Se excluyen híbridos enchufables, GNC e hidrógeno porque su consumo WLTP no representa un viaje largo, y los bifuel de GLP porque el dato no indica con qué combustible se midió.
- Consumo WLTP medio ponderado por matriculaciones; en eléctricos, `Z` (Wh/km) ÷ 10 = kWh/100 km. Los valores WLTP suelen ser inferiores al consumo real: la interfaz permite ajustarlo.
- **Pendiente de revisar antes de publicar:** la licencia exacta de reutilización del dataset (la EEA suele publicar bajo CC BY 4.0, pero no pude comprobarla desde las páginas consultadas) y dónde mostrar la atribución.
