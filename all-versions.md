<script setup>
import { useData, withBase } from 'vitepress'
const { theme } = useData()
</script>

# All versions

Each release of `@rness/cli` has its own copy of these docs. The menu at the
top of every page switches between them. The site keeps the latest release,
the three releases before it, and the unreleased changes.

<ul>
  <li v-for="v in theme.versions" :key="v.id">
    <a :href="withBase(`/${v.prefix}guide/getting-started`)">{{ v.label }}</a>
  </li>
</ul>

Your workspace runs the version pinned in `.rness/package.json`. Inside the
workspace, `rness --version` prints it.

For an older release, read its entry in the
[changelog](https://github.com/rness-dev/rness/blob/main/packages/cli/README.md#0150--agent-pulse-follows-a-status-change-the-sessions-are-kept)
and the pages of the version that followed it.
