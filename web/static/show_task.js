$(document).ready(function(){
    //建立websocket链接
    var websocket_url = 'http://' + document.domain + ':' + location.port + '/task_refresh';
    var socket = io.connect(websocket_url);

    //监听推送消息
    socket.on('rec_push',function(data){
        if (data.code == '200'){
            var s_msg = data.msg.replace(/\[/g,"").replace(/\]/g,"").replace(/\)/g,"").replace(/\ /g,"").replace("\(","");
            var array_msg = s_msg.split('(');
            for (var j=0;j<array_msg.length;j++){
                var array_task = array_msg[j].split(',');
                var tr = document.getElementById(array_task[0]);
                var inp = document.getElementById('status-'+array_task[0]);
                var tds = tr.getElementsByTagName("td");
                tds[5].innerHTML = array_task[5].replace(/\'/g,"");
                if (array_task[5] == '\'已完成\''){
                    inp.setAttribute("disabled", "disabled");
                    inp.setAttribute("value", "已完成");}
                var div = tds[6].getElementsByTagName("div");
                div[1].style = "width:" + array_task[6].replace(/\'/g,"");
                div[1].innerHTML = array_task[6].replace(/\'/g,"");;
                tds[8].innerHTML = array_task[8].replace(/\'/g,"");;
                tds[9].innerHTML = array_task[9].replace(/\'/g,"");
            }
        }
        else{
            alert('ERROR: ' + 'push server failed');
        }
    });

    //页面关闭时执行，关闭链接
    $(window).on('unload',function(){
        socket.emit('disconnect');
    });
});
