document.addEventListener('DOMContentLoaded', function() {

    if (localStorage.getItem('display')) {
  
      document.getElementById('user_display').innerHTML = localStorage.getItem('display');
      document.getElementById('set_display').innerHTML = 'Cambiar la visualización';
  
    } else {
  
      document.getElementById('channel_info').style.pointerEvents = 'none';
      $('#modalDisplayForm').modal({
        show: true,
        backdrop: 'static',
        keyboard: false
      });
  
      setTimeout(function (){
        $('#input_display').focus();
      }, 1000);
  
    };
  
    const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
  
    socket.on('connect', function() {
  
      console.log('User connected');
      console.log('ID: ' + socket.id);
  
      if (localStorage.getItem('channel')) {
  
        const channel = localStorage.getItem('channel');
        console.log(channel);
        const user = localStorage.getItem('display');
        socket.emit('join channel', {'channel': channel, 'user': user});
  
      } else {
  
        document.getElementById('channel_view').style.pointerEvents = 'none';
      };
  
    });
  
    document.querySelector('#submit_display').onclick = function() {
  
      document.getElementById('display_error').innerHTML = '';
      const display_name = document.querySelector('#input_display').value;
      const old_display = localStorage.getItem('display');
  
      if (display_name !== '') {
  
        if (display_name == localStorage.getItem('display')) {
  
          document.getElementById('display_error').innerHTML = 'You are already using this name <a href="javascript:void(0);" id="cancel_change">(cancel)</a>';
          document.getElementById('input_display').value = '';
          document.querySelector('#cancel_change').onclick = function() {
            $('#modalDisplayForm').modal('hide');
          };
  
        } else {
  
          const current_chan = localStorage.getItem('channel');
          socket.emit('submit display', {'old_display': old_display, 'display_name': display_name, 'current_chan': current_chan});
          document.getElementById('input_display').value = '';
        };
      };
  
    };
  
    document.querySelector('#set_display').onclick = function() {
  
  
      document.getElementById('display_error').innerHTML = '';
  
      setTimeout(function (){
          $('#input_display').focus();
      }, 1000);
  
    };
  
    socket.on('display set', function(data) {
  
      console.log('Display name accepted');
      localStorage.setItem('display', data);
      console.log('Display saved: ' + localStorage.getItem('display'));
      $('#modalDisplayForm').modal('hide');
      document.getElementById('user_display').innerHTML = localStorage.getItem('display');
      document.getElementById('set_display').innerHTML = 'Cambiar la visualización';
      document.getElementById('channel_info').style.pointerEvents = 'auto';
  
    });
  
    socket.on('display taken', function(data) {
  
      console.log(data);
      document.getElementById('display_error').innerHTML = data.error;
  
    });
  
    document.querySelector('#submit_channel').onclick = function() {
  
      document.getElementById('channel_error').innerHTML = '';
      const channel_name = document.querySelector('#input_channel').value;
  
      if (channel_name !== '') {
  
        socket.emit('submit channel', {'channel_name': channel_name});
        document.getElementById('input_channel').value = '';
      };
  
    };
  
    socket.on('channel created', function(data) {
  
      console.log(data);
      const p = document.createElement('p');
      p.innerHTML = data;
      p.setAttribute('class', 'join');
      p.setAttribute('data-chan', data);
      document.querySelector('#channel_list').append(p);
  
    });
  
    socket.on('channel exists', function(data) {
  
      console.log(data);
      document.getElementById('channel_error').innerHTML = data.error;
  
    });
  
    document.getElementById('channel_list').addEventListener('click', function(event) {
  
      const target = event.target;
      const channel = target.dataset.chan;
      const current_chan = localStorage.getItem('channel');
      const user = localStorage.getItem('display');
  
      if (channel !== current_chan && target.nodeName == 'P') {
  
        if (localStorage.getItem('channel')) {
          socket.emit('leave channel', {'channel': current_chan, 'user': user});
        };
  
        localStorage.setItem('channel', channel);
        console.log(channel);
        document.getElementById('messages').innerHTML = '';
        document.getElementById('channel_name').innerHTML = localStorage.getItem('channel');
        socket.emit('join channel', {'channel': channel, 'user': user});
        document.getElementById('channel_view').style.pointerEvents = 'auto';
      };
  
    });
  
    socket.on('user joined', function(data) {
  
      console.log(data);
      const join_message = document.createElement('div');
      join_message.setAttribute('class', 'announce');
      join_message.innerHTML = data.user + ' has joined the chat!';
      document.querySelector('#messages').append(join_message);
  
    });
  
    socket.on('user left', function(data) {
  
      console.log(data);
      const leave_message = document.createElement('div');
      leave_message.setAttribute('class', 'announce');
      leave_message.innerHTML = data.user + ' left the chat';
      document.querySelector('#messages').append(leave_message);
  
    });
  
    socket.on('name changed', function(data) {
  
      console.log(data);
      const change_message = document.createElement('div');
      change_message.setAttribute('class', 'announce');
      change_message.innerHTML = data.old_name + ' changed their display name to ' + data.name;
      document.querySelector('#messages').append(change_message);
  
    });
  
    document.querySelector('#send_message').onclick = function() {
  
      const message = document.querySelector('#input_message').value;
  
      if (message !== '') {
  
        const channel = localStorage.getItem('channel');
        const user = localStorage.getItem('display');
        socket.emit('send message', {'message': message, 'channel': channel, 'user': user});
        document.getElementById('input_message').value = '';
      };
  
    };
  
    socket.on('get messages', function(data) {
  
      console.log(data);
      document.getElementById('channel_name').innerHTML = localStorage.getItem('channel');
  
      for (let i = 0; i < data.length; i++) {
  
        const chat_message = document.createElement('div');
        if (data[i].user == localStorage.getItem('display')) {
          chat_message.setAttribute('class', 'my_message');
        };
        chat_message.innerHTML = '<p><span class="user">' + data[i].user + '  </span><span class="stamp">' + data[i].timestamp + '</span></p><p><span class="msg">' + data[i].message + '</span></p>';
        document.querySelector('#messages').append(chat_message);
      };
  
    });
  
    socket.on('new message', function(data) {
  
      console.log(data);
      const new_msg = document.createElement('div');
      if (data.user == localStorage.getItem('display')) {
        new_msg.setAttribute('class', 'my_message');
      };
      new_msg.innerHTML = '<p><span class="user">' + data.user + '  </span><span class="stamp">' + data.timestamp + '</span></p><p><span class="msg">' + data.message + '</span></p>';
      document.querySelector('#messages').append(new_msg);
  
    });
  
    document.getElementById('file_input').addEventListener('change', function(event) {
  
      const file_input = document.getElementById('file_input');
      const file = file_input.files[0];
  
      if (file.size > 10000000) {
  
        alert("Maximum file size is 10MB");
        document.getElementById('file_input').value = '';
  
      } else {
  
        const reader = new FileReader();
        const size = file.size;
        console.log(size);
        const slice = file.slice(0, size);
        console.log(slice);
        reader.readAsArrayBuffer(slice);
  
        reader.onload = function(event) {
  
          const file_data = reader.result;
          console.log(file_data);
          socket.emit('file upload', {'sender': localStorage.getItem('display'), 'room': localStorage.getItem('channel'), 'name': file.name, 'type': file.type, 'size': file.size, 'data': file_data});
        };
      };
  
    });
  
    socket.on('file received', function(data) {
  
      console.log(data);
      const received_file = new Blob([data.data]);
      console.log(received_file);
  
      const dl_link = document.createElement('a');
      const dl_url = window.URL.createObjectURL(received_file);
      dl_link.setAttribute('href', dl_url);
      dl_link.setAttribute('download', data.name);
      dl_link.innerHTML = 'download';
  
      const file_share = document.createElement('div');
      file_share.innerHTML = data.sender + ' shared a file - "' + data.name + '" - ';
  
      if (data.sender == localStorage.getItem('display')) {
        file_share.setAttribute('class', 'my_message');
        document.getElementById('file_input').value = '';
      };
  
      file_share.appendChild(dl_link);
      document.querySelector('#messages').append(file_share);
  
    });
  
  });