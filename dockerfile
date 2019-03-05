# 拉取node镜像
FROM node:10-alpine

# 设置镜像作者
LABEL MAINTAINER="qiyang.hqy@dtwave-inc.com"

# RUN可以执行任何命令，然后在当前镜像上创建一个新层并提交
# 执行多条命令时，可以通过 \ 换行
# 设置国内阿里云镜像站、安装chromium 68、文泉驿免费中文字体等依赖库
# 默认不支持中文显示，必须使用文泉驿的免费中文字体
# RUN指令创建的中间镜像会被缓存，并会在下次构建中使用。如果不想使用这些缓存镜像，可以在构建时指定--no-cache参数
RUN echo "https://mirrors.aliyun.com/alpine/v3.8/main/" > /etc/apk/repositories \
    && echo "https://mirrors.aliyun.com/alpine/v3.8/community/" >> /etc/apk/repositories \
    && echo "https://mirrors.aliyun.com/alpine/edge/testing/" >> /etc/apk/repositories \
    && apk -U --no-cache update && apk -U --no-cache --allow-untrusted add \
      zlib-dev \
      xorg-server \
      dbus \
      ttf-freefont \
      chromium \
      wqy-zenhei@edge \
      bash \
      bash-doc \
      bash-completion -f

# 设置时区
# 容器内默认市区不是东八区，会影响日志打印，需要重新设置时区
RUN rm -rf /etc/localtime && ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 设置环境变量
ENV NODE_ENV production

# 创建项目代码的目录
RUN mkdir -p /workspace

# 指定RUN、CMD与ENTRYPOINT命令的工作目录
WORKDIR /workspace

# 复制宿主机当前路径下所有文件到docker的工作目录
COPY . /workspace

# 清除npm缓存文件
RUN npm cache clean --force && npm cache verify
# 如果设置为true，则当运行package scripts时禁止UID/GID互相切换
# RUN npm config set unsafe-perm true

# 安装pm2
RUN npm i pm2 -g

# 安装依赖
RUN npm install

# 暴露端口
EXPOSE 3000

# 运行命令
ENTRYPOINT pm2-runtime start docker_pm2.json
