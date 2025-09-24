# Jobs folder
Place router-generated job JSON files here. Each job creates a branch, commits a diff, opens a PR, runs CI, posts preview.

🧠 Example: ask the agent to plan + split

You say:

/plan Build KTL homepage with sticky header, hero video, investor section, SEO + OG, deploy preview


Agent should respond with:

cursor new .orchestra/jobs/…json (one per subtask)

branches like feature/home-sticky-header, feature/hero-video, feature/ir-section, chore/seo-pass

diffs, PRs, and a note summarizing previews.

