# Orchestra MCP Slash Commands

## 🚀 Available Commands

### `/db <action>` - Database/Supabase Tasks
Routes to: **coder** role  
Branch pattern: `feature/supabase-*`

**Examples:**
```bash
/db Add production_lines table with id, name, smv, operator_count
/db Create user_roles migration with RBAC
/db Update inventory schema for RFID integration
```

**Auto-constraints:**
- No breaking changes
- UUID primary keys
- Timestamps default
- Update schema.graphql
- Generate .sql migration

---

### `/auth <action>` - Authentication Tasks
Routes to: **coder** role  
Branch pattern: `feature/auth-*`

**Examples:**
```bash
/auth Add Clerk login page with loading states
/auth Implement JWT token refresh mechanism
/auth Create role-based route protection
```

**Auto-constraints:**
- Use Clerk auth
- Secure token handling
- Proper error states
- Loading states

---

### `/brand <asset>` - Brand/Design Assets
Routes to: **designer** role  
Branch pattern: `design/brand-*`

**Examples:**
```bash
/brand Generate STRYV logo mock (oversized football nostalgia style, 2-color max)
/brand Create EMAN brand palette and typography guide
/brand Design EcoTenna hero banner for sustainability page
```

**Auto-constraints:**
- 2-color max
- SVG format preferred
- Save to `/public/assets/{brand}/`
- Include PNG fallback

---

### `/rfid <task>` - IoT/Textile Hardware
Routes to: **coder** role  
Branch pattern: `iot/rfid-*` ⚡ Special naming

**Examples:**
```bash
/rfid Implement StitchOS RFID reader integration
/rfid Add TextileTrack serial communication protocol
/rfid Create RFID tag scanning workflow for production
```

**Auto-constraints:**
- TextileTrack compatibility
- StitchOS integration
- Serial communication protocols
- Error handling for hardware

---

### `/lang <task>` - Weft Language Tasks
Routes to: **coder** role  
Branch pattern: `lang/weft-*` ⚡ Special naming

**Examples:**
```bash
/lang Add textile pattern parsing to Weft compiler
/lang Implement loom instruction generation
/lang Create Weft language syntax highlighting
```

**Auto-constraints:**
- Weft repo context
- Language processing
- Textile domain specific
- Compiler compatibility

---

### `/release <version>` - Release Management
Routes to: **deploy** + **git** roles  
Branch pattern: `deploy/release-*`

**Examples:**
```bash
/release v0.3.0 with RFID integration and auth improvements
/release v1.0.0 production ready with all textile features
```

**Auto-constraints:**
- Version tagging
- Changelog generation
- Production deployment
- Rollback plan

---

## 🎯 Usage in Cursor

### Option 1: Direct MCP Tool Call
```json
{
  "tool": "slash",
  "arguments": {
    "command": "/db Add production_lines table with id, name, smv, operator_count"
  }
}
```

### Option 2: Via Orchestra Agent
Just type the slash command in chat:
```
/db Add user_roles table for RBAC
```

The Orchestra agent will:
1. Parse the slash command
2. Route to appropriate MCP (coder/designer/seo/deploy/git)
3. Create job JSON with constraints
4. Generate feature branch
5. Open PR with context

---

## 🛡️ Guardrails Applied

### Database Jobs
- ✅ Always generate `.sql` migration
- ✅ Update `supabase/schema.graphql`
- ✅ No schema drift
- ✅ UUID primary keys

### IoT/RFID Jobs
- ✅ Force `iot/*` branch naming
- ✅ TextileTrack compatibility checks
- ✅ Serial protocol validation

### Brand Jobs  
- ✅ Assets saved to `/public/assets/{brand}/`
- ✅ SVG + PNG formats
- ✅ 2-color maximum constraint

### Weft Language Jobs
- ✅ Force `lang/*` branch naming
- ✅ Weft repo context
- ✅ Compiler compatibility

---

## 🔄 Generated Job Structure

Each slash command creates a job JSON like:

```json
{
  "id": "job-1234567890",
  "role": "coder",
  "title": "Supabase migration: Add production_lines table",
  "inputs": {
    "files": ["supabase/migrations/*", "supabase/schema.graphql"],
    "constraints": [
      "no breaking changes",
      "id as uuid primary key", 
      "timestamps default",
      "update schema.graphql",
      "generate .sql migration"
    ],
    "copy": "Database task: Add production_lines table with id, name, smv, operator_count",
    "assets": []
  },
  "done_when": [
    "tests pass",
    "lighthouse ok", 
    "review checklist ticked"
  ],
  "branch": "feature/supabase-migration-add-production-lines-table",
  "slash_origin": {
    "command": "db",
    "action": "Add production_lines table with id, name, smv, operator_count"
  }
}
```

This job then gets picked up by your MCP ecosystem (vibe-coder, Figma MCP, etc.) for execution!

