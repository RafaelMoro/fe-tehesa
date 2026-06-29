import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const files = [
  ['research.md', 'research.prompt.md'],
  ['plan.md', 'plan.prompt.md'],
  ['implement.md', 'implement.md'],
];

for (const [sourceName, targetName] of files) {
  const source = join(root, '.opencode', 'command', sourceName);
  const target = join(root, '.github', 'prompts', targetName);

  if (!existsSync(source)) {
    console.warn(`Skipping missing source: ${sourceName}`);
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  console.log(`${sourceName} -> ${targetName}`);
}
