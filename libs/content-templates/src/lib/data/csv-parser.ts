import { ContentDataContext, ContentDataParser } from '../types/content-data';

/**
 * Configuration of {@link CsvContentDataParser}, i.e. the source's `parser` object.
 */
export interface CsvContentDataParserConfig {
  /** Name the parser is registered under. */
  type: string;
  /** Single character separating fields. Defaults to `,`. */
  delimiter?: string;
  /** Whether the first record holds the column names. Defaults to `true`. */
  header?: boolean;
}

/** Rows produced by {@link CsvContentDataParser}: objects keyed by column name with a header, arrays otherwise. */
export type CsvContentData = Record<string, string>[] | string[][];

/**
 * Parses CSV text following RFC 4180: fields may be quoted, quotes inside quoted fields are escaped as `""`, and
 * quoted fields may contain delimiters and line breaks. Records end with CRLF or LF; one trailing line break is
 * ignored. Empty text yields no records.
 *
 * With `header` (the default), the first record names the columns and each following record becomes an object;
 * missing fields are empty strings and extra fields are dropped. Without `header`, records are returned as arrays.
 *
 * Register with `withDataParsers({ csv: () => new CsvContentDataParser() })`.
 */
export class CsvContentDataParser implements ContentDataParser<CsvContentDataParserConfig, unknown, CsvContentData> {
  /**
   * Parses CSV text into rows.
   *
   * @param input CSV text.
   * @param config Parser configuration.
   * @param _context Node being resolved and abort signal. Unused.
   * @returns The parsed rows.
   * @throws When `input` is not a string, the delimiter is not a single valid character, or a quoted field is not
   * terminated.
   */
  parse(input: unknown, config: CsvContentDataParserConfig, _context: ContentDataContext): CsvContentData {
    if (typeof input !== 'string') {
      throw new Error(`CSV parser expects a string, got ${input === null ? 'null' : typeof input}.`);
    }

    const { delimiter = ',', header = true } = config;
    if (delimiter.length !== 1 || delimiter === '"' || delimiter === '\r' || delimiter === '\n') {
      throw new Error(`Invalid CSV delimiter '${delimiter}'.`);
    }

    const records = parseRecords(input, delimiter);
    if (!header) {
      return records;
    }

    const [columns = [], ...rows] = records;
    return rows.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index] ?? ''])));
  }
}

/**
 * Splits CSV text into records of fields.
 *
 * A quote only opens a quoted field at the start of a field; elsewhere it is kept as a literal character, as are
 * characters between a closing quote and the next delimiter or line break. A CR not followed by LF is literal.
 *
 * @param text CSV text.
 * @param delimiter Single character separating fields.
 * @returns The records.
 * @throws When a quoted field is not terminated.
 */
function parseRecords(text: string, delimiter: string): string[][] {
  // Outside an unterminated quote, a final line break ends the last record rather than starting another.
  const body = text.replace(/\r?\n$/, '');
  if (body === '') {
    return [];
  }

  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let line = 1;
  let index = 0;

  while (index < body.length) {
    const char = body[index];
    const previous = body[index - 1];

    if (char === '"' && (previous === undefined || previous === delimiter || previous === '\n')) {
      const startLine = line;
      index++;
      for (;;) {
        if (index >= body.length) {
          throw new Error(`Unterminated quoted CSV field starting on line ${startLine}.`);
        }
        const quoted = body[index];
        if (quoted === '"') {
          if (body[index + 1] !== '"') {
            index++;
            break;
          }
          index++;
        } else if (quoted === '\n') {
          line++;
        }
        field += quoted;
        index++;
      }
    } else if (char === delimiter) {
      record.push(field);
      field = '';
      index++;
    } else if (char === '\n' || (char === '\r' && body[index + 1] === '\n')) {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
      line++;
      index += char === '\r' ? 2 : 1;
    } else {
      field += char;
      index++;
    }
  }

  record.push(field);
  records.push(record);
  return records;
}
