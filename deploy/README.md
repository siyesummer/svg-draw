# svg-draw Docker 镜像

该镜像把 Vue/Vite 构建产物复制到最终的 `nginx:1.27-alpine` 镜像中，运行阶段不包含 Node.js、npm、源码或 `node_modules`。容器通过 `/health` 提供健康检查，通过 `/release.json` 暴露版本和 commit。

正式镜像仓库为 `siyesummer/svg-draw`，版本从 `0.0.1` 开始，由 `workflow_dispatch` 手动发布。GitHub Pages 使用仓库现有的 `deploy.yml`，与 Docker 镜像发布完全分开。

## 本地验证

```powershell
docker build -f deploy/Dockerfile `
  --build-arg NODE_IMAGE=docker.m.daocloud.io/library/node:20-bookworm-slim `
  --build-arg NGINX_IMAGE=docker.m.daocloud.io/library/nginx:1.27-alpine `
  --build-arg APP_VERSION=local `
  --build-arg APP_REVISION=working-tree `
  -t siye-svg-draw:local .

docker run --rm -d --name siye-svg-draw-local -p 18087:80 siye-svg-draw:local
curl.exe --fail --silent http://127.0.0.1:18087/health
curl.exe --fail --silent http://127.0.0.1:18087/release.json
curl.exe --fail --silent http://127.0.0.1:18087/some/history/path | Select-Object -First 1
docker rm -f siye-svg-draw-local
```

正式 `draw.siyes.cn` 不单独发布宿主机端口，只由生产 edge-nginx 按 Host 转发到该容器。
