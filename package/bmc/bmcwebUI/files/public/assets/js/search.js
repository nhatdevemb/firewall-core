// Tham chiếu đến nút tìm kiếm và phần chứa kết quả
const searchBtn = document.getElementById('searchBtn');
const resultContainer = document.getElementById('rule-section');

// Kiểm tra trạng thái cờ trong localStorage để quyết định có ẩn bảng hay không
document.addEventListener('DOMContentLoaded', function () {
    const loadFlag = localStorage.getItem('loadFlag');

    // Nếu cờ là 'firstLoad', ẩn bảng
    if (loadFlag === 'firstLoad') {
        resultContainer.style.display = 'none'; // Ẩn bảng lần đầu tiên

        // Cập nhật cờ để không ẩn bảng trong các lần sau
        localStorage.setItem('loadFlag', 'subsequentLoads');
    } else {
        resultContainer.style.display = 'block'; // Hiển thị bảng cho các lần sau
    }
});

// Thêm sự kiện click cho nút tìm kiếm
searchBtn.addEventListener('click', function() {
    // Lấy giá trị từ ô input
    const keyword = document.getElementById('keyword').value;

    // Kiểm tra nếu ô input không rỗng
    if (keyword) {
        // Gọi hàm performSearch để xử lý tìm kiếm và cập nhật kết quả trực tiếp
        performSearch(keyword);
    } else {
        alert('Vui lòng nhập từ khóa để tìm kiếm.'); // Thông báo nếu ô input rỗng
    }
});

// Hàm chung để thực hiện tìm kiếm
function performSearch(keyword) {
    keyword = keyword || document.getElementById('keyword').value.trim(); // Lấy giá trị nhập vào và loại bỏ khoảng trắng

    if (keyword.length === 0) {
        return; // Nếu không có từ khóa, không làm gì cả
    }

    // Gửi yêu cầu xác minh từ khóa và thực thi lệnh
    fetch('/api/rules/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.files && data.files.includes(keyword)) {
            executeCatCommand(keyword); // Thực thi lệnh cat nếu từ khóa chính xác
            document.getElementById('error-message').style.display = 'none'; // Ẩn thông báo lỗi

            // Hiển thị bảng sau khi tìm kiếm thành công
            resultContainer.style.display = 'block'; // Hiển thị bảng khi tìm kiếm thành công
        } else {
            showErrorMessage('Nhóm Rules không tồn tại'); // Hiển thị thông báo lỗi
        }
    })
    .catch(error => {
        console.error('Error verifying rules:', error);
        showErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.'); // Hiển thị thông báo lỗi chung nếu có vấn đề
    });
}
