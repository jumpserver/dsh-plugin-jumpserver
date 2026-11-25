# 开发、构建与发布

## 本地构建

插件要求 Node.js `>=24.9`。搭配 DSH `0.2.3-alpha.2` 开发时，Node.js 版本须满足宿主要求 `^24.22.3 || >=26.13.1`。

在仓库根目录安装依赖、运行测试并生成安装包。

```bash
npm ci
npm test
npm run pack
```

打包会构建客户端，在 `dist/` 下生成 `dsh-plugin-jumpserver-<版本>.tgz`。桌面版可在插件管理中选择这个文件。Web 版使用 `dsh plugin` 安装本地包。下面的命令以 `0.1.4` 为例，在仓库根目录运行。

```bash
dsh plugin --profile web add "$PWD/dist/dsh-plugin-jumpserver-0.1.4.tgz"
```

修改页面源码 `src/client.js` 后，用 `npm run build` 重新生成 DSH 加载的 `lib/client.js`。单元测试使用本机隔离的 OAuth/MCP 服务。安装包会记录构建时的 Git 提交号，存在未提交修改时标记为开发版。包内 README 来自[使用说明](usage.md)。

插件通过 JumpServer / KoKo 的 MCP 接口连接资产，传输使用官方 TypeScript SDK。插件结构和 OAuth 集成参考了 [dsh-mcp-manager](https://github.com/hyqhyq3/dsh-mcp-manager)，相关许可声明见 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES)。

## 发布

提交 PR 或推送到 `master` 时，GitHub Actions 会运行测试并构建安装包。可以从该次运行的 Artifacts 取得 `.tgz` 和 `SHA256SUMS`。[查看构建工作流](../.github/workflows/release.yml)

发布新版本时，同步更新 `package.json` 和 `package-lock.json` 的版本，在对应提交上推送同名版本标签（如 `v0.1.5`）。也可以在 **Actions → Build and Release → Run workflow** 手动发布。`tag` 留空会使用所选分支的包版本，填写已有标签会从该标签重新构建。重跑会更新原标签下的同名附件。要发布包含新提交的版本，请提升版本号。带预发布版本号的标签会生成 Pre-release。正式安装包通过 [GitHub Releases](https://github.com/jumpserver/dsh-plugin-jumpserver/releases) 分发。
