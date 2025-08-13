// Lắng nghe sự kiện nhấp chuột trên toàn bộ document
document.addEventListener('click', function (event) {
    const suggestionBox = document.getElementById('suggestion-box');

    // Kiểm tra xem nhấp chuột có diễn ra bên trong suggestionBox không
    if (!suggestionBox.contains(event.target) && event.target.id !== 'keyword') {
        hideSuggestionBox(); // Ẩn suggestion box bằng hàm
    }
});

// Lắng nghe sự kiện nhập trên input tìm kiếm
document.getElementById('keyword').addEventListener('input', function () {
    const keyword = this.value.trim(); // Lấy giá trị nhập vào và loại bỏ khoảng trắng

    // Chỉ gửi yêu cầu nếu có từ khóa
    if (keyword.length === 0) {
        hideSuggestionBox(); // Ẩn suggestion box nếu không có từ khóa
        return;
    }

    // Gửi yêu cầu tìm kiếm khi người dùng nhập từ khóa
    fetch('/api/rules/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword }),
    })
    .then(response => response.json())
    .then(data => {
        const suggestionBox = document.getElementById('suggestion-box');
        suggestionBox.innerHTML = ''; // Làm rỗng nội dung trước khi cập nhật

        // Hiển thị danh sách các file đề xuất
        if (data.files && data.files.length > 0) {
            suggestionBox.style.display = 'block'; // Hiện bảng đề xuất
            data.files.forEach(file => {
                const fileElement = document.createElement('div');
                fileElement.textContent = file;
                fileElement.classList.add('suggestion-item');
                
                // Khi người dùng chọn một file
                fileElement.addEventListener('click', function () {
                    executeCatCommand(file); // Thực thi lệnh cat khi chọn file
                    document.getElementById('keyword').value = file; // Hiển thị tên rule đầy đủ ở ô tìm kiếm
                    hideSuggestionBox(); // Ẩn suggestion box sau khi chọn
                });

                suggestionBox.appendChild(fileElement);
            });
        } else {
            hideSuggestionBox(); // Ẩn bảng đề xuất nếu không có kết quả
        }
    })
    .catch(error => {
        console.error('Error searching rules:', error);
        hideSuggestionBox(); // Ẩn bảng đề xuất nếu có lỗi
    });
});

// Hàm để ẩn suggestion box
function hideSuggestionBox() {
    const suggestionBox = document.getElementById('suggestion-box');
    suggestionBox.innerHTML = ''; // Làm rỗng nội dung
    suggestionBox.style.display = 'none'; // Ẩn suggestion box
}

// Hàm để thực thi lệnh cat rule.rules > /tmp/xemrule.rules
function executeCatCommand(filename) {
    fetch(`/api/rules/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: filename })
    })
    .then(response => response.json())
    .then(data => {
        // Không hiển thị thông báo về kết quả lệnh cat
        // Chỉ cần làm mới nội dung của iframe
        refreshIframe();
    })
    .catch(error => {
        console.error('Error executing command:', error);
    });
}

// Hàm để làm mới nội dung của iframe
function refreshIframe() {
    const iframe = document.getElementById('contentFrame');
    iframe.src = iframe.src; // Làm mới iframe
}
