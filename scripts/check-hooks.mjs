/* Static check for the hook-order bug class.

   A hook declared after a conditional early `return` renders a different
   number of hooks on the second pass, so React throws "Rendered more
   hooks than during the previous render." That kills the page at runtime,
   and `vite build` cannot see it.

   Rule enforced: inside a function component, no hook may be declared
   after a `return` that belongs to the component's own control flow.

   Indentation is not a reliable signal here, because both of these are
   body-level control flow at the same nesting depth:
       if (!inc) { return <Loading/>; }        <- conditional early return
       useMemo(() => { return handlers; })    <- return inside a callback
   So scopes are tracked explicitly: a scope opened by `=>` or `function`
   is a nested-function scope, and returns inside it are ignored.
*/
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', 'src');
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (['.jsx', '.js'].includes(extname(p))) files.push(p);
  }
})(ROOT);

const FN_START = /^(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\(/;
const HOOK_NAME = 'use[A-Z]\\w*';
/* Matches `useState(...)`, `const x = useMemo(...)` and the destructuring
   forms `const [a, b] = useState(...)` / `const { a } = useContext(...)`. */
const HOOK_DECL = new RegExp(
  `^\\s+(?:const\\s+(?:\\w+|\\[[^\\]]*\\]|\\{[^}]*\\})\\s*=\\s*)?(?:${HOOK_NAME})\\s*(?:\\(|\\.)`
);
const HOOK_BARE = new RegExp(`^\\s+(?:${HOOK_NAME})\\s*\\(`);
const STRAY_BRACE = /[{}]/g;

/* A brace that opens a nested function body rather than a block. */
const OPENS_FN = /(?:=>\s*\{|\bfunction\b[^(]*\{\s*)$/;

function scanComponent(lines, startIdx) {
  const hooks = [];
  const controlReturns = [];
  // depth 0 is the component's own body; nested blocks go deeper.
  let depth = 0;
  // scopeStack[d] = true when the scope at depth d is a nested function body
  const scopeStack = [false];

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    if (HOOK_DECL.test(line) || HOOK_BARE.test(line)) {
      hooks.push({ line: i + 1, text: line.trim() });
    }

    // A return belongs to this component's control flow only when no
    // nested function scope is open.
    if (/^\s*return\b/.test(line) && scopeStack.every((isFn) => !isFn)) {
      controlReturns.push({ line: i + 1 });
    }

    STRAY_BRACE.lastIndex = 0;
    let m;
    while ((m = STRAY_BRACE.exec(line)) !== null) {
      if (m[0] === '{') {
        const isFn = OPENS_FN.test(line.slice(0, m.index + 1));
        depth += 1;
        scopeStack[depth] = isFn;
      } else {
        // A closing brace at body level is the end of the component.
        if (depth === 0) return { hooks, controlReturns };
        scopeStack[depth] = false;
        depth -= 1;
      }
    }
  }
  return { hooks, controlReturns };
}

let problems = 0;
let components = 0;

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const fn = lines[i].match(FN_START);
    if (!fn) continue;
    components++;
    const { hooks, controlReturns } = scanComponent(lines, i, fn[1]);
    for (const h of hooks) {
      const early = controlReturns.find((r) => r.line < h.line);
      if (early) {
        problems++;
        console.log(
          `FAIL  ${file}:${h.line}  hook "${h.text}" is declared after the early return at line ${early.line} in ${fn[1]}()`
        );
      }
    }
  }
}

console.log(`\nchecked ${components} components across ${files.length} files`);
console.log(problems ? `${problems} HOOK-ORDER BUG(S)` : 'no hook-order bugs found');
process.exit(problems ? 1 : 0);