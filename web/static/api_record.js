//刷新项目和接口的下拉列表
function refresh_select()
{
    if ($('input#project').val() == ''){
        $.post('/project_api', {'get': 'project'}, function(data){
            $('ul#project_name').empty();
            $('ul#api_name').empty();
            var new_html = ''
            for (var i=0;i<data.project.length;i++){
                new_html = new_html + '<li class="pro"><a>' + data.project[i][1] + '</a></li>';
           };
            $('ul#project_name').append(new_html)
        });
    }
    else{
        $.post('/project_api', {'get': 'api', 'project_name': $('input#project').val()}, function(data){
            $('ul#api_name').empty();
            var new_html = ''
            for (var i=0;i<data.api.length;i++){
                new_html = new_html + '<li class="api"><a>' + data.api[i][1] + '</a></li>';
           };
            $('ul#api_name').append(new_html)
        });
    }
}

      
//返回参数格式化
function parse_res(fa,res,f=''){
    for (key in fa){
        if (typeof(fa[key])=='object'){
            try {
                if (fa[key].length > 0){
                    f = f + key + '[0].';
                    parse_res(fa[key][0],res,f)
                }
                else{
                f = f + key + '.';
                parse_res(fa[key],res,f)
                }
            } catch(error) {
                f = f + key + '.';
                parse_res(fa[key],res,f)
            };
        }
        else{
            res[f+key] = fa[key]
        };
    };
}


