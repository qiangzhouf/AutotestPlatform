$(function(){
    // 新增项目
    $('button#new_project').on('click',function(){
        var project = $('input#project_name').val();
        if (project == ''){
            $("h4#myModalLabel").text("错误");
            $("div.modal-body").text("项目名不能为空");
            $("button#send_alert").trigger("click");
            return
        }
        
        $.post('/project_m', {'type': 'add', 'project': project}, function(data){
            if (data.code==200){
                var project = $('input#project_name').val();
                var html = '<tr><td>'+project+'</td><td><input/></td><td><input/></td><td align="center"><button class="btn btn-primary" id="modify">修改</button><button class="btn btn-danger" id="delete">删除</button></td></tr>'
                $('input#project_name').val('');
                $('table').find('tr').last().after(html)
            }
            else{
                $("h4#myModalLabel").text("错误");
                $("div.modal-body").text(data.msg);
                $("button#send_alert").trigger("click");
            };
        });
    });
    
    // 删除项目
    $('table').on('click', 'button#delete', function(){
        var project = $(this).parents('tr').find('td').eq(0).text();
        var obj = $(this).parent().parent();
        $.post('/project_m', {'type': 'del', 'project': project}, function(data){
            if (data.code==200){
                obj.remove();
            }
            else{
                $("h4#myModalLabel").text("错误");
                $("div.modal-body").text(data.msg);
                $("button#send_alert").trigger("click");
            };
        });
    });
    
    // 修改
    $('table').on('click', 'button#modify', function(){
        var project = $(this).parents('tr').find('td').eq(0).text();
        var host = $(this).parents('tr').find('input').eq(0).val();
        var user_passwd = $(this).parents('tr').find('input').eq(1).val();
        var obj = $(this).parent().parent();
        $.post('/project_m', {'type': 'mod', 'project': project, 'host': host, 'user_passwd': user_passwd}, function(data){
            if (data.code!=200){
                $("h4#myModalLabel").text("错误");
                $("div.modal-body").text(data.msg);
                $("button#send_alert").trigger("click");
            };
        });
    });
    
    
});