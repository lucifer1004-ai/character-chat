# Character Chat

一个类似 character.ai 的网站，支持用户创建带有 RAG 知识库的 AI 角色，进行一对一对话或创建多角色群聊进行学术研讨。

## 功能特性

- **自定义角色创建**：创建具有独特个性和系统提示词的 AI 角色
- **RAG 知识库**：为每个角色添加自定义知识，实现上下文感知的智能回复
- **一对一对话**：与 AI 角色进行私密对话
- **多角色群聊**：创建多个角色参与的学术研讨和协作讨论
- **用户认证**：基于 Manus OAuth 的安全登录系统
- **深色主题**：现代化的深色 UI 设计

## 技术栈

### 前端
- **React 19** + **TypeScript**
- **Tailwind CSS 4** - 样式框架
- **shadcn/ui** - UI 组件库
- **tRPC** - 类型安全的 API 调用
- **Wouter** - 轻量级路由

### 后端
- **Express 4** + **tRPC 11**
- **Drizzle ORM** - 数据库 ORM
- **MySQL/TiDB** - 数据库
- **Manus OAuth** - 用户认证

### AI 集成
- **LLM API** - 对话生成
- **RAG** - 知识检索增强生成

## 部署指南

### 前置要求

1. **Vercel 账号**：用于部署前端
2. **MySQL 数据库**：用于数据存储（推荐使用 PlanetScale、Railway 或其他 MySQL 提供商）
3. **环境变量**：需要配置以下环境变量

### 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

```bash
# 数据库连接（MySQL）
DATABASE_URL=mysql://user:password@host:port/database

# Manus OAuth（如果使用 Manus 平台）
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=your-name

# LLM API（如果使用 Manus 内置 API）
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# 应用配置
VITE_APP_TITLE=Character Chat
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

### Vercel 部署步骤

1. **连接 GitHub 仓库**
   - 登录 Vercel
   - 点击 "New Project"
   - 导入 `lucifer1004-ai/character-chat` 仓库

2. **配置构建设置**
   - Framework Preset: 选择 "Other"
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `client/dist`
   - Install Command: `pnpm install`

3. **配置环境变量**
   - 在 Vercel 项目设置中添加上述所有环境变量
   - 确保 `DATABASE_URL` 指向可访问的数据库

4. **部署**
   - 点击 "Deploy" 开始部署
   - 等待构建完成

### 数据库设置

项目使用 MySQL 数据库。推荐使用以下服务：
- **PlanetScale**：免费的 MySQL 数据库服务
- **Railway**：支持 MySQL 的云平台
- **Manus 平台**：内置 MySQL 数据库

**数据库 Schema：**
运行以下命令创建数据库表：
```bash
pnpm db:push
```

数据库表包括：
- `users` - 用户信息
- `characters` - AI 角色
- `characterKnowledge` - 角色知识库
- `conversations` - 一对一对话
- `messages` - 对话消息
- `groupChats` - 群聊
- `groupChatParticipants` - 群聊参与者
- `groupChatMessages` - 群聊消息

### 本地开发

1. **克隆仓库**
   ```bash
   git clone https://github.com/lucifer1004-ai/character-chat.git
   cd character-chat
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入必要的环境变量
   ```

4. **运行数据库迁移**
   ```bash
   pnpm db:push
   ```

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```

6. **访问应用**
   - 打开浏览器访问 `http://localhost:3000`

## 项目结构

```
character-chat/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # UI 组件
│   │   ├── lib/           # 工具库
│   │   └── App.tsx        # 应用入口
│   └── index.html
├── server/                # 后端代码
│   ├── routers.ts        # tRPC 路由
│   ├── db.ts             # 数据库查询
│   └── _core/            # 核心功能
├── drizzle/              # 数据库 schema
│   └── schema.ts
├── shared/               # 共享代码
└── package.json
```

## 数据库 Schema

### 主要表结构

- **users** - 用户信息
- **characters** - AI 角色定义
- **characterKnowledge** - 角色知识库（RAG）
- **conversations** - 一对一对话
- **messages** - 对话消息
- **groupChats** - 群聊
- **groupChatParticipants** - 群聊参与者
- **groupChatMessages** - 群聊消息

## API 文档

项目使用 tRPC，所有 API 都是类型安全的。主要路由包括：

- `characters.*` - 角色管理
- `knowledge.*` - 知识库管理
- `conversations.*` - 对话管理
- `messages.*` - 消息管理
- `groupChats.*` - 群聊管理
- `groupMessages.*` - 群聊消息管理

## 使用说明

### 创建角色

1. 登录后点击 "My Characters"
2. 点击 "New Character"
3. 填写角色名称、描述和系统提示词
4. 可选择上传头像和设置为公开

### 添加知识库

1. 进入角色详情页
2. 切换到 "Knowledge Base" 标签
3. 点击 "Add Knowledge"
4. 输入标题和内容

### 开始对话

1. 在角色详情页点击 "Start Chat"
2. 输入消息并发送
3. AI 会基于角色设定和知识库回复

### 创建群聊

1. 点击 "Group Chats"
2. 点击 "New Group Chat"
3. 输入名称、描述和讨论主题
4. 选择至少 2 个角色参与
5. 在群聊中发送消息或点击 "Generate Response" 让角色发言

## 注意事项

- RAG 功能目前使用简单的关键词匹配，生产环境建议使用向量数据库（如 Pinecone、Weaviate）
- 确保数据库连接字符串正确配置
- LLM API 调用可能产生费用，请注意使用量

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请在 GitHub 仓库提交 Issue。

