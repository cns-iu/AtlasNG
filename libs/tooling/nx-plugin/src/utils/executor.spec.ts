import { logger } from '@nx/devkit';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveOutputPath, runExecutorTask, writeFile } from './executor.ts';

describe('executor utils', () => {
  describe('runExecutorTask', () => {
    beforeEach(() => {
      vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('succeeds when the task resolves', async () => {
      await expect(runExecutorTask(async () => undefined)).resolves.toEqual({ success: true });
    });

    it.each([new Error('boom'), 'boom'])('logs and fails when the task throws %s', async (error) => {
      const result = await runExecutorTask(async () => {
        throw error;
      });

      expect(result).toEqual({ success: false });
      expect(logger.error).toHaveBeenCalledWith('boom');
    });
  });

  describe('resolveOutputPath', () => {
    it('resolves an explicit output against the root', () => {
      expect(resolveOutputPath('/ws', 'in/shape.tokens.json', 'out/_shape.scss', '.shape.scss')).toBe(
        '/ws/out/_shape.scss',
      );
    });

    it.each([
      ['in/shape.tokens.json', '/ws/in/shape.shape.scss'],
      ['in/Shape.JSON', '/ws/in/Shape.shape.scss'],
      ['in/shape.v2.tokens.json', '/ws/in/shape.shape.scss'],
      ['in/shape', '/ws/in/shape.shape.scss'],
    ])('derives the output from %s', (input, expected) => {
      expect(resolveOutputPath('/ws', input, undefined, '.shape.scss')).toBe(expected);
    });
  });

  describe('writeFile', () => {
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), 'executor-utils-'));
    });

    afterEach(() => {
      rmSync(root, { recursive: true, force: true });
    });

    it('writes a file and creates its directory', async () => {
      const outputPath = join(root, 'nested/dir/out.scss');

      await writeFile(outputPath, '$a: 1;\n');

      expect(readFileSync(outputPath, 'utf8')).toBe('$a: 1;\n');
    });
  });
});
