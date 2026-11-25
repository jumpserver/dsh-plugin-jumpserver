# 开发、构建与发布

## 本地构建

插件要求 Node.js `>=24.9`。搭配 DSH `0.2.3-alpha.2` 开发时，Node.js 版本须满足宿主要求 `^24.22.3 || >=26.13.1`。

在仓库根目录安装依赖、运行测试并生成安装包。

```bash
npm ci
npm test
npm run pack
```

打包会构建客户端，在 `dist/` 下生成 `dsh-plugin-jumpserver-<版本>.tgz`。桌面版可在插件管理中选择这个文件。Web 版使用 `dsh plugin` 安装本地包。在仓库根目录运行以下命令，使用当前源码的包版本。

```bash
version=$(node -p "require('./package.json').version")
dsh plugin --profile web add "$PWD/dist/dsh-plugin-jumpserver-${version}.tgz"
```

修改页面源码 `src/client.js` 后，用 `npm run build` 重新生成 DSH 加载的 `lib/client.js`。单元测试使用本机隔离的 OAuth/MCP 服务。安装包会记录构建时的 Git 提交号，存在未提交修改时标记为开发版。包内 README 来自[使用说明](usage.md)。

插件通过 JumpServer / KoKo 的 MCP 接口连接资产，传输使用官方 TypeScript SDK。插件结构和 OAuth 集成参考了 [dsh-mcp-manager](https://github.com/hyqhyq3/dsh-mcp-manager)，相关许可声明见 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES)。

## 发布正式版本

以下示例使用 `v0.1.5`。将 `version` 换成本次要发布的版本号。`upstream` 指向组织仓库 `jumpserver/dsh-plugin-jumpserver`。

### 1. 准备版本 PR

先查看组织仓库的标签和已有 Release，选择一个未使用且高于已发布版本的版本号。[发布记录](https://github.com/jumpserver/dsh-plugin-jumpserver/releases)

```bash
version=0.1.5
git fetch upstream master
git switch -c "pr@master@release-v${version}" upstream/master
npm version "$version" --no-git-tag-version
npm ci
npm test
npm run pack
```

检查 `package.json` 和 `package-lock.json` 中的版本，以及打包时重新生成的 `lib/client.js`。将这三个文件和本次发布说明一起提交并推送分支，向 `master` 提 PR。在 PR 中写明用户可见的改动和升级步骤。待 **Test and package**、**Test latest Harness protocol** 均通过后合入。[构建与发布工作流](../.github/workflows/release.yml)

### 2. 在已合入的提交上打标签

从已合并的版本 PR 复制合入 `master` 的完整提交号，填入 `release_commit`。核对提交属于上游主分支且包版本正确，再单独推送本次标签。

```bash
version=0.1.5
release_commit='在这里粘贴合入 master 的完整提交号'
git fetch upstream master
git merge-base --is-ancestor "$release_commit" upstream/master &&
  test "$(git show "${release_commit}:package.json" | jq -r .version)" = "$version" &&
  git tag -a "v${version}" "$release_commit" -m "Release v${version}" &&
  git push upstream "refs/tags/v${version}"
```

### 3. 验证公开的安装包

在 **Actions → Build and Release** 中打开此次标签触发的运行，确认 **Publish GitHub Release** 成功。正式 Release 应包含 `dsh-plugin-jumpserver-<版本>.tgz` 和 `SHA256SUMS`。在一个空目录下载这两个附件，验证校验和、包版本和构建提交。以下命令沿用上一步设置的 `version` 和 `release_commit`。

```bash
gh release download "v${version}" --repo jumpserver/dsh-plugin-jumpserver \
  --pattern "dsh-plugin-jumpserver-${version}.tgz" --pattern SHA256SUMS
sha256sum --check SHA256SUMS
archive="dsh-plugin-jumpserver-${version}.tgz"
tar -xOzf "$archive" package/package.json | jq -e --arg v "$version" '.version == $v'
tar -xOzf "$archive" package/lib/build-info.json | jq -e --arg sha "$release_commit" '.commit == $sha and .development == false'
```

同一标签的发布失败时，可重跑该次工作流，或在 **Run workflow** 的 `tag` 栏填入原标签重建。已有标签始终指向原提交。代码修复合入后须提升版本并创建新标签。带预发布标识的版本会生成 Pre-release，插件只从正式 Release 检查更新。
