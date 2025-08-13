// backend/server.js

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const diff = require('diff');
const { exec, execFile } = require('child_process');
const { spawn } = require('child_process');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const { Server } = require('ws');
const sessionStore = new session.MemoryStore();
const https = require('https');

require('dotenv').config();

const app = express();
const port = 1234;

app.use(session({
    store: sessionStore,
    secret: 'your_super_secret_key',
    name: 'connect.sid',
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: { 
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function getClientIP(req) {
    let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.connection?.remoteAddress
        || req.socket?.remoteAddress
        || req.ip
        || '';
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
    if (ip === '::1') ip = '127.0.0.1';
    return ip;
}

// --- Middleware kiểm tra đăng nhập ---
function requireLogin(req, res, next) {
    // Cho phép truy cập /login, /logout, file tĩnh, và một số API system
    if (
        req.path === '/login' ||
        req.path === '/logout' ||
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/css/') ||
        req.path.startsWith('/js/') ||
        req.path.startsWith('/fonts/') ||
        req.path.startsWith('/images/') ||
        req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i) ||
        req.path.startsWith('/api/system/') // Cho phép API system không cần login
    ) {
        return next();
    }
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    // Nếu là API, trả về lỗi
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    // Nếu là trang web, chuyển về login
    return res.redirect('/login');
}
app.use(requireLogin);

// --- Middleware log IP chỉ log nếu đã đăng nhập ---
const recentIPs = {};
app.use((req, res, next) => {
    if (!req.session || !req.session.isAuthenticated) return next();
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i)) return next();
    const ip = getClientIP(req);
    if (!recentIPs[ip]) recentIPs[ip] = { count: 0, lastAccess: Date.now() };
    recentIPs[ip].count++;
    recentIPs[ip].lastAccess = Date.now();
    next();
});

// --- Middleware log tất cả API calls ---
app.use((req, res, next) => {
    // Chỉ log API calls, không log static files
    if (req.path.startsWith('/api/') && !req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i)) {
        appendIPLog({ timestamp: Date.now(), ip: getClientIP(req), action: 'request' });
    }
    next();
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html', 'login.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html', 'index.html'));
});

app.get('/logout', (req, res) => {
    if (req.session && req.session.isAuthenticated) {
        appendIPLog({ timestamp: Date.now(), ip: getClientIP(req), action: 'logout' });
    }
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/index.html');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.post('/add-firewall-rule', (req, res) => {
    const { rule } = req.body;
    if (!rule) {
        return res.status(400).json({ error: "Missing rule parameter" });
    }
    const command = `bash ./script/add-iptables-rule.sh "${rule}"`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: "Unable to add rule" });
        }
        try {
            const result = JSON.parse(stdout.trim());
            res.json({ success: true, data: result });
        } catch (parseError) {
            return res.status(500).json({ error: "Error parsing script output", rawOutput: stdout.trim() });
        }
    });
});

app.post('/delete-firewall-rule', (req, res) => {
    const { tableName, chainName, ruleIndexes } = req.body;
    if (!tableName || !chainName || !ruleIndexes || !Array.isArray(ruleIndexes)) {
        return res.status(400).json({ error: "Thiếu thông tin cần thiết" });
    }
    const indexes = ruleIndexes.join(' ');
    const command = `bash ./script/fixiptables.sh ${tableName} ${chainName} ${indexes}`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể xóa rule' });
        }
        try {
            const result = JSON.parse(stdout.trim());
            res.json({ success: true, data: result });
        } catch (parseError) {
            return res.status(500).json({ error: 'Lỗi phân tích cú pháp kết quả từ script' });
        }
    });
});

app.post('/get-firewall-from-table', (req, res) => {
    const { tableName } = req.body;
    if (!tableName) {
        return res.status(400).json({ error: "Thiếu tên bảng" });
    }
    exec(`bash ./script/getfirewall.sh ${tableName}`, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể lấy thông tin firewall' });
        }
        try {
            const jsonData = JSON.parse(stdout.trim());
            res.json(jsonData);
        } catch (parseError) {
            return res.status(500).json({ error: 'Lỗi phân tích cú pháp kết quả từ script' });
        }
    });
});

app.post('/get-mac-info', (req, res) => {
    const ip = req.body.ip;
    if (!ip) {
        return res.status(400).json({ error: "Vui lòng nhập địa chỉ IP" });
    }
    exec(`bash ./script/quaratine.sh ${ip}`, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: 'Không tìm thấy địa chỉ MAC cho IP đã nhập!' });
        }
        try {
            const jsonData = JSON.parse(stdout.trim());
            res.json(jsonData);
        } catch (parseError) {
            return res.status(500).json({ error: 'Lỗi phân tích cú pháp kết quả từ script' });
        }
    });
});

app.post('/update-mac-status', (req, res) => {
    const { macAddress, action } = req.body;
    if (!macAddress || !action) {
        return res.status(400).json({ error: "Thiếu địa chỉ MAC hoặc trạng thái" });
    }
    if (action !== "ACCEPT" && action !== "DROP") {
        return res.status(400).json({ error: "Hành động không hợp lệ. Chỉ chấp nhận ACCEPT hoặc DROP" });
    }
    exec(`bash ./script/quaratine.sh ${macAddress} ${action}`, (err, stdout, stderr) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể cập nhật trạng thái' });
        }
        try {
            const jsonData = JSON.parse(stdout.trim());
            res.json(jsonData);
        } catch (parseError) {
            return res.status(500).json({ error: 'Lỗi phân tích cú pháp kết quả từ script' });
        }
    });
});

