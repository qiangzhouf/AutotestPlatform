import sys
import os
sys.path.append(os.getcwd()+'/lib')
import sqlite3
import socket
import time
import platform
import signal
import shutil
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, Response, jsonify
from contextlib import closing
import subprocess
from flask_socketio import SocketIO, emit
import json
import xml.etree.ElementTree as ET
from threading import Lock
import requests
from requests.auth import HTTPBasicAuth
from requests.auth import HTTPDigestAuth
from gevent import monkey; monkey.patch_all()
from interface import *


# 配置
DATABASE = 'web.db'
SECRET_KEY = 'zhouqiang'
USERNAME = 'admin'
PASSWORD = 'intedio'
# 推送线程和锁和队列
thread = None
thread_lock = Lock()
push_list = []
# 自动化任务
handle = {}


# 创建app
app = Flask(__name__)
app.config.from_object(__name__)
socketio = SocketIO(app)


def connect_db():
    return sqlite3.connect(app.config['DATABASE'])


def init_db():
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql') as f:
            db.cursor().executescript(f.read().decode('utf-8'))
        db.commit()


def xml_parse(father, page_tree, flag=1):
    if flag:
        for child in father:
            try:
                tag_attr = child.attrib['xpath']
            except:
                tag_attr = ''
            if child.text is None or '\n' in child.text:
                tag_text = ''
            else:
                tag_text = child.text
            page_tree[child.tag] = [tag_attr, tag_text, {}]
            xml_parse(child, page_tree[child.tag][2], flag=1)
    else:
        for child in father:
            tag_attr = child.attrib
            tag_text = child.text
            page_tree[child.tag] = [tag_attr, tag_text, {}]
        try:
            page_tree['step'][2]['elem'] = []
            for elem in father.find('step').iter('elem'):
                page_tree['step'][2]['elem'].append([elem.attrib, elem.text])
        except:
            pass


def write_xml(xml_file, data, flag=1):
    if flag:
        file_name = '../page/' + xml_file + '.xml'
        tree = ET.parse(file_name)
        root = tree.getroot()
        add_row = json.loads(data[0])
        for elem in add_row:
            elem['position'].reverse()
            location = '.'
            for i in elem['position'][:-1]:
                location = location + '/' + i.split('>')[0]
            fa = root.find(location)
            ET.SubElement(fa, elem['data']['tag'])
            child = fa.find(elem['data']['tag'])
            child.text = elem['data']['text']
            child.set('xpath', elem['data']['xpath'])
        del_row = json.loads(data[1])
        del_row.reverse()
        for elem in del_row:
            elem['position'].reverse()
            location = '.'
            for i in elem['position'][:-1]:
                location = location + '/' + i.split('>')[0]
            fa = root.find(location)
            child = root.find(location + '/' + elem['position'][-1])
            fa.remove(child)
        modify = json.loads(data[2])
        modify.reverse()
        for elem in modify:
            elem['position'].reverse()
            location = '.'
            for i in elem['position']:
                location = location + '/' + i.split('>')[0]
            fa = root.find(location)
            if 'text' in elem['data']:
                fa.text = elem['data']['text']
            if 'xpath' in elem['data']:
                fa.set('xpath', elem['data']['xpath'])
            if '>' in elem['position'][-1]:
                fa.tag = elem['position'][-1].split('>')[1]
    else:
        file_name = '../model/' + xml_file + '.xml'
        tree = ET.parse(file_name)
        root = tree.getroot()
        add_row = json.loads(data[0])
        for elem in add_row:
            if elem['position'] == '/':
                ET.SubElement(root, elem['data']['tag'])
                child = root.find(elem['data']['tag'])
                child.text = elem['data']['text']
            else:
                elem_index = int(elem['position'])
                fa = root.find('step')
                fa.insert(elem_index, ET.Element('elem'))
                fa[elem_index].text = elem['data']['text']
                for key in elem['data']['attr']:
                    fa[elem_index].attrib[key] = elem['data']['attr'][key]
        modify = json.loads(data[1])
        modify.reverse()
        for elem in modify:
            try:
                elem_index = int(elem['position'])
                obj = root.find('step')[elem_index]
                for key in elem['data']:
                    if key == 'attr':
                        for ke in elem['data']['attr']:
                            obj.attrib[ke] = elem['data']['attr'][ke]
                    elif key == 'text':
                        obj.text = elem['data']['text']
            except:
                obj = root.find(elem['position'].split('>')[0])
                for key in elem['data']:
                    if key == 'attr':
                        for ke in elem['data']['attr']:
                            obj.attrib[ke] = elem['data']['attr'][ke]
                    elif key == 'text':
                        obj.text = elem['data']['text']
                    else:
                        obj.tag = elem['data']['tag']
        del_row = json.loads(data[2])
        del_row.reverse()
        for elem in del_row:
            try:
                elem_index = int(elem['position'])
                root.find('step').remove(root.find('step')[elem_index])
            except:
                root.remove(root.find(elem['position']))
    tree.write(file_name)


