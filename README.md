# Orchestra MCP

Tiny router MCP for Cursor:
- `scaffold`: makes `.orchestra/` and `.orchestra/jobs/`
- `plan`: writes `.orchestra/plan.json`
- `split`: makes multiple job JSONs
- `route`: one-shot task -> `{role, branch}` + job file
- `pr`: optional git/gh helper

## Install
pnpm i
pnpm build

## Run (manual)
node dist/server.js