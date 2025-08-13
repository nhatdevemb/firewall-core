// Lắng nghe sự kiện nhấp vào phần tử để hiển thị popup
document.getElementById('activeRuleCategories').addEventListener('click', function (event) {
    const popupContainer = document.querySelector('.rule-popup-container');
    const ruleListPopup = document.getElementById('ruleListPopup');
    
    // Hiển thị popup khi nhấn vào activeRuleCategories
    popupContainer.style.display = 'flex'; 
    ruleListPopup.style.display = 'block'; // Hiển thị nội dung popup

    // Gọi API để lấy danh sách rules
    fetch('/api/rules/list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        const ruleList = document.getElementById('ruleList');
        ruleList.innerHTML = ''; // Xóa nội dung trước khi hiển thị danh sách mới

        // Lọc ra các file có đuôi .rules
        const rulesWithExtension = data.files.filter(file => file.endsWith('.rules'));

        // Hiển thị danh sách các file .rules trong popup
        rulesWithExtension.forEach(rule => {
            const ruleElement = document.createElement('div');
            ruleElement.textContent = rule;
            ruleElement.classList.add('rule-popup-item'); // Sử dụng lớp mới

            // Xử lý khi người dùng chọn một rule
            ruleElement.addEventListener('click', function () {
                document.getElementById('keyword').value = rule; // Hiển thị rule trong ô tìm kiếm
                hidePopup(); // Ẩn popup sau khi chọn rule

                // Gọi lại API tìm kiếm giống như code ban đầu bạn đã ghi nhớ
                fetch('/api/rules/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ keyword: rule }),
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

            ruleList.appendChild(ruleElement);
        });
    })
    .catch(error => {
        console.error('Error fetching rules:', error);
    });
});

// Hàm để ẩn popup
function hidePopup() {
    const popupContainer = document.querySelector('.rule-popup-container');
    popupContainer.style.display = 'none'; // Ẩn popup
}

// Đóng popup khi nhấn vào nút đóng
const closePopupButton = document.querySelector('.rule-popup-close'); // Thay đổi lớp để phù hợp
if (closePopupButton) {
    closePopupButton.addEventListener('click', function () {
        hidePopup();
    });
}

// Lắng nghe sự kiện nhấp vào toàn bộ tài liệu để ẩn popup khi nhấp ra ngoài
document.addEventListener('click', function (event) {
    const popupContainer = document.querySelector('.rule-popup-container');
    const activeCard = document.getElementById('activeRuleCategories');
    
    // Kiểm tra xem nhấp vào bên ngoài popup và card
    if (popupContainer.style.display === 'flex' && !popupContainer.contains(event.target) && !activeCard.contains(event.target)) {
        hidePopup(); // Ẩn popup nếu nhấp vào bên ngoài
    }
});