@socketio.on('connect', namespace='/task_refresh')
def ws_connect():
    global push_list, thread
    push_list.append(1)
    print('Client connected', push_list, thread)
    with thread_lock:
        if thread == None:
            thread = socketio.start_background_task(target=push)


@socketio.on('disconnect', namespace='/task_refresh')
def ws_disconnect():
    global push_list
    push_list.pop()
    print('Client disconnected', push_list, thread)


def push():
    global push_list, thread
    while True:
        print('push...', push_list)
        s = connect_db()
        msg = s.execute('select * from tasks order by id desc').fetchall()
        s.close()
        socketio.emit('rec_push', {'code': 200, 'msg': json.dumps(msg)}, namespace='/task_refresh')
        socketio.sleep(3)
        if len(push_list) == 0:
            thread = None
            return



@app.before_request
def before_request():
    g.db = connect_db()


@app.teardown_request
def teardown_request(exception):
    try:
        g.db.close()
    except:
        pass


# 首页---展示所有任务
@app.route('/')
def show_tasks():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    tasks = g.db.execute('select * from tasks order by id desc').fetchall()
    case_sets = g.db.execute('select name from case_set order by id desc').fetchall()
    return render_template('show_tasks.html', task=tasks, case_set=case_sets)


# 登陆
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form['username'] != app.config['USERNAME']:
            flash('用户名不存在', 'danger')
        elif request.form['password'] != app.config['PASSWORD']:
            flash('密码不正确', 'danger')
        else:
            session['logged_in'] = True
            return redirect(url_for('show_tasks'))
    return render_template('login.html', menu='none')


# 注销
@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('注销成功', 'info')
    return redirect(url_for('login'))


# 新建自动化任务
@app.route('/add', methods=['POST'])
def add_tasks():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.form['select_set'] == 'none' or request.form['name'] == '':
        flash('任务名或用例集不能为空', 'danger')
        return redirect(url_for('show_tasks'))
    if (request.form['name'],) in g.db.execute('select name from tasks').fetchall():
        flash('任务名不能重复', 'danger')
        return redirect(url_for('show_tasks'))
    try:
        if (int(request.form['name']),) in g.db.execute('select name from tasks').fetchall():
            flash('任务名不能重复', 'danger')
            return redirect(url_for('show_tasks'))
    except:
        pass
    total_num = g.db.execute('select case_num from case_set where name=(?)',
                             [request.form['select_set']]).fetchall()[0][0]
    g.db.execute('insert into tasks (name,case_set,create_time,total_num) values (?,?,?,?)', [request.form['name'],
                 request.form['select_set'], time.strftime('%y%m%d %H:%M', time.localtime()), total_num])
    g.db.commit()
    flash('新任务创建成功', 'success')
    return redirect(url_for('show_tasks'))


# 用例集展示页面
@app.route('/case_set')
def case_set():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    try:
        g.db.execute('create table model_case (id integer\
                     primary key autoincrement,name string not null);')
        g.db.execute('create table tmp_case (id integer primary key \
                     autoincrement,name string not null,case_num string not null);')
        for elem in os.listdir('../model/'):
            if elem == 'login.xml' or elem == 'menu.xml':
                continue
            else:
                g.db.execute('insert into model_case (name) values (?)', [elem.replace('.xml', '')])
        g.db.commit()
    except:
        pass
    model_case = g.db.execute('select * from model_case order by id').fetchall()
    tmp_case = g.db.execute('select * from tmp_case order by id').fetchall()
    case_sets = g.db.execute('select * from case_set order by id').fetchall()
    return render_template('case_set.html', model_case=model_case, tmp_case=tmp_case,
                           case_set=case_sets)
    

