# 烟花项目部署文档

## 一、Vercel 部署

### 1. 项目准备
```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "初始化烟花项目"

# 创建 GitHub 仓库并推送
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

### 2. Vercel 部署步骤
1. 访问 [Vercel官网](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 导入刚才创建的 GitHub 仓库
5. 保持默认配置，点击 "Deploy"

此时可以用https://fireworks-mocha-three.vercel.app/ 访问 但是需要科学上网 国内无法正常访问  所以下面需要用Dns解析转发

## 二、自定义域名配置


### 1.在vercel中设置获取IP和CNAME地址
1. 打开vercel对应的项目，点击settings-Domains
2. 点击右侧的add，在弹出的框中Domain这栏填入我们的域名(feez.space),点击继续，然后选择第一个下一步
3. 然后可以获取到IP和CNAME地址
#IP地址
76.76.21.21
#CNAME地址
cname.vercel-dns.com

### 2. Cloudflare 配置
1. 注册并登录 [Cloudflare](https://dash.cloudflare.com)
2. 添加站点：
   - 点击 "添加站点"
   - 输入您的域名 feez.space
   - 选择 Free 计划
   - 等待 DNS 扫描完成

3. 添加两条 DNS 记录配置：
   ```
   类型: A
   名称: feez.space
   内容: 76.76.21.21
   代理状态: 已代理（橙色云朵）

   类型: CNAME
   名称: www
   内容: cname.vercel-dns.com
   代理状态: 已代理（橙色云朵）
   ```

4. SSL/TLS 配置
-- 进入 Cloudflare SSL/TLS 设置
-- 加密模式选择 "完全" 
-- 确保 SSL/TLS 证书状态为"活跃"

5. 获取cloudflare名称服务器
   ```
   Cloudflare 名称服务器
   Cloudflare 上的每个 DNS 区域都会被分配一组 Cloudflare 品牌名称服务器。
   类型	值
   NS	lennon.ns.cloudflare.com
   NS	romina.ns.cloudflare.com
   ```

### 3.域名提供商DNS配置
1. 登录spaceship (https://www.spaceship.com/)
2. 主页进入launchpad，搜索进入高级DNS，选择对应的域名
3. 在名称服务器进行更改，选择自定义名称服务器，填入cloudflare的服务器，点击保存即可

### 4.查看域名是否正常使用
1. 进入vercel对应的项目，点击settings-Domains
2. 在对应的域名查看有绿色的对勾即配置成功

## 三、项目配置文件

### 1. vercel.json
```json
{
    "version": 2,
    "builds": [
        {
            "src": "**/*",
            "use": "@vercel/static"
        }
    ],
    "routes": [
        {
            "handle": "filesystem"
        },
        {
            "src": "/(.*)",
            "dest": "/index.html"
        }
    ],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "Cache-Control",
                    "value": "public, max-age=14400, s-maxage=14400"
                }
            ]
        }
    ]
}
```

### 2. package.json
```json
{
  "name": "fireworks-display",
  "version": "1.0.0",
  "description": "绚丽的网页烟花效果",
  "scripts": {
    "start": "serve"
  },
  "dependencies": {
    "serve": "^14.2.1"
  }
}
```

## 四、验证与测试

### 1. DNS 生效验证
```bash
# 查看 DNS 是否已经生效
dig 你的域名

# 检查 CNAME 记录
dig CNAME 你的域名
```

### 2. 网站访问测试
1. 使用 HTTPS 访问您的自定义域名
2. 检查 SSL 证书是否正确
3. 测试网站功能是否正常
4. 验证缓存是否生效

### 3. 性能检查
1. 使用 Chrome DevTools 检查：
   - 页面加载时间
   - 资源加载情况
   - 缓存状态

2. 使用在线工具测试：
   - [PageSpeed Insights](https://pagespeed.web.dev/)
   - [Cloudflare Speed Test](https://speed.cloudflare.com/)

## 五、故障排查

### 1. DNS 问题
- 确认 DNS 服务器已经更改为 Cloudflare
- 检查 DNS 记录是否正确配置
- 等待 DNS 传播（通常需要几分钟到几小时）

### 2. SSL 证书问题
- 确认 SSL/TLS 加密模式设置正确
- 检查证书状态是否活跃
- 验证域名 DNS 设置是否正确

### 3. 缓存问题
- 清除浏览器缓存后测试
- 检查 Cloudflare 缓存设置
- 验证缓存控制头部是否生效

## 六、维护建议

1. 定期检查：
   - SSL 证书状态
   - DNS 记录配置
   - 网站性能指标

2. 监控：
   - 使用 Cloudflare Analytics 监控流量
   - 关注错误率和响应时间
   - 检查安全威胁

3. 更新：
   - 及时更新项目依赖
   - 保持 Cloudflare 设置为最优配置
   - 定期备份配置 