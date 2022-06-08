import time

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

users = []
channels = []
messages = {}

channels.append('canal1')
channels.append('canal2')

messages['canal1'] = [{'message': '¡Hola amigos!', 'user': 'admin', 'timestamp': '19:15, 25 Abril'}]
messages['canal2'] = [{'message': '¡Hola amigos!', 'user': 'admin', 'timestamp': '17:35, 25 Noviembre'}]


@app.route('/')
def index():
    return render_template('index.html', channels=channels)


def message_received():

    print('Message received')


@socketio.on('submit display')
def new_display(data):

    name = data['display_name']
    old_name = data['old_display']
    channel = data['current_chan']
    print('Display name ' + name + ' submitted')

    if name in users:
        print('Display name ' + name + ' rejected')
        emit('display taken', {'error': 'Este nombre de pantalla ya está en uso'}, callback=message_received())

    else:
        print('Display name ' + name + ' accepted')
        users.append(name)
        emit('display set', name, callback=message_received())
        emit('name changed', {'name': name, 'old_name': old_name}, room=channel, include_self=False)


@socketio.on('submit channel')
def new_channel(data):

    name = data['channel_name']
    print('Channel name ' + name + ' submitted')

    if name in channels:
        print('Channel name ' + name + ' rejected')
        emit('channel exists', {'error': 'Este nombre de canal ya existe'}, callback=message_received())

    else:
        print('Channel name ' + name + ' accepted')
        channels.append(name)
        messages[name] = []
        emit('Cnal creado', name, callback=message_received(), broadcast=True)


@socketio.on('join channel')
def join_channel(data):

    channel = data['channel']
    user = data['user']
    join_room(channel)

    if channel in channels:
        message_data = messages[channel]
        emit('get messages', message_data, callback=message_received())

    emit('usuario unido', {'user': user}, room=channel, include_self=False)


@socketio.on('leave channel')
def leave_channel(data):

    channel = data['channel']
    user = data['user']
    leave_room(channel)

    emit('usuario salio', {'user': user}, room=channel)


@socketio.on('send message')
def send_message(data):

    message = data['message']
    channel = data['channel']
    user = data['user']

    timestamp = time.localtime()
    timestamp = time.strftime("%H:%M, %d %B", timestamp)  

    new_message = {
        'message': message,
        'user': user,
        'timestamp': timestamp
    }

    messages[channel].append(new_message)

    if len(messages[channel]) > 100:
        messages[channel].pop(0)

    emit('Nuevo mensaje', new_message, room=channel)


@socketio.on('file upload')
def file_upload(data):

    emit('Archivo recibido', data, room=data['room'])


if __name__ == '__main__':
    socketio.run(app, debug=True)