// Local admin login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        req.session.isAuthenticated = true;
        // Ghi log login
        appendIPLog({ timestamp: Date.now(), ip: getClientIP(req), action: 'login' });
        res.json({ message: 'Login successful!' });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

// Dummy device info endpoint for frontend compatibility
app.get('/get-current-device', (req, res) => {
    // Return a static local device info object
    res.json({
        success: true,
        data: {
            device_name: 'Local Firewall',
            device_ip: '127.0.0.1',
            device_user_name: 'admin',
            device_password: 'admin' // Do not expose in production
        }
    });
});

// In-memory storage for new requests and logs (dummy for now)
let macRequests = [];
let userRequests = [];

// Return the count of new MAC requests
app.get('/api/firewall/new-requests/mac', (req, res) => {
    res.json({ count: macRequests.length });
});

// Return the count of new User requests
app.get('/api/firewall/new-requests/username', (req, res) => {
    res.json({ count: userRequests.length });
});

// Return the list of MAC requests (for logs)
app.get('/api/firewall/logs/mac', (req, res) => {
    res.json({ logs: macRequests });
});

// Return the list of User requests (for logs)
app.get('/api/firewall/logs/username', (req, res) => {
    res.json({ logs: userRequests });
});

function runSystemScript(scriptName, args = [], res) {
    const scriptPath = path.join(__dirname, 'scripts/system', scriptName);
    // Sử dụng exec để gọi qua bash, không cần chmod +x cho script
    const argString = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
    const command = `bash '${scriptPath}' ${argString}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        try {
            res.json(JSON.parse(stdout));
        } catch (e) {
            res.status(500).json({ error: 'Script output is not valid JSON', raw: stdout });
        }
    });
}

// RAM
app.get('/api/system/ram', (req, res) => {
    runSystemScript('get_ram.sh', [], res);
});
// CPU
app.get('/api/system/cpu', (req, res) => {
    runSystemScript('get_cpu.sh', [], res);
});
// SWAP
app.get('/api/system/swap', (req, res) => {
    runSystemScript('get_swap.sh', [], res);
});
// DISK
app.get('/api/system/disk', (req, res) => {
    runSystemScript('get_disk.sh', [], res);
});
// UPTIME
app.get('/api/system/uptime', (req, res) => {
    runSystemScript('get_uptime.sh', [], res);
});
// HOSTNAME
app.get('/api/system/hostname', (req, res) => {
    runSystemScript('get_hostname.sh', [], res);
});
// LOADAVG
app.get('/api/system/loadavg', (req, res) => {
    runSystemScript('get_loadavg.sh', [], res);
});

// CPU temperature endpoint
app.get('/api/system/tempCPU', (req, res) => {
    const { exec } = require('child_process');
    exec("cat /sys/class/thermal/thermal_zone0/temp", (err, stdout1) => {
        let core1 = stdout1 ? (parseInt(stdout1) / 1000).toFixed(1) + '°C' : 'N/A';
        exec("cat /sys/class/thermal/thermal_zone1/temp", (err, stdout2) => {
            let core2 = stdout2 ? (parseInt(stdout2) / 1000).toFixed(1) + '°C' : 'N/A';
            res.json({ core1, core2 });
        });
    });
});

// Endpoint top IPs theo số lần gọi API (chỉ tính IP đã login thành công)
app.get('/api/system/top-ips', (req, res) => {
    let logs = [];
    try {
        if (fs.existsSync(IPLOG_FILE)) {
            logs = JSON.parse(fs.readFileSync(IPLOG_FILE));
        }
    } catch {}
    // Chỉ lấy 7 ngày gần nhất
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    logs = logs.filter(e => e.timestamp >= weekAgo);
    // Gom nhóm theo IP, chỉ tính action 'request'
    const ipMap = {};
    logs.forEach(e => {
        if (e.action === 'request') {
            if (!ipMap[e.ip]) ipMap[e.ip] = 0;
            ipMap[e.ip]++;
        }
    });
    // Chuyển thành mảng và sắp xếp
    const ipStats = Object.entries(ipMap).map(([ip, count]) => ({ ip, count }));
    ipStats.sort((a, b) => b.count - a.count);
    const top = ipStats.slice(0, 5);
    res.json({ ips: top });
});

// TIME (ngày giờ hiện tại)
app.get('/api/system/time', (req, res) => {
    runSystemScript('get_time.sh', [], res);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const IPLOG_FILE = path.join(__dirname, 'iplog.json');

// Tự động tạo file log nếu chưa có và đảm bảo quyền ghi
if (!fs.existsSync(IPLOG_FILE)) {
    try {
        fs.writeFileSync(IPLOG_FILE, '[]');
        // Đảm bảo file có quyền ghi cho user hiện tại
        const { exec } = require('child_process');
        exec(`chown ${process.env.USER || 'root'}:${process.env.USER || 'root'} "${IPLOG_FILE}"`, (err) => {
            if (err) console.log('Could not change file ownership, but file should still be writable');
        });
        console.log('Created iplog.json file');
    } catch (error) {
        console.error('Could not create iplog.json:', error.message);
    }
}

function appendIPLog(entry) {
    let logs = [];
    try {
        if (fs.existsSync(IPLOG_FILE)) {
            logs = JSON.parse(fs.readFileSync(IPLOG_FILE));
        }
    } catch {}
    logs.push(entry);
    // Giữ tối đa 7 ngày gần nhất
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    logs = logs.filter(e => e.timestamp >= weekAgo);
    fs.writeFileSync(IPLOG_FILE, JSON.stringify(logs));
}

