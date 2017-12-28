$(function(){
    //请求方法GET,POST...选择
    $("ul.dropdown-menu li.method").click(function(){
        $(this).parent().parent().find("button").text($(this).text())
    });
    
    //项目选择，方便接口归类管理
    $("ul.dropdown-menu li.pro").click(function(){
        $(this).parent().parent().parent().find("input").val($(this).text())
    });
    
    //授权选择，选择授权类型后动态加载账户密码输入框
    $("[name='optionsRadiosinline']").click(function(){
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
    
    //下发http请求，返回响应
    $('button#send').click(function(){
        //清除上一次响应数据
        $('tr.dam_res').remove()
        $('textarea#response').text('')
        $('span#status_code').text('')
        $('span#request_time').text('')
        
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
        
        //ajax下发post数据
        $.post('/api_test', {'url': url, 'host': host, 'method': method, 'data': JSON.stringify(datas), 'auth': JSON.stringify(auth), 'headers': JSON.stringify(headers)}, function(data){
            $('span#status_code').text(data.status_code);
            $('span#request_time').text(data.request_time);
            $('textarea#response').text(JSON.stringify(data.response, null, 4))
            for(var key in data.res_h){
                var new_html = '<tr class="dam_res"><td>' + key + '</td><td>' + data.res_h[key] + '</td><tr>';
                $('table#res_h').find('tr').last().after(new_html);
            };
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
        if ($('span#status_code').text() != '200'){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("接口测试成功后才能保存！");
            $("button#send_alert").trigger("click");
            return
        }
    });
});