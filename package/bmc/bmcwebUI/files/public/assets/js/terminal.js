const term = new Terminal({
  cursorBlink: true,  // Hiệu ứng nhấp nháy con trỏ
  theme: {
      background: '#1e1e1e',   // Màu nền terminal (xám đen)
      foreground: '#c5c8c6',   // Màu chữ mặc định
      cursor: '#f8f8f2',       // Màu con trỏ
      selection: 'rgba(255, 255, 255, 0.3)',  // Màu khi bôi đen
      black: '#1e1e1e',
      red: '#f92672',
      green: '#a6e22e',
      yellow: '#e6db74',
      blue: '#66d9ef',
      magenta: '#ae81ff',
      cyan: '#66d9ef',
      white: '#f8f8f2',
      brightBlack: '#75715e',
      brightRed: '#f92672',
      brightGreen: '#a6e22e',
      brightYellow: '#e6db74',
      brightBlue: '#66d9ef',
      brightMagenta: '#ae81ff',
      brightCyan: '#66d9ef',
      brightWhite: '#f8f8f2'
  }
});

// Mở terminal trong div có id là 'terminal'
term.open(document.getElementById('terminal'));

// Hàm để cập nhật kích thước của terminal
function resizeTerminal() {
  const terminalContainer = document.getElementById('terminal');
  const { width, height } = terminalContainer.getBoundingClientRect();

  // Giả định mỗi cột có chiều rộng là 10px và mỗi dòng có chiều cao là 20px
  const columnWidth = 10; // Kích thước cột
  const rowHeight = 20;   // Kích thước dòng

  const cols = Math.floor(width / columnWidth); // Tính số cột
  const rows = Math.floor(height / rowHeight);   // Tính số dòng

  console.log(`Width: ${width}, Height: ${height}, Columns: ${cols}, Rows: ${rows}`); // Kiểm tra kích thước
  term.resize(cols, rows); // Đặt số cột và số dòng cho terminal
}

// Kết nối WebSocket
const socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);

// Nhận dữ liệu từ WebSocket và hiển thị với màu sắc dựa trên mã ANSI
socket.onmessage = (event) => {
  let data = event.data;

  // Thay đổi màu cho cụm "root@t4240rdb:"
  data = data.replace(/root@t4240rdb:/g, '\x1b[38;5;208mroot@t4240rdb:\x1b[0m'); // Mã ANSI cho màu cam

  term.write(data);  // Ghi dữ liệu vào terminal
  term.scrollToBottom(); // Cuộn terminal xuống dưới cùng để hiển thị con trỏ
};

// Gửi lệnh từ người dùng tới server qua WebSocket
term.onData((data) => {
  socket.send(data);
  term.scrollToBottom(); // Cuộn terminal xuống dưới cùng sau khi gửi dữ liệu
});

// Gọi hàm resizeTerminal khi cửa sổ được thay đổi kích thước
window.addEventListener('resize', resizeTerminal);

// Gọi hàm resizeTerminal ngay khi khởi động để điều chỉnh kích thước ban đầu
resizeTerminal();
