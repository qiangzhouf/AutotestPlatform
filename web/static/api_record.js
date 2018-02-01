//项目、接口  下拉列表动态刷新
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
            $('input#project').val(data.project[0][1])
            refresh_select()
        });
    }
    else{
        $('div#lay').empty()
        $.post('/project_api', {'get': 'api', 'project_name': $('input#project').val()}, function(data){
            $('ul#api_name').empty();
            var new_html = ''
            var sub_html = '<div id="api_b">'
            for (key in data.api){
                new_html = new_html + '<li class="api_fa"><a>' + key + '</a></li>';
                sub_html = sub_html + '<div class="sub_api" style="position:absolute;z-index:999;background-color: #fff;border: 1px solid #ccc;border-radius: 4px;"><ul  style="list-style-type: none;margin:5px 0px;padding:0px;">'
                for (var i=0;i<data.api[key].length;i++){
                    sub_html = sub_html + '<li class="api"><a class="s_api" style="display:block;width: 100%;background:#fff;padding:3px 50px 3px 18px;text-decoration:none;color:#111;">' + data.api[key][i] + '</a></li>';
                };
                sub_html = sub_html + '</ul></div>'
           };
            sub_html = sub_html + '</div>'
            $('ul#api_name').append(new_html)
            $('div#lay').append(sub_html)
            $('div.sub_api').hide()
        });
    }
}

      
//json串逐层拆解
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


//统计data参数表格中的参数个数
function re_data_count(){
    var count = $('table#data').find('tr').length - 1
    $('span#count_data').text(count)
    if (count <= 4){
        $('table#data').parent().css('padding','0px 17px 0px 0px')
    }
    else{
        $('table#data').parent().css('padding','0px')
    }
}


