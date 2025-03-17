# kimi-mcp

Kimi提供基于Model Context Protocol (MCP)的网络搜索功能。

## 简介

kimi-mcp是一个基于Model Context Protocol (MCP)的工具，它使用Kimi AI的网络搜索能力，通过标准输入/输出与MCP客户端通信。

## 安装

### 通过npm安装（推荐）

```bash
# 全局安装
npm install -g kimi-mcp

# 或者直接通过npx使用（无需安装）
npx kimi-mcp
```

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/qwang07/kimi-mcp.git
cd kimi-mcp

# 安装依赖
npm install

# 设置可执行权限
chmod +x index.js
```

## 配置

### 环境变量配置

kimi-mcp通过环境变量进行配置。您可以通过以下方式设置环境变量：

1. 直接在命令行中设置：

```bash
export KIMI_API_KEY="your-api-key"
export KIMI_BASE_URL="https://aiproxy.hzh.sealos.run/v1"
export KIMI_MODEL="moonshot-v1-32k"
export KIMI_SYSTEM_PROMPT="自定义系统提示词"
```

2. 创建.env文件（推荐）：

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑.env文件
nano .env
```

3. 通过npx使用时设置环境变量：

```bash
# 方法1：在命令行中直接设置（单次使用）
KIMI_API_KEY="your-api-key" npx kimi-mcp

# 方法2：使用.env文件（推荐）
# 在当前目录创建.env文件
echo "KIMI_API_KEY=your-api-key" > .env
echo "KIMI_BASE_URL=https://aiproxy.hzh.sealos.run/v1" >> .env
# 然后运行
npx kimi-mcp
```

### 必需的环境变量

- `KIMI_API_KEY`: Kimi API密钥（必需）

### 可选的环境变量

- `KIMI_BASE_URL`: Kimi API的基础URL（默认：https://aiproxy.hzh.sealos.run/v1）
- `KIMI_MODEL`: 使用的Kimi模型（默认：moonshot-v1-32k）
- `KIMI_SYSTEM_PROMPT`: 默认系统提示词（可被请求参数覆盖）

## 使用方法

### 直接运行

```bash
./index.js
```

### 通过npx运行

```bash
npx kimi-mcp
```

### 测试

kimi-mcp提供了几个测试脚本来验证功能：

```bash
# 测试环境变量配置
npm run test:env

# 测试Kimi搜索功能
npm run test:search

# 测试MCP协议功能
npm run test
```

### 与MCP客户端集成

kimi-mcp实现了MCP协议，可以与任何支持MCP的客户端集成。例如，与Claude一起使用：

```
<mcp:tool name="search">
{
  "query": "最新的AI技术趋势",
  "role": "你是一位AI技术专家，请提供专业的搜索结果和分析",
  "responseFormat": "请以markdown格式返回，包含标题、链接和简短描述"
}
</mcp:tool>
```

### 与Claude集成

kimi-mcp可以与Claude等支持MCP的AI助手集成：

1. 在Claude中启用MCP功能

2. 添加kimi-mcp作为工具，确保设置了必要的环境变量：
   ```bash
   # 方法1：在命令中直接设置环境变量
   KIMI_API_KEY="your-api-key" npx kimi-mcp
   
   # 方法2：如果已在系统中设置了环境变量，直接运行
   npx kimi-mcp
   ```

3. 使用search工具进行网络搜索：
   ```
   <mcp:tool name="search">
   {
     "query": "最新的AI技术趋势",
     "role": "你是一位AI技术专家，请提供专业的搜索结果和分析",
     "responseFormat": "请以markdown格式返回，包含标题、链接和简短描述"
   }
   </mcp:tool>
   ```

4. 注意事项：
   - 确保Claude有权限访问您的环境变量
   - 如果使用Claude网页版，可能需要在系统级别设置环境变量
   - 如果使用Claude桌面版，可以在启动Claude之前设置环境变量

## 支持的工具

### search

使用Kimi AI搜索网络。Kimi会根据查询内容自动执行网络搜索，并返回相关结果。

参数：
- `query`: 搜索查询内容（必需）
- `role`: Kimi的角色定义（可选，默认为系统提示词）
- `responseFormat`: 期望的返回格式（可选，默认为JSON格式）

示例：

1. 基本搜索：
```json
{
  "query": "2024年人工智能发展趋势"
}
```

2. 自定义角色和格式：
```json
{
  "query": "量子计算最新进展",
  "role": "你是一位量子物理学专家，请提供专业的学术分析",
  "responseFormat": "请以学术报告的形式返回结果，包含以下部分：\n1. 研究背景\n2. 最新突破\n3. 未来展望\n4. 参考资料"
}
```

注意：Kimi会根据自己的规则执行搜索，搜索结果的数量和质量由Kimi自动决定。

## 许可证

MIT
