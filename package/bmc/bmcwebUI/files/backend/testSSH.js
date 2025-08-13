const { executeCommand } = require('./commands/sshExecutor');

const host = '192.168.2.151'; // Thay bằng địa chỉ IP thực tế
const username = 'root';
const password = 'admin123;'; // Thay bằng mật khẩu thực tế
const command = 'ls -1 /etc/suricata/rules | wc -l';

executeCommand(host, username, password, command)
    .then(result => {
        console.log('Kết quả lệnh:', result); 
    })
    .catch(error => {
        console.error('Lỗi khi thực hiện lệnh:', error);
    });