@app.route('/add_case', methods=['POST', 'GET'])
def add_case():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        g.db.execute('insert into tmp_case (name, case_num) values (?, ?)',
                     [request.form['name'], (request.form['case_num'])])
        g.db.commit()
        flash('添加成功', 'success')
        return redirect(url_for('case_set'))


@app.route('/del_case', methods=['POST'])
def del_case():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    g.db.execute('delete from tmp_case where name=(?)', [request.form['name']])
    g.db.commit()
    flash('移除成功', 'success')
    return redirect(url_for('case_set'))


@app.route('/add_set', methods=['POST'])
def add_set():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.form['cname'] == '':
        flash('用例集名称不能为空', 'danger')
        return redirect(url_for('case_set'))
    if (request.form['cname'],) in g.db.execute('select name from case_set').fetchall():
        flash('用例集名称不能重复', 'danger')
        return redirect(url_for('case_set'))
    try:
        if (int(request.form['cname']),) in g.db.execute('select name from case_set').fetchall():
            flash('用例集名称不能重复', 'danger')
            return redirect(url_for('case_set'))
    except:
        pass
    if len(g.db.execute('select * from tmp_case').fetchall()) == 0:
        flash('未选择任何用例模板，不能创建', 'danger')
        return redirect(url_for('case_set'))
    case_detail = g.db.execute('select name,case_num from tmp_case order by id').fetchall()
    case_num = 0
    for elem in case_detail:
        case_num += int(elem[1])
    rate = round(len(case_detail) / (len(os.listdir('../model')) - 2), 4) * 100
    cover_rate = str(100 if rate >= 100 else rate) + ' %'
    g.db.execute('insert into case_set (name,create_time,case_num,cover_rate,case_detail) values (?,?,?,?,?)', [
        request.form['cname'], time.strftime('%y%m%d %H:%M', time.localtime()), str(case_num), cover_rate,
                 str(case_detail)])
    g.db.execute('drop table if exists model_case;')
    g.db.execute('drop table if exists tmp_case;')
    g.db.commit()
    flash('新建用例集成功', 'success')
    return redirect(url_for('case_set'))


# 用例集操作
@app.route('/case_set_operate', methods=['POST'])
def case_set_operate():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.form['key'] == '删除':
        if (request.form['name'],) in g.db.execute('select case_set from tasks').fetchall():
            flash('当前已有任务使用该用例集，请先删除任务', 'danger')
            return redirect(url_for('case_set'))
        g.db.execute('delete from case_set where name=(?)', [request.form['name']])
        g.db.commit()
        flash('删除用例集成功', 'success')
        return redirect(url_for('case_set'))
    else:
        set_detail = g.db.execute('select * from case_set where name=(?)', [request.form['name']]).fetchall()
        return str(set_detail)