//入口
$(function(){
    //刷新项目下拉和接口下拉
    refresh_select()
        
    //请求方法GET,POST...选择
    $("ul.dropdown-menu li.method").click(function(){
        $(this).parent().parent().find("button").text($(this).text())
    });
    
    //项目选择，方便接口归类管理
    $("ul.dropdown-menu").on('click', 'li.pro', function(){
        $(this).parent().parent().parent().find("input").val($(this).text())
        refresh_select()
        $('input#api').val('')
    });
    
    //接口选择，接口查看编辑修改
    $("ul.dropdown-menu").on('click', 'li.api', function(){
        //清除上一次响应数据
        $('tr.dam_res').remove()
        $('textarea#response').text('')
        $('span#status_code').text('')
        $('span#request_time').text('')
        $('tr.assert').remove()
        $('a#er span').remove()
        
        $(this).parent().parent().parent().find("input").val($(this).text())
        $.post('/project_api', {'get': 'single_api', 'api_name': $(this).text()}, function(data){
            $('button#method').text(data.method);
            $('input#url').val(data.url);
            $('tr.dam').remove();
            var j_data = JSON.parse(data.data)
            if (j_data != ''){
                for (var key in j_data){
                    var new_html = '<tr class="dam"><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
                    $('table#data').find('tr').last().after(new_html);
                    $('table#data').find('tr').last().find('td').eq(0).find('input').val(key);
                    $('table#data').find('tr').last().find('td').eq(1).find('input').val(j_data[key]);
                };
            };
            var j_headers = JSON.parse(data.headers)
            if (j_headers != ''){
                for (var key in j_headers){
                    var new_html = '<tr class="dam"><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
                    $('table#req_h').find('tr').last().after(new_html);
                    $('table#req_h').find('tr').last().find('td').eq(0).find('input').val(key);
                    $('table#req_h').find('tr').last().find('td').eq(1).find('input').val(j_headers[key]);
                };
            };
            var j_auth = JSON.parse(data.auth)
            if (j_auth != 'none'){
                if (j_auth['auth_method'] == 'Basic'){
                    $('input#optionsRadios2').trigger("click");
                }
                else{$('input#optionsRadios3').trigger("click");};
                $('input#auth_u').val(j_auth["username"])
                $('input#auth_p').val(j_auth["password"])
            }
            else
            {
                $('input#optionsRadios1').trigger("click");
            };
            if (data.pak == 'ObjectList'){
                $('input#options3').trigger("click");
            }
            else if (data.pak == 'Object'){
                $('input#options2').trigger("click");
            }
            else{$('input#options1').trigger("click");};
            var j_host = JSON.parse(data.host)
            if (j_host != '' && j_host != null){
                $('input#ip').val(j_host['ip'])
                $('input#port').val(j_host['port'])
            };
            var j_assert_data = JSON.parse(data.assert_data)
            if (j_assert_data != ''){
                var assert_type = '<select class="form-control"><option value ="null">Null</option><option value ="value">Value</option><option value="exist">Exist</option><option value="length">Length</option><option value="range">Range</option><option value="set">Set</option></select>'
                for(var key in j_assert_data){
                    var new_html = '<tr class="assert"><td>' + key + '</td><td></td><td>' + assert_type + '</td><td class="av"></td></tr>';
                    $('table#assert_tb').find('tr').last().after(new_html);
                    $('table#assert_tb').find('tr').last().find('td').eq(2).find('select').val(j_assert_data[key]['assert_type'])
                    if (j_assert_data[key]['assert_type'] == 'exist'){
                        $('table#assert_tb').find('tr').last().find('td').eq(3).append('<select class="form-control" ><option value ="true">True</option><option value ="false">False</option></select>')
                        $('table#assert_tb').find('tr').last().find('td').eq(3).find('select').val(j_assert_data[key]['assert_value'])
                    }
                    else if (j_assert_data[key]['assert_type'] == 'null'){
                        $('table#assert_tb').find('tr').last().find('td').eq(3).empty()
                    }
                    else{
                        $('table#assert_tb').find('tr').last().find('td').eq(3).append('<input class="form-control"/>')
                        $('table#assert_tb').find('tr').last().find('td').eq(3).find('input').val(j_assert_data[key]['assert_value'])
                    };
                    
                };
            };
        });
    });
    
    //授权选择，选择授权类型后动态加载账户密码输入框
    $("input:radio[name='auth']").click(function(){
        if ($(this).val() != "None"){
            $('[name="authup"]').attr('style', "display: block;")
        }
        else{$('[name="authup"]').attr('style', "display: none;")};
    });
    
    //头部参数添加，动态生成表格
    $("button#add").click(function(){
        var insert_html = '<tr class="dam"><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
        $(this).parent().parent().parent().find("tr").last().after(insert_html)
    });
    
    //头部参数删除，动态删除表格
    $('table').on('click', 'button#del', function(){
        $(this).parent().parent().remove()
    });
    
    //url自动规范成path, ip, port
    $('input#url').blur(function(){
        var url_val = $(this).val()
        var url_val_new = '';
        var ip_val = '';
        var port_val = '';
        if (url_val != ''){
            if (url_val.indexOf('http://') >= 0){
                ip_val = url_val.split('//')[1].split('/')[0].split(':')[0];
                if (url_val.split('//')[1].split('/')[0].indexOf(':') >=0 ){
                    port_val = url_val.split('//')[1].split('/')[0].split(':')[1];
                };
                url_val_new = url_val.split(url_val.split('//')[1].split('/')[0])[1];
            }
            else
            {
                if (url_val.indexOf('/') != 0){url_val_new = '/' + url_val;};
            };
        };
        if (url_val_new != ''){$('input#url').val(url_val_new)};
        if (ip_val != ''){$('input#ip').val(ip_val)};
        if (port_val != ''){$('input#port').val(port_val)};
    });
    
    //头部参数，表格点击时可编辑
    $('table').on('click', 'td', function(){
        $(this).find('input').removeAttr("style");
        $(this).find('input').focus();
    });
    
    //头部参数，表格失去焦点时，隐藏input边框
    $('table').on('blur', 'input', function(){
        $(this).attr("style", "border:none");
    });
    
    //自定义校验类型选择后，目标值表格动态变化
    $('table#assert_tb').on('change', 'select', function(){
        obj_td = $(this).parent().next('td')
        if ($(this).val() == 'null'){obj_td.empty()}
        else if ($(this).val() == 'value'){obj_td.empty();obj_td.append('<input class="form-control"/>')}
        else if ($(this).val() == 'exist'){obj_td.empty();obj_td.append('<select class="form-control" ><option value ="true">True</option><option value ="false">False</option></select>')}
        else if ($(this).val() == 'length'){obj_td.empty();obj_td.append('<input class="form-control"/>')}
        else if ($(this).val() == 'range'){obj_td.empty();obj_td.append('<input class="form-control"/>')}
        else if ($(this).val() == 'set'){obj_td.empty();obj_td.append('<input class="form-control"/>')}
    });
    
    //下发http请求，返回响应
    $('button#send').click(function(){
        //清除上一次响应数据
        $('tr.dam_res').remove()
        $('textarea#response').text('')
        $('span#status_code').text('')
        $('span#request_time').text('')
        $('a#er span').remove()
        if ($('tr.assert td.av').find('input').length==0 && $('tr.assert td.av').find('select').length==0){
            $('tr.assert').remove();
        }
        else{
            $('tr.assert').each(function(){
                $(this).find('td').eq(1).text('')
                $(this).attr('class', 'assert')
            });
        }
        
        //下发前必要参数校验
        if ($('input#url').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请求地址url不能为空，请输入url值！");
            $("button#send_alert").trigger("click");
            return
        };
        if ($('input#ip').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请求ip不能为空，请输入ip值！");
            $("button#send_alert").trigger("click");
            return
        };
        if ($('input#port').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请求端口不能为空，请输入port值！");
            $("button#send_alert").trigger("click");
            return
        };
        if ($('button#method').text() == '方法 '){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请选择请求方法GET/POST！");
            $("button#send_alert").trigger("click");
            return
        };
        if ($('[name="authup"]').attr('style') == 'display: block;'){
            if ($('input#auth_u').val() == '' || $('input#auth_p').val() == ''){
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text("选择授权后，请输入授权账户密码！");
                $("button#send_alert").trigger("click");
                return
            };
        };
        
        //下发参数获取
        var host = $('input#ip').val() + ':' + $('input#port').val();
        var url = $('input#url').val();
        var method = $('button#method').text();
        var datas = '';
        var auth = 'none';
        var headers = '';
        var pak = '';
        //get/post数据，字典形式
        if ($('table#data').find('tr.dam').length > 0){
            datas = {}
            var elem = $('table#data').find('tr.dam')
            for (var i=0;i<elem.length;i++){
                datas[elem.eq(i).find('td').eq(0).find('input').val()] = elem.eq(i).find('td').eq(1).find('input').val()
            };
        };
        //授权数据
        if ($('input:radio[name="auth"]:checked').val() != 'None'){
            auth = {};
            auth["auth_method"] = $('input:radio[name="auth"]:checked').val();
            auth["username"] = $('input#auth_u').val();
            auth["password"] = $('input#auth_p').val();
        };
        //请求头部参数
        if ($('table#req_h').find('tr.dam').length > 0){
            headers = {}
            var elem = $('table#req_h').find('tr.dam')
            for (var i=0;i<elem.length;i++){
                headers[elem.eq(i).find('td').eq(0).find('input').val()] = elem.eq(i).find('td').eq(1).find('input').val()
            };
        };
        //外层包封
        pak = $('input:radio[name="pak"]:checked').val()
            
        //ajax下发post数据
        $.post('/api_test', {'pak':pak, 'url': url, 'host': host, 'method': method, 'data': JSON.stringify(datas), 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers)}, function(data){
            $('span#status_code').text(data.status_code);
            $('span#request_time').text(data.request_time);
            $('textarea#response').text(JSON.stringify(data.response, null, 4))
            for(var key in data.res_h){
                var new_html = '<tr class="dam_res"><td>' + key + '</td><td>' + data.res_h[key] + '</td><tr>';
                $('table#res_h').find('tr').last().after(new_html);
            };
            if ($('table#assert_tb').find('tr').length == 1){
                var assert_obj = {}
                parse_res(data.response, assert_obj)
                var assert_type = '<select class="form-control"><option value ="null">Null</option><option value ="value">Value</option><option value="exist">Exist</option><option value="length">Length</option><option value="range">Range</option><option value="set">Set</option></select>'
                for(var key in assert_obj){
                    var new_html = '<tr class="assert"><td>' + key + '</td><td>' + assert_obj[key] + '</td><td>' + assert_type + '</td><td class="av"></td></tr>';
                    $('table#assert_tb').find('tr').last().after(new_html);
                };
            }
            else{
                var assert_obj = {}
                parse_res(data.response, assert_obj)
                var tr = $('table#assert_tb').find('tr.assert')
                var count_error = 0
                for (var i=0;i<tr.length;i++){
                    var td1 = tr.eq(i).find('td').eq(0)
                    var td2 = tr.eq(i).find('td').eq(1)
                    var td3 = tr.eq(i).find('td').eq(2)
                    var td4 = tr.eq(i).find('td').eq(3)
                    td2.text(assert_obj[td1.text()])
                    if (td3.find('select').val()=='value'){
                        if (td2.text()!=td4.find('input').val()){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    else if (td3.find('select').val()=='exist'){
                        if (td2.text()=='-1'){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    else if (td3.find('select').val()=='length'){
                        if (td2.text().length!=td4.find('input').val()){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    else if (td3.find('select').val()=='range'){
                        var lit = td4.find('input').val().split('-')[0]
                        var lar = td4.find('input').val().split('-')[1]
                        if (parseInt(td2.text())>parseInt(lar) || parseInt(td2.text())<parseInt(lit)){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    else if (td3.find('select').val()=='set'){
                        var set = td4.find('input').val().split(',')
                        if (!(set.includes(td2.text()))){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                };
                if (count_error > 0){$('a#er').append('<span class="badge" style="background-color:red">'+ count_error +'</span>')}
            }
        });
    });
    
    //保存接口到项目
    $('button#save').click(function(){
        if ($('input#url').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请输入接口地址！");
            $("button#send_alert").trigger("click");
            return
        }
        if ($('input#project').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请输入接口要保存到的项目！");
            $("button#send_alert").trigger("click");
            return
        }
        if ($('input#api').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请输入接口名称！");
            $("button#send_alert").trigger("click");
            return
        }
        /*
        if ($('span#status_code').text() != '200'){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("接口测试成功后才能保存！");
            $("button#send_alert").trigger("click");
            return
        }
        */
       //下发参数获取
        var flag = '0'
        if ($(this).text() == '新增'){
            flag = '1' 
        }
        var host = {'ip': $('input#ip').val(), 'port': $('input#port').val()}
        var api_name = $('input#api').val();
        var project_name = $('input#project').val();
        var url = $('input#url').val();
        var method = $('button#method').text();
        var datas = '';
        var auth = 'none';
        var headers = '';
        var assert_data = ''
        var pak = '';
        //get/post数据，字典形式
        if ($('table#data').find('tr.dam').length > 0){
            datas = {}
            var elem = $('table#data').find('tr.dam')
            for (var i=0;i<elem.length;i++){
                datas[elem.eq(i).find('td').eq(0).find('input').val()] = elem.eq(i).find('td').eq(1).find('input').val()
            };
        };
        //授权数据
        if ($('input:radio:checked').val() != 'None'){
            auth = {};
            auth["auth_method"] = $('input:radio:checked').val();
            auth["username"] = $('input#auth_u').val();
            auth["password"] = $('input#auth_p').val();
        };
        //请求头部参数
        if ($('table#req_h').find('tr.dam').length > 0){
            headers = {}
            var elem = $('table#req_h').find('tr.dam')
            for (var i=0;i<elem.length;i++){
                headers[elem.eq(i).find('td').eq(0).find('input').val()] = elem.eq(i).find('td').eq(1).find('input').val()
            };
        };
        //校验参数
        if ($('table#assert_tb').find('td.av').find('input').length>0 || $('table#assert_tb').find('td.av').find('select').length>0){
            assert_data = {}
            obj = $('table#assert_tb').find('tr')
            for (var i=1;i<obj.length;i++){
                var assert_value = ''
                if (obj.eq(i).find('td').eq(3).find('select').length>0){assert_value = obj.eq(i).find('td').eq(3).find('select').val()}
                else if (obj.eq(i).find('td').eq(3).find('input').length>0){assert_value = obj.eq(i).find('td').eq(3).find('input').val()};
                assert_data[obj.eq(i).find('td').eq(0).text()] = {'assert_type': obj.eq(i).find('td').eq(2).find('select').val(),'assert_value': assert_value};
            };
        };
        //外层包封
        pak = $('input:radio[name="pak"]:checked').val()
        
        //ajax下发post数据
        $.post('/api_save', {'pak': pak, 'flag': flag, 'host': JSON.stringify(host), 'api_name': api_name, 'project_name': project_name, 'url': url, 'method': method, 'data': JSON.stringify(datas), 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers), 'assert_data':  JSON.stringify(assert_data)}, function(data){
            if (data.code=200){
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text("保存成功！");
                $("button#send_alert").trigger("click");
                refresh_select()
            }
            else
            {
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text("保存失败: " + data.msg + '！');
                $("button#send_alert").trigger("click");
            }
        });
    });
});