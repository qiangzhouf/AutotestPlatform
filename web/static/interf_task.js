function refresh_task(){
    $.post('/interf_task', {'type': 'get_task', 'project': $('select#project').val()}, function(data){
        var l = data.task.length;
        $('table#task').find('tr.dam').remove();
        var tr = $('table#task').find('tr');
        if (l != 0){
            var html = '';
            for (i=0;i<l;i++){
                html += '<tr class="dam">';
                for (j=0;j<11;j++){
                    if (j==0){
                        html = html + '<td style="width:5%">'+i+'</td>';
                    }
                    else if (j==5){
                        if (data.task[i][j]==0){
                            html = html + '<td style="width:5%">未执行</td>';
                        }
                        else if (data.task[i][j]==1){
                            html = html + '<td style="width:5%">执行中</td>';
                        }
                        else if (data.task[i][j]==2){
                            html = html + '<td style="width:5%">已完成</td>';
                        }
                    }
                    else if (j==6){
                        html = html + '<td style="width:15%"><div class="progress progress-striped active"><div class="progress-bar" style="width: ' + data.task[i][j] + ';">' + data.task[i][j] + '</div></div></td>'
                    }
                    else if (j==10){
                        if (data.task[i][5]==1){
                            html += '<td style="width:20%"><button id="start" class="btn btn-success" disabled="disabled">启动</button>    '
                        }
                        else{
                            html += '<td style="width:20%"><button id="start" class="btn btn-success">启动</button>    '
                        };
                       html += '<button id="del" class="btn btn-danger">删除</button>    <button id="detail" class="btn btn-primary">详情</button></td>'; 
                    }
                    else{
                        if (7<=j<=9){
                            html = html + '<td style="width:5%">'+data.task[i][j]+'</td>';
                        }
                        else{
                            html = html + '<td style="width:10%">'+data.task[i][j]+'</td>';
                        };
                    };
                };
            };
            tr.after(html)
        };
    });
};


function tc(info, message){
    $("h4#myModalLabel").text(info);
    $("div.modal-body").text(message);
    $("button#send_alert").trigger("click"); 
};


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
            refresh_task()
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
            tc('提示', "请先选择好测试套！")
            return
        };
        if ($('input#task_name').val() == ''){
            tc('提示', "任务名不能为空！")
            return
        };
        $.post('/interf_task', {'type': 'new_task', 'name': $('input#task_name').val(), 'project': $('select#project').val(), 'suite': $('select#suite').val()}, function(data){
            if (data.code == 200){
                refresh_task()
                tc('提示', "任务新建成功！")
                $('input#task_name').val('')
            }
            else{
                tc('提示', data.message)
            };
        
        });
    });
    
    //删除任务
    $('table#task').on('click', 'button#del', function(){
        var s = $(this).parents('tr').find('td').eq(5).text();
        if (s == '执行中'){
            tc('错误', '任务正在执行中，无法删除！')
            return
        };
        var name = $(this).parents('tr').find('td').eq(1).text();
        $.post('/interf_task', {'type': 'del_task', 'name': name, 'project': $('select#project').val()}, function(data){
            if (data.code==200){
                refresh_task()
                tc('提示', '任务删除成功！')
            }
            else{
                tc('提示', '任务删除失败！')
            };
        });
    });
    
});