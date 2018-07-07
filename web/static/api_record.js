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
        $.post('/project_api', {'get': 'api', 'project_name': $('input#project').val(), 'type':''}, function(data){
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
                    parse_res(fa[key][0],res,f + key + '.0.')
                }
                else{
                parse_res(fa[key],res,f + key + '.')
                }
            } catch(error) {
                parse_res(fa[key],res,f + key + '.')
            };
        }
        else{
            res[f+key] = fa[key]
        };
    };
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
    
    // 删除接口
    $('button#del_i').on('click', function(){
        if ($('input#project').val()=='' || $('input#api').val()==''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text('请选择要删除的接口！');
            $("button#send_alert").trigger("click");
            return
        }
        $.post('/project_api', {'get': 'del', 'project_name': $('input#project').val(), 'api_name': $('input#api').val()}, function(data){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text(data.msg);
            $("button#send_alert").trigger("click");
            if (data.msg=='删除成功'){
                refresh_select();
                $('input#api').val('')
            };
        });
    });
    
    
    //请求参数的json合法性校验
    $('textarea#new_data').on('blur', function(){
        try{
            JSON.parse($(this).val());
            $(this).attr('style', $(this).attr('style').replace(/background-color:#FFB5C5;/g, ''))
            $(this).val(JSON.stringify(JSON.parse($(this).val()), null, 16))
        }
        catch(err){
            if ($(this).val() == ''){
                $(this).attr('style', $(this).attr('style').replace(/background-color:#FFB5C5;/g, ''))
            }
            else{
                $(this).attr('style', 'background-color:#FFB5C5;'+$(this).attr('style'))
            }
            
        }
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
        $('textarea#new_data').val('')
        
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
            $('textarea#new_data').val(JSON.stringify(JSON.parse(data.data), null, 16))   
            
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
                    var new_html = '<tr class="assert"><td style="width:20%;word-wrap:break-word;">' + key + '</td><td style="width:20%;word-wrap:break-word;"></td><td style="width:20%;word-wrap:break-word;">' + assert_type + '</td><td class="av" style="width:20%;word-wrap:break-word;"></td></tr>';
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
        $('textarea').not("#new_data").val('')
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
        
        //get/post数据，字典形式
        datas = $('textarea#new_data').val()
        
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
        $.post('/api_test', {'url': url, 'host': host, 'method': method, 'data': datas, 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers), 'project': $('input#project').val()}, function(data){
            $('span#status_code').text(data.status_code);
            if (data.status_code<300){
                $('span#status_code').attr('class', "label label-success");
            }
            else if (data.status_code<400){
                $('span#status_code').attr('class', "label label-info");
            }
            else if (data.status_code<500){
                $('span#status_code').attr('class', "label label-warning");
            }
            else {
                $('span#status_code').attr('class', "label label-danger");
            }
            $('span#request_time').text(data.request_time);
            var n = parseInt(data.request_time)
            if (n<1000){
                $('span#request_time').attr('class', "label label-success");
            }
            else if (n<3000){
                $('span#request_time').attr('class', "label label-warning");
            }
            else {
                $('span#request_time').attr('class', "label label-danger");
            }
            
            $('textarea#response-json').val(JSON.stringify(data.response, null, 16))
            $('textarea#request-json').val(JSON.stringify(data.request, null, 16))
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
                    var new_html = '<tr class="assert"><td style="width:20%;word-wrap:break-word;">' + key + '</td><td style="width:25%;word-wrap:break-word;">' + assert_obj[key] + '</td><td style="width:20%;word-wrap:break-word;">' + assert_type + '</td><td class="av" style="width:25%;word-wrap:break-word;"></td></tr>';
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
        if ($('input#api').val() == '' || $('input#api').val().indexOf("-")==-1){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请输入接口名称, 命名规范《分类-名称》！");
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
        datas = $('textarea#new_data').val()
            
        
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
        
        //ajax下发post数据
        $.post('/api_save', { 'flag': flag, 'host': JSON.stringify(host), 'api_name': api_name, 'project_name': project_name, 'url': url, 'method': method, 'data': datas, 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers), 'assert_data':  JSON.stringify(assert_data)}, function(data){
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