//程序入口
$(function(){
    //刷新项目下拉和接口下拉
    refresh_select()
        
    //请求方法GET,POST...选择
    $("ul.dropdown-menu li.method").click(function(){
        $(this).parent().parent().find("button#method").text($(this).text())
    });
    
    //项目选择，方便接口归类管理
    $("ul.dropdown-menu").on('click', 'li.pro', function(){
        $(this).parent().parent().parent().find("input").val($(this).text())
        refresh_select()
        $('input#api').val('')
    });
    
    //接口多级菜单
    $("ul#api_name").on('mouseover', 'li.api_fa', function(){
        $(this).parent().find('li.api_fa').css("background", "#fff")
        var i = $(this).parent().find('li.api_fa').index($(this))
        var obj = $('div#lay').find('div.sub_api').eq(i)
        obj.css({left:$(this).offset().left+$(this).outerWidth()-$(window).width()/12, top:$(this).offset().top-66})
        obj.show()
    });
    $("ul#api_name").on('mouseout', 'li.api_fa',function(){
        var i = $(this).parent().find('li.api_fa').index($(this))
        var obj = $('div#lay').find('div.sub_api').eq(i)
        obj.hide()
    });
    $("div#lay").on('mouseover', 'div.sub_api', function(){
        $(this).show()
    });
    $("div#lay").on('mouseout', 'div.sub_api', function(){
        $(this).hide()
    });
    $("div#lay").on('mouseover', 'a.s_api', function(){
        $(this).css("background", "#eee")
        var i = $(this).parents('div#api_b').find('div.sub_api').index($(this).parents('div.sub_api'))
        $('ul#api_name').find('li.api_fa').eq(i).css("background", "#eee")
    });
    $("div#lay").on('mouseout', 'a.s_api', function(){
        $(this).css("background", "#fff")
    });
    
    //接口选择，接口查看编辑修改
    $("div#lay").on('click', 'li.api', function(){
        $(this).parents('div.sub_api').hide()
        //清除上一次响应数据
        //响应头部
        $('tr.dam_res').remove()
        //响应消息题
        $('textarea').val('')
        //响应状态码、时间
        $('span#status_code').text('')
        $('span#request_time').text('')
        //响应校验参数，气泡数
        $('tr.assert').remove()
        $('a#er span').remove()
        //请求参数和请求头部
        $('tr.dam').remove();
        //list对象的多个表格
        $('table#data').parent().nextAll('div.list').remove()
        
        //根据接口名，请求接口参数，刷新界面
        var i_num = $(this).parents('div#api_b').find('div.sub_api').index($(this).parents('div.sub_api'))
        var tmp = $('ul#api_name').find('li.api_fa').eq(i_num).text() + '-' + $(this).text()
        $('input#api').val(tmp)
        $.post('/project_api', {'get': 'single_api', 'api_name': tmp}, function(data){
            //刷新请求方法
            $('button#method').text(data.method);
            //刷新请求URL
            $('input#url').val(data.url);
            
            //刷新参数表格
            var j_data = JSON.parse(data.data)
            if (j_data != ''){
                for (var key in j_data){
                    var new_html = '<tr class="dam"><td style="width:18%"><input style="border:none"/></td><td style="width:18%"><input style="border:none"/></td><td style="width:18%"><input style="border:none"/></td><td style="width:18%"><select class="form-control"><option value ="null" selected>Null</option><option value ="requirement">Requirement</option><option value="option">Option</option></select></td><td style="width:18%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
                    $('table#data').find('tr').last().after(new_html);
                    $('table#data').find('tr').last().find('td').eq(0).find('input').val(key);
                    $('table#data').find('tr').last().find('td').eq(1).find('input').val(j_data[key]["value"]);
                    $('table#data').find('tr').last().find('td').eq(2).find('input').val(j_data[key]["desc"]);
                    $('table#data').find('tr').last().find('td').eq(3).find('select').val(j_data[key]["O/R"]);
                    $('table#data').find('tr').last().find('td').eq(4).find('input').val(j_data[key]["range"]);
                };
            };
            
            //刷新请求头部参数表格
            var j_headers = JSON.parse(data.headers)
            if (j_headers != ''){
                for (var key in j_headers){
                    var new_html = '<tr class="dam"><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
                    $('table#req_h').find('tr').last().after(new_html);
                    $('table#req_h').find('tr').last().find('td').eq(0).find('input').val(key);
                    $('table#req_h').find('tr').last().find('td').eq(1).find('input').val(j_headers[key]);
                };
            };
            
            //刷新授权参数
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
            
            //刷新参数包封
            var j_pak = JSON.parse(data.pak)
            if (j_pak['type'] == 'ListObject'){
                $('input#options3').trigger("click");
                $('input#pak_name').val(j_pak['object_name'])
            }
            else if (j_pak['type'] == 'Object'){
                $('input#options2').trigger("click");
                $('input#pak_name').val(j_pak['object_name'])
            }
            else{
                $('input#options1').trigger("click");
                $('input#pak_name').val('')
                };
            
            //刷新请求host
            var j_host = JSON.parse(data.host)
            if (j_host != '' && j_host != null){
                if ($('input#ip').val() == ''){
                    $('input#ip').val(j_host['ip'])
                };
                if ($('input#port').val() == ''){
                    $('input#port').val(j_host['port'])
                };
            };
            
            //刷新自定义检验的参数表格
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
            
        //post完成后，统计参数个数    
        re_data_count()
        });
    });
    
    //授权选择，选择授权类型后动态加载账户密码输入框
    $("input:radio[name='auth']").click(function(){
        if ($(this).val() != "None"){
            $('[name="authup"]').attr('style', "display: block;")
        }
        else{$('[name="authup"]').attr('style', "display: none;")};
    });
    
    //对象参数，选择时，加一层包封
    $("input:radio[name='pak']").click(function(){
        if ($(this).val() != "None"){
            $('[name="pak_name"]').attr('style', "display: block;")
            if ($(this).val() == "ListObject"){
                $('div[name="list_num"]').attr('style', "display: block;")
            }
            else{
                $('div[name="list_num"]').attr('style', "display: none;");
            }
        }
        else{$('[name="pak_name"]').attr('style', "display: none;");
            $('div[name="list_num"]').attr('style', "display: none;");
        };
    });

    // ListObject时，添加多个表格
    $("button#add_list").click(function(){
        var div = $('table#data').parents('div.list');
        var fa = div.parent();
        fa.find('div.list').last().after(div.clone());
        var index = fa.find('div.list').index(fa.find('div.list').last())
        fa.find('div.list').last().find('table').eq(1).attr('id','data'+index)
        fa.find('div.list').last().find('table').eq(0).attr('id','data_h'+index)
    });
    
    // ListObject时，删除表格
    $("button#del_list").click(function(){
        var div = $('table#data').parents('div.list');
        var fa = div.parent();
        if (fa.find('div.list').length>1){
            fa.find('div.list').last().remove()
        }
    });
    
    //头部参数添加，动态生成表格
    $("button#add").click(function(){
        var insert_html = '<tr class="dam"><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:30%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
        $(this).parent().parent().parent().find("tr").last().after(insert_html)
    });
    
    //data参数添加，动态生成表格
    $("button#add_json").click(function(){
        var insert_html = '<tr class="dam"><td style="width:18%"><input style="border:none"/></td><td style="width:18%"><input style="border:none"/></td><td style="width:18%"><input style="border:none"/></td><td style="width:18%"><select class="form-control"><option value ="null" selected>Null</option><option value ="requirement">Requirement</option><option value="option">Option</option></select></td><td style="width:18%"><input style="border:none"/></td><td style="width:10%" align="center"><button class="btn btn-default" id="del" style="padding:0px 8px"><font size="3">x</font></button></td></tr>'
        $('table#data').find("tr").last().after(insert_html)
        if ($(this).parents('table').attr('id') == 'data_h'){re_data_count()}
    });
    
    //参数删除，动态删除表格
    $('table').on('click', 'button#del', function(){
        if ($(this).parents('table').attr('id') == 'data'){
            $(this).parent().parent().remove()
            re_data_count()
        }
        else{
            $(this).parent().parent().remove()
        }
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
    
    //参数表格，表格点击时可编辑
    $('table').on('click', 'td', function(){
        $(this).find('input').removeAttr("style");
        $(this).find('input').focus();
    });
    
    //参数表格，表格失去焦点时，隐藏input边框
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
    
    //批量删除参数值
    $('button#del_alldata').click(function(){
        $('table#data').find('tr.dam').remove();
        if ($(this).parents('table').attr('id') == 'data_h'){re_data_count()}
    });
    
    //批量删除校验值
    $('button#del_assert').click(function(){
        $('tr.assert').remove();
    });
    
    //下发http请求，返回响应
    $('button#send').click(function(){
        //清除上一次响应数据
        $('tr.dam_res').remove()
        $('textarea').val('')
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
        var host = $('input#ip').val().trim() + ':' + $('input#port').val().trim();
        var url = $('input#url').val().trim();
        var method = $('button#method').text().trim();
        var datas = '';
        var auth = 'none';
        var headers = '';
        var pak = '';
        
        //外层包封
        pak = {'type': $('input:radio[name="pak"]:checked').val().trim(), 'object_name': $('input#pak_name').val().trim()}
        
        //get/post数据，字典形式
        if ($('table#data').find('tr.dam').length > 0){
            if (pak['type'] == 'ListObject'){
                datas = [];
                var div = $('div.list');
                var count = div.length;
                for (var j=0;j<count;j++){
                    var tmp_data = {}
                    var elem = div.eq(j).find('tr.dam')
                    var len = elem.length
                    for (var i=0;i<len;i++){
                        var s = elem.eq(i).find('td').eq(1).find('input').val()
                        if (s.match('json:')){
                            tmp_data[elem.eq(i).find('td').eq(0).find('input').val().trim()] = JSON.parse(s.split('json:')[1].trim());
                        }
                        else{
                            tmp_data[elem.eq(i).find('td').eq(0).find('input').val().trim()] = s.trim();
                        }
                    }; 
                    datas[j] = tmp_data
                };
            }
            else{
                datas = {}
                var elem = $('table#data').find('tr.dam')
                for (var i=0;i<elem.length;i++){
                    var s = elem.eq(i).find('td').eq(1).find('input').val()
                    if (s.match('json:')){
                        datas[elem.eq(i).find('td').eq(0).find('input').val()] = JSON.parse(s.split('json:')[1]);
                    }
                    else{
                        datas[elem.eq(i).find('td').eq(0).find('input').val().trim()] = s.trim();
                    }
                };
            }
        };
        
        //授权数据
        if ($('input:radio[name="auth"]:checked').val() != 'None'){
            auth = {};
            auth["auth_method"] = $('input:radio[name="auth"]:checked').val().trim();
            auth["username"] = $('input#auth_u').val().trim();
            auth["password"] = $('input#auth_p').val().trim();
        };
        
        //请求头部参数
        if ($('table#req_h').find('tr.dam').length > 0){
            headers = {}
            var elem = $('table#req_h').find('tr.dam')
            for (var i=0;i<elem.length;i++){
                headers[elem.eq(i).find('td').eq(0).find('input').val().trim()] = elem.eq(i).find('td').eq(1).find('input').val().trim()
            };
        };
            
        //ajax下发post数据
        $.post('/api_test', {'pak': JSON.stringify(pak), 'url': url, 'host': host, 'method': method, 'data': JSON.stringify(datas), 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers)}, function(data){
            $('span#status_code').text(data.status_code);
            $('span#request_time').text(data.request_time);
            $('textarea#response-json').val(JSON.stringify(data.response, null, 4))
            $('textarea#request-json').val(JSON.stringify(data.request, null, 4))
            $('textarea#response-text').val(JSON.stringify(data.response))
            $('textarea#request-text').val(JSON.stringify(data.request))
            for(var key in data.res_h){
                var new_html = '<tr class="dam_res"><td>' + key + '</td><td>' + data.res_h[key] + '</td><tr>';
                $('table#res_h').find('tr').last().after(new_html);
            };
            
            // 自定义校验响应参数
            // 自定义表格为空时，生成初始校验表，以供用户自定义
            if ($('table#assert_tb').find('tr').length == 1){
                var assert_obj = {}
                parse_res(data.response, assert_obj)
                var assert_type = '<select class="form-control"><option value ="null">Null</option><option value ="value">Value</option><option value="exist">Exist</option><option value="length">Length</option><option value="range">Range</option><option value="set">Set</option></select>'
                for(var key in assert_obj){
                    var new_html = '<tr class="assert"><td>' + key + '</td><td>' + assert_obj[key] + '</td><td>' + assert_type + '</td><td class="av"></td></tr>';
                    $('table#assert_tb').find('tr').last().after(new_html);
                };
            }
            // 自定义表格非空时，根据表格内容逐条校验
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
                    
                    // 值校验
                    if (td3.find('select').val()=='value'){
                        if (td2.text()!=td4.find('input').val()){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    // 存在校验
                    else if (td3.find('select').val()=='exist'){
                        if (td2.text()=='-1'){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    // 长度校验
                    else if (td3.find('select').val()=='length'){
                        if (td2.text().length!=td4.find('input').val()){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    // 大小范围校验
                    else if (td3.find('select').val()=='range'){
                        var lit = td4.find('input').val().split('-')[0]
                        var lar = td4.find('input').val().split('-')[1]
                        if (parseInt(td2.text())>parseInt(lar) || parseInt(td2.text())<parseInt(lit)){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                    // 取值集合校验
                    else if (td3.find('select').val()=='set'){
                        var set = td4.find('input').val().split(',')
                        if (!(set.includes(td2.text()))){
                            tr.eq(i).attr('class', 'assert danger')
                            count_error += 1
                        }
                    }
                };
                // 根据校验结果，刷新红色气泡
                if (count_error > 0){$('a#er').append('<span class="badge" style="background-color:red">'+ count_error +'</span>')}
            }
        });
    });
    
    //保存接口到项目
    $('button#save').click(function(){
        //校验必填参数，失败后不让下发
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

       //下发参数获取
        var flag = '0'
        if ($(this).text() == '新增'){
            flag = '1' 
        }
        var host = {'ip': $('input#ip').val().trim(), 'port': $('input#port').val().trim()}
        var api_name = $('input#api').val().trim();
        var project_name = $('input#project').val().trim();
        var url = $('input#url').val().trim();
        var method = $('button#method').text().trim();
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
                datas[elem.eq(i).find('td').eq(0).find('input').val().trim()] = {"value": elem.eq(i).find('td').eq(1).find('input').val().trim(),
                "desc": elem.eq(i).find('td').eq(2).find('input').val().trim(), "O/R": elem.eq(i).find('td').eq(3).find('select').val(),
                    "range": elem.eq(i).find('td').eq(4).find('input').val().trim()}
            };
        };
        
        //授权数据
        if ($('input:radio[name="auth"]:checked').val() != 'None'){
            auth = {};
            auth["auth_method"] = $('input:radio[name="auth"]:checked').val().trim();
            auth["username"] = $('input#auth_u').val().trim();
            auth["password"] = $('input#auth_p').val().trim();
        };
        
        //请求头部参数
        if ($('table#req_h').find('tr.dam').length > 0){
            headers = {}
            var elem = $('table#req_h').find('tr.dam')
            for (var i=0;i<elem.length;i++){
                headers[elem.eq(i).find('td').eq(0).find('input').val().trim()] = elem.eq(i).find('td').eq(1).find('input').val().trim()
            };
        };
        
        //校验参数
        if ($('table#assert_tb').find('td.av').find('input').length>0 || $('table#assert_tb').find('td.av').find('select').length>0){
            assert_data = {}
            obj = $('table#assert_tb').find('tr')
            for (var i=1;i<obj.length;i++){
                var assert_value = ''
                if (obj.eq(i).find('td').eq(3).find('select').length>0){assert_value = obj.eq(i).find('td').eq(3).find('select').val().trim()}
                else if (obj.eq(i).find('td').eq(3).find('input').length>0){assert_value = obj.eq(i).find('td').eq(3).find('input').val().trim()};
                assert_data[obj.eq(i).find('td').eq(0).text().trim()] = {'assert_type': obj.eq(i).find('td').eq(2).find('select').val(),'assert_value': assert_value};
            };
        };
        
        //外层包封
        pak = {'type': $('input:radio[name="pak"]:checked').val().trim(), 'object_name': $('input#pak_name').val().trim()}
        
        //ajax下发post数据
        $.post('/api_save', {'pak': JSON.stringify(pak), 'flag': flag, 'host': JSON.stringify(host), 'api_name': api_name, 'project_name': project_name, 'url': url, 'method': method, 'data': JSON.stringify(datas), 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers), 'assert_data':  JSON.stringify(assert_data)}, function(data){
            if (data.code==200){
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