# 自动化任务操作
@app.route('/task_operate', methods=['POST'])
def task_operate():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    global handle
    task_name = str(request.form['name'])
    if request.form['key'] == '启动':
        try:
            g.db.execute('drop table if exists "%s";' % task_name)
            g.db.commit()
            shutil.rmtree('../log/%s' % task_name)
            shutil.rmtree('../data/%s' % task_name)
        except:
            pass

        os.makedirs('../log/%s/error/image/' % task_name)
        os.makedirs('../data/%s/' % task_name)
        g.db.execute('update tasks set status="运行中",operate_time=(?),pass_num=0,pass_rate="0%" where name=(?)',
                     [time.strftime('%y%m%d %H:%M', time.localtime()), task_name])
        g.db.execute('create table "%s" (id integer primary key autoincrement,case_name string not null,\
                    case_page string,flag string,step_num string,type string,ordd string,\
                    xpath string, operate string,data string,step_flag string,img string);' % task_name)
        g.db.commit()
        #proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE)
        s = socket.socket()
        s.connect(('127.0.0.1',1111))
        s.send(('task_name:%s' % task_name).encode('utf-8'))
        handle[task_name] = s
        print(handle[task_name])

    elif request.form['key'] == '删除':
        if g.db.execute('select status from tasks where'
                        ' name=(?)', [task_name]).fetchall()[0][0] not in ('已停止', '未执行', '已完成'):
            flash('请先停止任务后再执行删除操作', 'danger')
            return redirect(url_for('show_tasks'))
        else:
            try:
                g.db.execute('drop table if exists "%s";' % task_name)
                g.db.execute('delete from tasks where name=(?)', [task_name])
                g.db.commit()
                shutil.rmtree('../log/%s' % task_name)
                shutil.rmtree('../data/%s' % task_name)
            except:
                pass

    elif request.form['key'] == '详情':
        if g.db.execute('select status from tasks where'
                        ' name=(?)', [task_name]).fetchall()[0][0] == '未执行':
            flash('任务未启动，暂无详情信息', 'danger')
            return redirect(url_for('show_tasks'))
        if int(g.db.execute('select progress from tasks where name=(?)',
                            [task_name]).fetchall()[0][0].split('%')[0].split('.')[0]) < 10:
            flash('用例动态生成中...，暂无法查看详情', 'warning')
            return redirect(url_for('show_tasks'))
        case_detail = g.db.execute('select * from "%s" where type="0" order by id' % task_name).fetchall()
        step_detail = {}
        for elem in case_detail:
            tmp = g.db.execute('select * from "%s" where type="1" and case_name="%s" order by ordd'
                               % (task_name, elem[1])).fetchall()
            step_detail[elem[1]] = tmp

        return render_template('task_detail.html', cases=case_detail, steps=step_detail)

    elif request.form['key'] == '停止':
        handle[task_name].send(b'exit')
        handle[task_name].close()
        del handle[task_name]
        g.db.execute('update tasks set status="已停止" where name=(?)', [task_name])
        g.db.commit()
    return redirect(url_for('show_tasks'))


# 页面抽象编写
@app.route('/page_ab', methods=['POST', 'GET'])
def page_ab():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        page = request.form['page']
        root = ET.parse('../page/' + page + '.xml').getroot()
        page_para = {}
        xml_parse(root, page_para)
        return jsonify(page_para=page_para)
    else:
        pages = [elem.replace('.xml', '') for elem in os.listdir('../page/')]
        return render_template('page_ab.html', pages=pages)


# 页面抽象修改新增后下发
@app.route('/modify_page', methods=['POST'])
def modify_page():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    write_xml(request.form['page'], (request.form['add_row'], request.form['del_row'], request.form['modify']))
    return jsonify(code=200)


# 模板修改新增后下发
@app.route('/modify_model', methods=['POST'])
def modify_model():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    write_xml(request.form['model'], (request.form['add_row'], request.form['modify'], request.form['del_row']), flag=0)
    return jsonify(code=200)


# 新增抽象页面
@app.route('/xml_add', methods=['POST'])
def xml_add():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    obj = [elem.replace('.xml', '') for elem in os.listdir('../%s/' % request.form['para2'])]
    if request.form['para1'] in obj:
        code = 201
        msg = '名称重复'
    elif request.form['para1'] == '':
        code = 201
        msg = '名称不能为空'
    else:
        code = 200
        msg = ''
        with open('../%s/' % request.form['para2'] + request.form['para1'] + '.xml', 'w') as f:
            f.write('<?xml version="1.0"?><root></root>')
    return jsonify(code=code, msg=msg)


# 模板编写
@app.route('/model', methods=['POST', 'GET'])
def model():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        model = request.form['model']
        root = ET.parse('../model/' + model + '.xml').getroot()
        model_para = {}
        xml_parse(root, model_para, flag=0)
        return jsonify(model_para=model_para)
    else:
        models = [elem.replace('.xml', '') for elem in os.listdir('../model/')]
        return render_template('model.html', models=models)


