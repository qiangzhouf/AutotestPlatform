//页面加载时运行
$(function(){
    //选择项目时，动态加载该项目下的所有测试套
    $('select#project').change(function(){
        if ($(this).val() != 'none'){
            $.post('/suite', {'type': 'get_suite', 'project': $(this).val()}, function(data){
                var obj = $('select#suite');
                obj.empty();
                var html = '<option value="none">请选择测试套</option>';
                for (i=0;i<data.suite.length;i++){
                    html = html + '<option value="' + data.suite[i] + '">' + data.suite[i] + '</option>';
                };
                obj.html(html);
            });
        }
        else{
            $('select#suite').empty();
            $('select#suite').html('<option value="none">请选择测试套</option>');
            $('div#suite_data').hide();
        };
    });
    
    $('select#project').get(0).selectedIndex=1
    $("select#project").trigger("change"); 
    
    //选择查看测试套时，加载项目所有
    $('select#suite').change(function(){
        if ($(this).val() != 'none'){
            $('div#suite_data').show();
            $('div#suite_data').find('tr.dam').remove();
            //查询该项目的所有场景
            $.post('/suite', {'type': 'get_scene', 'suite': $(this).val(), 'project': $('select#project').val()}, function(data){
                var html = ''
                for (i=0;i<data.all_scene.length;i++){
                    html = html + '<tr class="dam"><td>' + data.all_scene[i] + '</td><td align="center"><button style="padding:1px 12px" class="btn btn-success" id="add">>></button></td></tr>';
                };
                $('table#all_scene').find('tr').last().after(html);
                html = '';
                for (i=0;i<data.scene.length;i++){
                    html = html + '<tr class="dam"><td>' + data.scene[i] + '</td><td align="center"><button style="padding:1px 12px" class="btn btn-success" id="del"><<</button></td></tr>';
                };
                $('table#my_scene').find('tr').last().after(html);
            });
        }
        else{
            $('div#suite_data').find('tr.dam').remove();
            $('div#suite_data').hide();
        };
    });
    
    //场景的添加
    $('table#all_scene').on('click', 'button#add', function(){
        var tr = $(this).parents('tr');
        var scene = tr.find('td').eq(0).text();
        tr.remove();
        var html = '<tr class="dam"><td>' + scene + '</td><td align="center"><button class="btn btn-success" id="del" style="padding:1px 12px"><<</button></td></tr>';
        $('table#my_scene').find('tr').last().after(html)
    });
    
    //场景的删除
    $('table#my_scene').on('click', 'button#del', function(){
        var tr = $(this).parents('tr');
        var scene = tr.find('td').eq(0).text();
        tr.remove();
        var html = '<tr class="dam"><td>' + scene + '</td><td align="center"><button class="btn btn-success" id="add" style="padding:1px 12px">>></button></td></tr>';
        $('table#all_scene').find('tr').last().after(html)
    });
    
    //测试套修改
    $('button#modify').on('click', function(){
        if ($('select#suite').val()=='none'){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请选择要修改的测试套！");
            $("button#send_alert").trigger("click");
            return
        };
        var trs = $('table#my_scene').find('tr.dam');
        var scene_data = []
        for (i=0;i<trs.length;i++){
            scene_data[i] = trs.eq(i).find('td').eq(0).text();
        };
        $.post('/suite', {'type': 'modify_suite', 'data': JSON.stringify(scene_data), 'name': $('select#suite').val(), 'project': $('select#project').val()}, function(data){
            if (data.code == 200){
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text(data.message);
                $("button#send_alert").trigger("click");
            }
            else{
                $("h4#myModalLabel").text("错误");
                $("div.modal-body").text("修改测试套失败！");
                $("button#send_alert").trigger("click");
            };
        });
        
    });
    
    // 新增测试套
    $('button#new_suite').on('click', function(){
        var project = $('select#project').val();
        var suite = $('input#suite_name').val();
        if (project=='' || suite==''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请选择项目和输入测试套名");
            $("button#send_alert").trigger("click");
            return
        };
        $.post('/suite', {'type': 'new_suite', 'suite': suite, 'project': project}, function(data){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text(data.msg);
            $("button#send_alert").trigger("click");
            if (data.msg=="新增测试套成功"){
                $('select#suite').append('<option value="'+suite+'">'+suite+'</option>');
                $('select#suite').val(suite);
                $('select#suite').trigger("change");
                $('input#suite_name').val('')
            }
        });
    });
    
    // 删除测试套
    $('button#del_s').on('click', function(){
        var project = $('select#project').val();
        var suite = $('select#suite').val();
        if (project=='' || suite==''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请选择要删除的测试套");
            $("button#send_alert").trigger("click");
            return
        };
        $.post('/suite', {'type': 'del_suite', 'suite': suite, 'project': project}, function(data){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text(data.msg);
            $("button#send_alert").trigger("click");
            if (data.msg=="删除成功"){
                $('select#suite option[value="'+suite+'"]').remove();
                $('select#suite').get(0).selectedIndex=0
                $('select#suite').trigger("change");
            }
        });
    });
});