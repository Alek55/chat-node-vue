const socket = io();

Vue.component('chat-message', {
    props: ['message', 'user'],
    template: `
        <div class="message" :class="{'owner': message.id === user.id}">
            <div class="message-content z-depth-1">
                {{message.name}}: {{message.text}}
            </div>
        </div>
    `
});

new Vue({
    el: '#app',
    data: {
        message: '',
        messages: [],
        users: [],
        user: {
            name: '',
            room: ''
        }
    },
    methods: {
        sendMessage() {
            const message = {
                text: this.message,
                name: this.user.name,
                id: this.user.id
            };

            socket.emit('message:create', message, err => {
                if(err) console.error(err);
                else this.message = '';
            });
        },
        initializeConnection() {
            socket.on('users:update', users => {
                this.users = [...users];
            });

            socket.on('message:new', message => {
                this.messages.push(message);
                scrollToBottom(this.$refs.messages);
            });
            scrollToBottom(this.$refs.messages);
        }
    },
    created() { //вызывается после инициализации vue до метода mounted
        const params = window.location.search.split('&');
        const name = decodeURIComponent(params[0].split('=')[1].replace('+', ' '));
        const room = params[1].split('=')[1].replace('+', ' ');
        console.log('Имя', name);
        this.user = {name, room};
    },
    mounted() { //вызывается, когда весь html готов
        socket.emit('join', this.user, data => {
            if(typeof data === 'string') console.error(data); //если вернется ответ от сервера строчного типа, значит произошла ощибка
            else {
                this.user.id = data.userId;
                this.initializeConnection();
            }
        });
    }
});

function scrollToBottom(node) {
    setTimeout(() => {
        node.scrollTop = node.scrollHeight;
    });
}