@app.route('/get_xml', methods=['POST'])
def get_xml():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    if request.method == 'POST':
        para1 = request.form['para1']
        para2 = request.form['para2']
        if para2 == '2':
            root = ET.parse('../page/' + para1).getroot().find('html')
            module = [child.tag for child in root.getchildren()]
            return jsonify(module=module)
        elif para2 == '3':
            para3 = request.form['para3']
            root = ET.parse('../page/' + para1).getroot().find('html').find(para3)
            ty = [child.tag for child in root.getchildren()]
            s_ty = []
            for i in ty:
                s_ty.extend([i + '.' + child.tag for child in root.find(i).getchildren()])
            return jsonify(module=ty+s_ty)
        elif para2 == '5':
            return jsonify(module=['click', 'input', 'assert', 'getinfo', 'tri'])


@app.route('/bug_img')
def bug_img():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    img_path = request.args.get('p')
    print(img_path)
    with open(img_path, 'rb') as f:
        image = f.readlines()
    resp = Response(image, mimetype="image/png")
    return resp

@app.route('/api_record')
def api_record():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('api_record.html')


@app.route('/api_test', methods=['POST'])
def api_test():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    pak = json.loads(request.form['pak'])['type']
    pak_name = json.loads(request.form['pak'])['object_name']
    req_host = request.form['host']
    req_url = 'http://' + req_host + request.form['url']
    req_method = request.form['method']
    project_name = request.form['project']
    if request.form['data'] == '""':
        req_data = {}
    else:
        if pak == 'Object':
            req_data = {pak_name+'Object': json.loads(request.form['data'])}
        elif pak == 'ListObject':
            if isinstance(json.loads(request.form['data']), list):
                if pak_name in ['VideoSlice', 'File', 'Image', 'Case']:
                    req_data = { pak_name+'ListObject': {pak_name: json.loads(request.form['data']) }}
                else:
                    req_data = { pak_name+'ListObject': {pak_name+'Object': json.loads(request.form['data']) }}
            else:
                if pak_name in ['VideoSlice', 'File', 'Image']:
                    req_data = { pak_name+'ListObject': {pak_name: [json.loads(request.form['data']) ]}}
                else:
                    req_data = { pak_name+'ListObject': {pak_name+'Object': [json.loads(request.form['data']) ]}}
        else:
            req_data = json.loads(request.form['data'])
    Interface.dynamic_params(req_data)
    req_auth = request.form['auth']
    if request.form['headers'] == '""':
        req_headers = {}
    else:
        req_headers = json.loads(request.form['headers'])
   
    if project_name == '车综平台':
        if not Interface.cookie:
            set_cookie('车综平台','公共-用户-用户登录')
        req_headers['Cookie'] = Interface.cookie
        
    if req_method == 'GET':
        if req_auth == '"none"':
            t = time.time()
            req = requests.get(req_url, params=req_data, headers=req_headers)
            print('\n', "\033[1;32;40m%s\033[0m" % '[GET]', req.url)
            delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
        else:
            req_auth = json.loads(req_auth)
            if req_auth['auth_method'] == 'Basic':
                t = time.time()
                req = requests.get(req_url, params=req_data, headers=req_headers, auth=HTTPBasicAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
            elif req_auth['auth_method'] == 'Digst':
                t = time.time()
                req = requests.get(req_url,params=req_data, headers=req_headers, auth=HTTPDigestAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
    elif req_method == 'POST':
        if req_auth == '"none"':
            t = time.time()
            req = requests.post(req_url, json=req_data, headers=req_headers)
            print('\n', "\033[1;32;40m%s\033[0m" % '[POST]', req.url, req_data)
            delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
        else:
            req_auth = json.loads(req_auth)
            if req_auth['auth_method'] == 'Basic':
                t = time.time()
                req = requests.post(req_url, json=req_data, headers=req_headers, auth=HTTPBasicAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
            elif req_auth['auth_method'] == 'Digst':
                t = time.time()
                req = requests.post(req_url, json=req_data, headers=req_headers, auth=HTTPDigestAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
    elif req_method == 'PUT':
        if req_auth == '"none"':
            t = time.time()
            req = requests.put(req_url, json=req_data, headers=req_headers)
            delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
        else:
            req_auth = json.loads(req_auth)
            if req_auth['auth_method'] == 'Basic':
                t = time.time()
                req = requests.put(req_url, json=req_data, headers=req_headers, auth=HTTPBasicAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
            elif req_auth['auth_method'] == 'Digst':
                t = time.time()
                req = requests.put(req_url, json=req_data, headers=req_headers, auth=HTTPDigestAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
    elif req_method == 'DELETE':
        if req_auth == '"none"':
            t = time.time()
            req = requests.delete(req_url, headers=req_headers)
            delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
        else:
            req_auth = json.loads(req_auth)
            if req_auth['auth_method'] == 'Basic':
                t = time.time()
                req = requests.delete(req_url, headers=req_headers, auth=HTTPBasicAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
            elif req_auth['auth_method'] == 'Digst':
                t = time.time()
                req = requests.delete(req_url, headers=req_headers, auth=HTTPDigestAuth(req_auth['username'], req_auth['password']))
                delt_t = str(round((time.time() - t)*1000, 1)) + ' ms'
    
    res_headers = dict(req.headers)
    res_status_code = req.status_code
    try:
        res_data = req.json()
    except:
        res_data = str(req.text)
    res_time = delt_t
    return jsonify({'status_code': res_status_code, 'request_time': res_time, 'response': res_data, 'res_h': res_headers, 'request': req_data})


@app.route('/project_api', methods=['POST'])
def project_api():
    if request.form['get'] == 'project':
        project_list = g.db.execute('select * from project;').fetchall()
        return jsonify(project=project_list)
    elif request.form['get'] == 'api':
        api_list = g.db.execute('select * from api where project_name="%s" order by name;' % request.form['project_name']).fetchall()
        tmp = {}
        for elem in api_list:
            k = elem[1].split('-')[0]
            v = elem[1].replace(k+'-', '')
            if k in tmp:
                tmp[k].append(v)
            else:
                tmp[k] = [v]
        return jsonify(api=tmp)
    elif request.form['get'] == 'single_api':
        api = g.db.execute('select * from api where name="%s";' % request.form['api_name']).fetchall()[0]
        return jsonify({'method':api[3], 'url':api[4], 'data':api[5], 'headers':api[6], 'auth':api[7], 'assert_data':api[8], 'host': api[9], 'pak': api[10]})


@app.route('/api_save', methods=['POST'])
def api_save():
    pak = request.form['pak']
    flag = request.form['flag']
    req_host = request.form['host']
    req_api_name = request.form['api_name']
    req_project_name = request.form['project_name']
    req_url = request.form['url']
    req_method = request.form['method']
    req_data = request.form['data'] 
    req_auth = request.form['auth']
    req_headers = request.form['headers']
    req_assert_data = request.form['assert_data']
    
    # 新增api
    if flag == '1':
        obj = g.db.execute("select * from api where name='%s' and project_name='%s';" % (req_api_name, req_project_name)).fetchall()
        if len(obj):
            return jsonify(code=500, msg='接口重名')
        try:
            g.db.execute("insert into api (name, project_name, method, url, data, headers, auth, assert, host, coloum) values('%s','%s', '%s', '%s', '%s','%s', '%s', '%s', '%s', '%s');" % (req_api_name, req_project_name, req_method, req_url, req_data, req_headers, req_auth, req_assert_data, req_host, pak))
            g.db.commit()
            return jsonify(code=200)
        except Exception as msg:
            return jsonify(code=500, msg=msg)
    # 修改api
    else:
        obj = g.db.execute("select * from api where name='%s' and project_name='%s';" % (req_api_name, req_project_name)).fetchall()
        if not len(obj):
            return jsonify(code=500, msg='接口不存在，无法修改')
        try:
            g.db.execute("update api set method='%s', url='%s', data='%s', headers='%s', auth='%s', assert='%s', host='%s', coloum='%s'where name='%s' and project_name='%s';" % (req_method, req_url, req_data, req_headers, req_auth, req_assert_data, req_host, pak, req_api_name, req_project_name))
            g.db.commit()
            return jsonify(code=200)
        except Exception as msg:
            return jsonify(code=500, msg=msg)
