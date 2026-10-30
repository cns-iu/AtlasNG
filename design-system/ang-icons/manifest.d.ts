/** Name of an icon in the package. */
export type IconName = '2d-ftu' | '3d-ftu' | '3d-ref' | 'adipose-tissue' | 'all-organs' | 'anatomical-systems' | 'api' | 'apps' | 'asctb' | 'biomarker' | 'bladder' | 'blood' | 'bone-marrow' | 'brain' | 'breast' | 'cell-distance-explorer' | 'cell-type' | 'cell-type-annotation-crosswalks' | 'cell-type-population-graphs' | 'cell-type-population-predictor' | 'collections' | 'contribute' | 'dashboard' | 'data' | 'dataset-graphs' | 'design-system' | 'developer-docs' | 'experts' | 'exploration-user-interface' | 'explore' | 'extrapulmonary-bronchus' | 'eye' | 'fallopian-tube-left' | 'fallopian-tube-right' | 'fallopian-tubes' | 'glomerulus' | 'graphs' | 'heart' | 'hra-organ-gallery' | 'hrapop-visualizer' | 'human-atlas-stories' | 'intervertebral-disc' | 'kg-explorer' | 'kidney-left' | 'kidney-right' | 'kidneys' | 'knee' | 'landmark' | 'large-intestine' | 'larynx' | 'liver' | 'lung-left' | 'lung-right' | 'lungs' | 'lymph-nodes' | 'lymphatic-vasculature' | 'manubrium' | 'millitome' | 'mouth' | 'muscular-system' | 'omap' | 'ovaries' | 'ovary-left' | 'ovary-right' | 'palatine-tonsil' | 'pancreas' | 'pelvis' | 'peripheral-nervous-system' | 'placenta' | 'prostate' | 'publications' | 'registration-user-interface' | 'renal-pelvis' | 'renal-pelvis-left' | 'renal-pelvis-right' | 'schema' | 'skeletal-system' | 'skin' | 'small-intestine' | 'spinal-cord' | 'spleen' | 'sternum' | 'stomach' | 'thymus' | 'tissue-origin-predictor' | 'trachea' | 'training' | 'ureter-left' | 'ureter-right' | 'ureters' | 'uterus' | 'vascular-geometry' | 'vasculature-thick' | 'vasculature-thin' | 'vocabulary' | 'web-components';

/** Category of an icon. */
export type IconCategory = 'organs' | 'products' | 'misc';

/** Describes one icon. */
export interface IconManifestEntry {
  /** Icon name, also the font ligature, sprite symbol id, and CSS class suffix. */
  readonly name: IconName;
  /** Category folder of the icon. */
  readonly category: IconCategory;
  /** Hexadecimal Private Use Area codepoint of the font glyph. */
  readonly codepoint: string;
  /** Path of the optimized SVG relative to the package root. */
  readonly path: string;
}

/** Every icon in the package, sorted by name. */
export declare const icons: readonly IconManifestEntry[];

/** Icon categories that contain at least one icon. */
export declare const categories: readonly IconCategory[];
