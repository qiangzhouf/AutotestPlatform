$(function(){
    //选择项目后，动态加载测试套
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
    
    //新建任务
    $('button#new_task').on('click', function(){
        if ($('select#suite').val() == 'none'){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("请先选择好测试套！");
            $("button#send_alert").trigger("click");
            return
        };
        if ($('input#task_name').val() == ''){
            $("h4#myModalLabel").text("提示");
            $("div.modal-body").text("任务名不能为空！");
            $("button#send_alert").trigger("click");
            return
        };
        $.post('/interf_task', {'type': 'new_task', 'name': $('input#task_name').val(), 'project': $('select#project').val(), 'suite': $('select#suite').val()}, function(data){
            if (data.code == 200){
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text("任务新建成功！");
                $("button#send_alert").trigger("click"); 
                
            }
            else{
                $("h4#myModalLabel").text("提示");
                $("div.modal-body").text("任务新建失败！");
                $("button#send_alert").trigger("click");  
            };
        
        });
    });
    
});