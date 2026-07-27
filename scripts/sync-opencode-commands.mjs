import { copyFileSync, mkdirSync, readdirSync } from "node:fs"
import { basename, dirname, extname, join } from "node:path"

const root = process.cwd()
const commandDirectory = join(root, ".opencode", "command")
const commands = readdirSync(commandDirectory)
  .filter((file) => extname(file) === ".md")
  .sort()

for (const command of commands) {
  const name = basename(command, ".md")
  const source = join(commandDirectory, command)
  const targets = [
    join(root, ".github", "prompts", `${name}.prompt.md`),
    join(root, ".claude", "skills", name, "SKILL.md"),
  ]

  for (const target of targets) {
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(source, target)
    console.log(`${command} -> ${target.slice(root.length + 1)}`)
  }
}
