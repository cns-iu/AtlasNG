import type { VersionControlFileFormat } from './version-control';

/** Adobe Illustrator artwork. */
export const AI_FILE_FORMAT: VersionControlFileFormat = {
  label: 'AI',
  description: 'Editable vector artwork for Adobe Illustrator.',
};

/** Comma-separated values. */
export const CSV_FILE_FORMAT: VersionControlFileFormat = {
  label: 'CSV',
  description: 'Spreadsheet-friendly data organized in rows and columns.',
};

/** Binary glTF 3D model. */
export const GLB_FILE_FORMAT: VersionControlFileFormat = {
  label: 'GLB',
  description: '3D models packaged with geometry, materials, and textures.',
};

/** JPEG raster image. */
export const JPEG_FILE_FORMAT: VersionControlFileFormat = {
  label: 'JPEG',
  description: 'Compressed raster images suited for photos and web use.',
};

/** JSON data. */
export const JSON_FILE_FORMAT: VersionControlFileFormat = {
  label: 'JSON',
  description: 'Structured data for use in applications and workflows.',
};

/** JSON-LD linked data. */
export const JSON_LD_FILE_FORMAT: VersionControlFileFormat = {
  label: 'JSON-LD',
  description: 'Structured linked data that connects entities and relationships.',
};

/** JSON-LD export of processed knowledge-graph data. */
export const JSON_LD_GRAPH_DATA_FILE_FORMAT: VersionControlFileFormat = {
  label: 'JSON-LD (graph data)',
  description: 'Connected entities and relationships from the knowledge graph.',
};

/** JSON-LD export of source records before graph processing. */
export const JSON_LD_RAW_DATA_FILE_FORMAT: VersionControlFileFormat = {
  label: 'JSON-LD (raw data)',
  description: 'Source records preserved before graph processing.',
};

/** RDF N-Quads. */
export const N_QUADS_FILE_FORMAT: VersionControlFileFormat = {
  label: 'N-Quads',
  description: 'RDF statements with additional graph context.',
};

/** RDF N-Triples. */
export const N_TRIPLES_FILE_FORMAT: VersionControlFileFormat = {
  label: 'N-Triples',
  description: 'RDF statements stored one per line.',
};

/** Apache Parquet columnar data. */
export const PARQUET_FILE_FORMAT: VersionControlFileFormat = {
  label: 'Parquet',
  description: 'Column-based data optimized for large-scale analysis.',
};

/** PDF document. */
export const PDF_FILE_FORMAT: VersionControlFileFormat = {
  label: 'PDF',
  description: 'Fixed-layout documents that preserve text, graphics, and formatting.',
};

/** PNG raster image. */
export const PNG_FILE_FORMAT: VersionControlFileFormat = {
  label: 'PNG',
  description: 'High-quality raster images with transparency support.',
};

/** RDF encoded as XML. */
export const RDF_XML_FILE_FORMAT: VersionControlFileFormat = {
  label: 'RDF/XML',
  description: 'RDF data encoded using XML.',
};

/** SVG vector image. */
export const SVG_FILE_FORMAT: VersionControlFileFormat = {
  label: 'SVG',
  description: 'Scalable vector graphics for web, print, and editing.',
};

/** Tab-separated values. */
export const TSV_FILE_FORMAT: VersionControlFileFormat = {
  label: 'TSV',
  description: 'Tabular data with values separated by tabs.',
};

/** RDF Turtle. */
export const TURTLE_FILE_FORMAT: VersionControlFileFormat = {
  label: 'Turtle',
  description: 'Human-readable RDF data in a compact text format.',
};

/** YAML data. */
export const YAML_FILE_FORMAT: VersionControlFileFormat = {
  label: 'YAML',
  description: 'Human-readable structured data using indentation.',
};

/** Every known file format, used to look up supporting copy for a download option. */
export const FILE_FORMATS: readonly VersionControlFileFormat[] = [
  AI_FILE_FORMAT,
  CSV_FILE_FORMAT,
  GLB_FILE_FORMAT,
  JPEG_FILE_FORMAT,
  JSON_FILE_FORMAT,
  JSON_LD_FILE_FORMAT,
  JSON_LD_GRAPH_DATA_FILE_FORMAT,
  JSON_LD_RAW_DATA_FILE_FORMAT,
  N_QUADS_FILE_FORMAT,
  N_TRIPLES_FILE_FORMAT,
  PARQUET_FILE_FORMAT,
  PDF_FILE_FORMAT,
  PNG_FILE_FORMAT,
  RDF_XML_FILE_FORMAT,
  SVG_FILE_FORMAT,
  TSV_FILE_FORMAT,
  TURTLE_FILE_FORMAT,
  YAML_FILE_FORMAT,
];
