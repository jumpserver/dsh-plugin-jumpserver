# JumpServer for DeepSeek Harness

让 DSH 中的 Agent 通过 JumpServer 使用你有权限的资产，执行命令、传输文件，并在需要时由你接管终端。

## 开始使用

如果站点提供接入文档，在 JumpServer 的 **个人设置 → Agent / MCP → 接入文档** 中点击 **复制给 Agent**，把说明发给 DSH，按提示完成安装和授权。

手动接入时，在 DSH 插件管理中选择本地 `.tgz` 包，或填写正式 Release 中该文件的下载地址，然后重启对应的 DSH profile。[查看 Releases](https://github.com/jumpserver/dsh-plugin-jumpserver/releases)

打开左侧 **JumpServer**，填写站点地址（例如 `https://jumpserver.example.com`）并保存，点击 **浏览器授权** 完成登录和授权。看到“已连接”后，回到 DSH 对话，说明目标资产和任务。

## 常用功能

| 功能 | 使用方式 |
| --- | --- |
| 查找资产 | 提供资产名称、地址或环境，让 Agent 查询可访问的资产及可用账号。例如：“查找我能访问的测试环境 Linux 资产。” |
| 执行命令 | 说明目标资产和要完成的任务，必要时指定工作目录。例如：“检查这台服务器的磁盘使用情况，并给出执行结果。” |
| 上传文件 | 添加对话附件，或指定当前会话工作区内的文件，再说明目标资产和远程目录。 |
| 下载文件 | 说明目标资产和远程文件路径。下载完成后，文件会保存为对话附件，可继续查看或下载。 |
| 接管终端 | 需要交互操作时，让 Agent 提供可用的终端接管链接，打开 JumpServer 终端继续操作。 |

## 使用提示

- Agent 会继续查询命令和文件操作的最终结果；“已提交”不代表执行成功。结果不明确时，先核查资产状态，避免重复执行。
- 文件传输需要相应的 SFTP 权限，远程路径以 SFTP 中可见的目录为准。
- 需要审批、身份验证或补充凭据时，按 Agent 返回的 JumpServer 链接完成操作，再回到对话继续原任务。
- 所有资产、账号及操作权限均以 JumpServer 授权为准。

## 常见问题

**JumpServer 使用自签名证书，怎样授权？** 在 **JumpServer → 连接设置** 填写 HTTPS 地址，勾选 **忽略此站点的 HTTPS 证书校验（自签名证书）**，保存后点击 **浏览器授权**。命令行配置时可给 `jumpserver-mcp setup` 加上 `--skip-tls-verify`。开关默认关闭。开启后，该站点的插件请求仍通过 HTTPS 加密，但插件会跳过服务器身份校验。浏览器登录页需要单独信任站点证书。取消勾选并保存会恢复校验，之后需要重新授权。

**DSH 在远程机器上，怎样授权？** 通过本地端口转发，在自己的浏览器用 `http://127.0.0.1:端口` 访问 DSH，让授权回调经同一转发返回。浏览器未自动打开时，点击 **打开授权页面**。

**怎样用命令行配置？** 在运行 DSH 的机器上执行以下命令，将域名换成自己的 JumpServer 站点。插件配置了自定义 `statePath` 时，用 `--state-path` 指向同一文件。完成后，在 JumpServer 页点击 **重新连接**。

```bash
jumpserver-mcp setup --url 'https://jumpserver.example.com/koko/mcp'
```

**旧仓库安装的 v0.1.4 如何升级？** 该版本在旧仓库检查更新。请在 DSH 插件管理中手动安装一次组织仓库的 `dsh-plugin-jumpserver-0.1.5.tgz`，然后按提示重新加载或重启 DSH。此后插件会在组织仓库检查新版本。[下载 v0.1.5](https://github.com/jumpserver/dsh-plugin-jumpserver/releases/tag/v0.1.5)

**怎样更新或恢复插件？** 在 JumpServer 页点击 **更新至** 按钮，按提示重新加载页面或重启 DSH。热重载更新失败时，插件会尝试恢复旧版。如果恢复也失败，可从 DSH 日志或状态文件旁的 `jumpserver-updates/last-update-error.json` 找到 `file:` 恢复源，在插件管理中重新安装。

[GitHub](https://github.com/jumpserver/dsh-plugin-jumpserver) · [反馈问题](https://github.com/jumpserver/jumpserver/issues)
