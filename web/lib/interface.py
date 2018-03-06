'''
接口类：实现接口参数化操作
支持：
    1、环境参数修改（Interface类变量）；
    2、post/get下发参数修改（Interface实例变量self.params）
    3、接口响应后，响应参数校验（Interface实例变量
        self.result <三方库requests中的Response对象>）
    4、响应参数保存/删除，保存到Interface.g这个类变量中
        （方便多个接口请求时，中间数据传递）
    5、下发参数self.params动态替换（Interface.g变量,
        以及时间参数
        （'*now', '*today0', '*today24', '*now+x', '*now-x'））
'''

__all__ = ['Interface', 'set_cookie', 'interf']


import json
import requests
import time
import sqlite3
import base64
import random
import os
from mylog import *


logger = log_config(f_level=logging.DEBUG, c_level=logging.WARNING, log_file='log/log.txt')


class Interface:
    '''
    接口类，通过http请求方法，url，请求参数来实例化。
    支持时间参数动态生成 _dynamic_params
    方法request可进行接口调用（必须参数HOST，可选参数Cookie）
    
    '''
    
    # 类变量
    host = '192.168.2.54:8088'
    db_path = 'web.db'
    cookie = None
    protocol = 'http://'# https://
    g = {}
    
    # 实例化方法
    def __init__(self, method, url, params, headers=None):
        # 基本属性
        self.method = method
        self.url = url
        self.params = params
        self.headers = headers if headers else {}
        
        # 下发参数的key
        self.params_key = (key for key in self.params)
        
        # 下发参数动态处理
        Interface.dynamic_params(self.params)
        
        # 接口下发后，响应结果对象
        self.result = None
        
        logger.info('create Interface instance %s' % self.url)

    # 参数修改
    def modify_params(self,k_v):
        Interface.dynamic_params(k_v)
        k_v = self.g_replace(k_v)
        for k in self.params:
            self.params[k] = ''
        for k in k_v:
            if isinstance(k_v[k], str):
                if '*base64.' in k_v[k]:
                    k_v[k] = img_b64(os.getcwd() + '/image/'+ k_v[k].replace('*base64.', ''))
            self.params[k] = k_v[k]
    
    # 下发接口
    def request(self):
        try:
            if Interface.cookie:
                self.headers['Cookie'] = Interface.cookie  
            if self.method == 'GET':
                r = requests.get(Interface.protocol+Interface.host+self.url, 
                            params=self.params, headers=self.headers)
            elif self.method == 'POST':
                r = requests.post(Interface.protocol+Interface.host+self.url, 
                            json=self.params, headers=self.headers)
            self.result = r
            assert(self.result.status_code == 200)
            logger.info('Interface %s requested success!' % self.url)
            logger.debug('Interface %s request and response info:' % self.url+'\n'+
                    '请求:'+'\n'+'*'*60+'\n'+self.method+'  '+self.url+'\n'+
                    str(self.result.request.headers)+'\n'+str(self.params)+'\n'+
                    '响应:'+'\n'+'*'*60+'\n'+str(self.result.status_code)+'\n'+
                    str(self.result.headers)+'\n'+str(self.result.json()))
            return True
        except Exception as e:
            self.result = None
            logger.error('Interface %s requested failed!' % self.url + '\n' + str(e))
            logger.debug('Interface %s request and response info:' % self.url+'\n'+
                    '请求:'+'\n'+'*'*60+'\n'+self.method+'  '+self.url+'\n'+
                    str(self.headers)+'\n'+str(self.params))
            return False
        
    # 响应结果校验
    def assert_response(self, k_v):
        if self.result == None:
            logger.error(self.url+ '  request failed,assert operation is invailed!')
            return False
        k_v = self.g_replace(k_v)
        for k in k_v:
            try:
                if k == 'status_code':
                    obj = self.result.status_code
                    o_obj = int(k_v[k])
                elif 'headers.' in k:
                    obj = self.result.headers[k.split('.')[1]]
                    o_obj = k_v[k]
                else:
                    obj = self.get_json(k)
                    o_obj = k_v[k]
                assert(str(obj) == str(o_obj))
                logger.info(self.url + '  Assert success!  '
                            +k+':'+str(o_obj)+'|'+str(o_obj))
            except:
                logger.error(self.url + '  Assert failed!  '
                             +k+':'+str(o_obj)+'|'+str(obj))
                return False
        return True
    
    # 响应结果json数据获取
    def get_json(self, key):
        tmp = self.result.json()
        try:
            for elem in key.split('.'):
                if elem == '*r':
                    tmp = random.sample(tmp,1)[0]
                else:
                    if elem.isdigit():
                        elem = int(elem)
                    tmp = tmp[elem]
            return tmp
        except:
            return None
        
    
    # 保存过程值
    def g_push(self, key_list):
        for k in key_list:
            Interface.g[k] = self.get_json(k)
        logger.info(self.url + '  g push values: ' + 
                str([str(k)+':'+str(Interface.g[k]) for k in key_list]))
            
    # 删除过程值
    def g_pop(self, key_list):
        logger.info(self.url + '  g pop values: ' + 
                str([str(k)+':'+str(Interface.g[k]) for k in key_list]))
        for k in key_list:
            del Interface.g[k]
        
    # 全局参数替换
    def g_replace(self, k_v):
        for k in k_v:
            if not (isinstance(k, str) and isinstance(k_v[k], str)):
                continue
            if '*g.' in k_v[k]:
                if '..' in k_v[k]:
                    for elem in k_v[k].split('..')[1:]:
                        tmp = Interface.g[k_v[k].split('..')[0].replace('*g.', '')][elem]
                    k_v[k] = tmp 
                else:
                    k_v[k] = Interface.g[k_v[k].replace('*g.', '')]
        return k_v

    # 特殊参数动态生成（主要是时间类）
    @staticmethod
    def dynamic_params(params):
        for key in params:
            if not isinstance(params[key], str):
                continue

            if params[key] == '*now':
                params[key] = int(time.time()*1000)
            elif params[key] == '*today0':
                current_time = time.time()
                params[key] = int((current_time-current_time%86400-8*3600
                                         )*1000)
            elif params[key] == '*today24':
                current_time = time.time()
                params[key] = int((current_time-current_time%86400-8*3600
                                         +24*3600)*1000-1)
            elif '*now+' in params[key]:
                interval = int(float(params[key].split('+')[1])*3600*1000)
                params[key] = int(time.time()*1000) + interval 
            elif '*now-' in params[key]:
                interval = int(float(params[key].split('-')[1])*3600*1000)
                params[key] = int(time.time()*1000) - interval
            elif '*base64.' in params[key]:
                    params[key] = img_b64(os.getcwd() + '/image/'+ params[key].replace('*base64.', ''))


# 登陆获取cookie，并保存到Interfa的类变量中
def set_cookie(interface_name, project):
    i = interf(interface_name, project)
    i.request()
    Interface.cookie = i.result.headers['Set-Cookie'].split(';')[0]
    

# 从数据库api表中读取接口参数，并实例化对象
def interf(interface_name, project):
    db = sqlite3.connect(Interface.db_path)
    result = db.execute('select method,url,data'
                  ' from api where project_name="%s" and name="%s"'
                  % (project, interface_name))
    tmp = list(result.fetchall()[0])
    tmp[2] = json.loads(tmp[2])
    for key in tmp[2]:
        tmp[2][key] = tmp[2][key]['value']
    return Interface(*tmp)


# 图片base64编码
def img_b64(img_path):
    with open(img_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8') 
    