# Brain Sync Protocol

This squad system syncs with the global brain at `~/.claude/brain/`.

## Brain Files

| File | What goes here | Update when |
|------|---------------|-------------|
| `~/.claude/brain/shared-learnings.md` | Squad-wide learnings | POST — via `[SQUAD_LEARNING]` |
| `~/.claude/agents/[name]/brain/domain.md` | Agent-specific domain knowledge | Via `/agent-learn` or major insight |
| `~/.claude/agents/[name]/brain/patterns.md` | Agent-specific patterns | POST — agent-specific insights |
| `~/.claude/agents/[name]/brain/[project]/knowledge.md` | Project decisions, gotchas | After any non-obvious decision |

## Local Brain Files

| File | What goes here | Update when |
|------|---------------|-------------|
| `.agent/brain/shared-learnings.md` | Project-wide learnings | POST — via `[SQUAD_LEARNING]` |
| `.agent/brain/patterns.md` | Agent-specific patterns | POST — agent-specific insights |
| `.agent/brain/knowledge.md` | Project decisions, gotchas | After any non-obvious decision |

## Sync Rules

1. **If reusable across agents → `shared-learnings.md`**
2. **If agent-specific → `brain/patterns.md`**
3. **Project decisions → `brain/knowledge.md`**

## Writing a Learning

At POST time, if you discover a pattern:

```markdown
### [SQUAD_LEARNING] — [Title] — YYYY-MM-DD

**Pattern:** [what you discovered]

**Context:** [when this applies]

**Action:** [what to do differently]

**Agent:** [your name]

**Runtime:** freebuff

**Model:** [model name]
```

## Continuous Learning

- **Discover a pattern?** → Write `[SQUAD_LEARNING]` at POST time
- **Project decision?** → `brain/knowledge.md` immediately
- **Hit a known bug class?** → Check `shared-learnings.md` first

## Agent Brain Structure

Each agent has:
```
~/.claude/agents/[name]/
├── who.md           # Identity and values
├── me/
│   ├── lens.md      # How they see the world
│   ├── log.md       # Task logs (PRE/MID/POST)
│   ├── moves.md     # Playbook
│   └── lessons.md   # Lessons learned
└── brain/
    ├── domain.md    # Expert-grounded knowledge
    ├── patterns.md  # Agent-specific patterns
    └── [project]/
        └── knowledge.md  # Project decisions
```
