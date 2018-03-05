# AutotestPlatform
### 概述：
        通过selenium提供的api，以web页面元素的xpath来唯一定位每个对象，然后操作对象（点击，输入，移动，获取信息等），来实现web测试自动化。为了应对前端界面的频繁变动，尽可能的减少用例的频繁修改，抽象出【页面-模板-数据】三层，动态组织用例。为了方便任务调度和用例编写增加了web界面，新增了接口测试界面。
        

### 使用指南：
<pre><code>
git clone https://github.com/qiangzhouf/AutotestPlatform.git

</pre></code>
<pre><code>
# python3.5, 安装下述三方库

pip install selenium
pip install flask
pip install flask_socketio
pip install requests
pip install uwsgi
pip install gevent

</code></pre>
<pre><code>
# 运行UI自动化测试服务

python3 server.py

</code></pre>
<pre><code>
# 启动web服务,启动器自定义uwsgi.ini配置

cd AutotestPlatform/web
uwsgi -i uwsgi.ini

（启动成功后，即可访问自动化测试平台(admin/intedio)，进行项目添加，用例编写，任务调度运行；新增了http接口录入和测试的功能）
</code></pre>

### 1、方案
![](https://github.com/qiangzhouf/AutotestPlatform/raw/master/doc/1.png)
### 2、模型
![](https://github.com/qiangzhouf/AutotestPlatform/raw/master/doc/2.png)
### 3、业务逻辑
![](https://github.com/qiangzhouf/AutotestPlatform/raw/master/doc/3.png)


### 新增的接口测试页面
![](https://github.com/qiangzhouf/AutotestPlatform/raw/master/doc/4.png)
