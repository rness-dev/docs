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

Your workspace runs the version pinned in `.rness/package.json`. To print
it, run this from the workspace's `.rness/` (no global install needed):

::: code-group

```sh [npm]
npx rness --version
```

```sh [pnpm]
pnpm rness --version
```

```sh [yarn]
yarn rness --version
```

```sh [bun]
bunx rness --version
```

:::

From anywhere else in the workspace, `npx @rness/cli --version` prints the
same: whichever `rness` you launch hands over to the version the workspace
pinned. A bare `npx rness` works only in `.rness/`, where that version is
installed. Elsewhere, npx would look for a package named `rness` on npm,
which is not Rness's.

For an older release, read its entry in the
[changelog](https://github.com/rness-dev/rness/blob/main/packages/cli/README.md)
and the pages of the version that followed it.
