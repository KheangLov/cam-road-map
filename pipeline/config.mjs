// Data source configuration for the pipeline.
// Override any of these with environment variables in CI.

export const config = {
  // Geofabrik Cambodia OSM extract (updated daily).
  osmPbfUrl:
    process.env.OSM_PBF_URL ||
    'https://download.geofabrik.de/asia/cambodia-latest.osm.pbf',

  // HDX / OCHA COD-AB administrative boundaries (NCDD-sourced).
  // The dataset ships as ONE GeoJSON bundle (all admin levels in a single zip).
  // Resource URL resolved from the CKAN API; refresh if HDX rotates it.
  boundaries: {
    bundleUrl:
      process.env.BOUNDARIES_URL ||
      'https://data.humdata.org/dataset/7472f7e0-3deb-44d9-bd36-38237c666a2e/resource/b89f2deb-6ffa-4a16-9972-7e6c12a92620/download/khm_admin_boundaries.geojson.zip',
    // Inner GeoJSON filename per admin level inside the bundle.
    members: {
      adm1: 'khm_admin1.geojson', // province / capital
      adm2: 'khm_admin2.geojson', // district / municipality
      adm3: 'khm_admin3.geojson', // commune / sangkat
    },
  },

  // Field-name mapping from the boundary source's attributes to our schema.
  // Current HDX COD-AB (V_01) uses lowercase fields and has NO Khmer name field
  // (name1/2/3 are null), so name_km falls back to English in the app.
  boundaryFields: {
    adm1: { pcode: 'adm1_pcode', name_en: 'adm1_name', name_km: 'adm1_name1', parent: 'adm0_pcode' },
    adm2: { pcode: 'adm2_pcode', name_en: 'adm2_name', name_km: 'adm2_name1', parent: 'adm1_pcode' },
    adm3: { pcode: 'adm3_pcode', name_en: 'adm3_name', name_km: 'adm3_name1', parent: 'adm2_pcode' },
  },

  // tippecanoe zoom range for the combined archive.
  tiles: {
    minZoom: 4,
    maxZoom: 13,
    output: 'cambodia.pmtiles',
  },
}
