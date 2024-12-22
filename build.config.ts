import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { defineBuildConfig } from 'unbuild';

type BuildContext = { options: { outDir: string } };
type BuildModule = { path: string };

const updateAnnotations = async (ctx: BuildContext, mod: BuildModule) => {
  const resolvedPath = resolve(ctx.options.outDir, mod.path);

  if (mod.path.startsWith('shared')) {
    const modCode = await readFile(resolvedPath, 'utf8');
    await writeFile(resolvedPath, modCode.replaceAll('$__', '@__'), 'utf8');
  }
};

export default defineBuildConfig({
  outDir: 'lib',
  hooks: {
    'build:done': async (ctx) => {
      await Promise.all(
        ctx.buildEntries.map((mod) => updateAnnotations(ctx, mod)),
      );
    },
  },
});
