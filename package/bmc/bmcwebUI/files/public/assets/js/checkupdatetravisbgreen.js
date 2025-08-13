document.addEventListener('DOMContentLoaded', () => {
    const checkUpdateButton = document.getElementById('checkUpdate4');
    const notificationBar = document.getElementById('notification-bar4');
    const loader = document.getElementById('loader4');
    const downloadUpdateButton = document.getElementById('downloadUpdate4');
    const importUpdateButton = document.getElementById('importUpdateDevice4');

    if (checkUpdateButton) {
        checkUpdateButton.addEventListener('click', async () => {
            // Hiển thị loader và ẩn thông báo
            loader.style.display = 'block';
            notificationBar.style.display = 'none';

            try {
                // Gửi yêu cầu kiểm tra cập nhật
                const response = await fetch('/api/check-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ feedUrl: 'https://raw.githubusercontent.com/travisbgreen/hunting-rules/master/hunting.rules' }),
                });

                if (!response.ok) {
                    throw new Error(`Lỗi từ server: ${response.statusText}`);
                }

                const data = await response.json();

                // Ẩn loader sau khi kiểm tra
                loader.style.display = 'none';

                if (data.updateAvailable) {
                    // Nếu có bản cập nhật mới, enable các nút
                    notificationBar.innerHTML = `<span class="update-available">Có bản cập nhật mới</span>`;
                    notificationBar.style.display = 'block';
                    notificationBar.classList.add('update-available-blink');
                    notificationBar.style.color = 'white';
                    notificationBar.style.backgroundColor = '#4CAF50'; // Màu nền xanh

                    // Enable các nút tải và chọn file
                    downloadUpdateButton.disabled = false;
                    importUpdateButton.disabled = false;

                    // Lắng nghe sự kiện nhấn vào notification bar để hiển thị chi tiết
                    notificationBar.addEventListener('click', () => {
                        // Hiển thị chi tiết sự khác biệt trong popup
                        showDifferencesPopup(data.differences);
                    });
                } else {
                    // Nếu không có bản cập nhật mới
                    notificationBar.innerHTML = `<span class="no-update-available">Không có bản cập nhật mới</span>`;
                    notificationBar.style.display = 'block';
                    notificationBar.classList.remove('update-available-blink');
                    notificationBar.style.backgroundColor = '#e67e22'; // Nền cam
                    notificationBar.style.color = 'white';

                    // Disable các nút
                    downloadUpdateButton.disabled = true;
                    importUpdateButton.disabled = true;
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra cập nhật:', error);
                loader.style.display = 'none';
                notificationBar.innerHTML = `<span class="error-message">Lỗi khi kiểm tra bản cập nhật: ${error.message}</span>`;
                notificationBar.style.display = 'block';
                notificationBar.style.backgroundColor = '#e74c3c'; // Nền đỏ
                notificationBar.style.color = 'white';

                // Disable các nút
                downloadUpdateButton.disabled = true;
                importUpdateButton.disabled = true;
            }
        });
    }
});

// Hàm hiển thị popup với chi tiết sự khác biệt
function showDifferencesPopup(differences) {
    const popupWindow = window.open(
        '',
        'DifferencesPopup',
        'width=800,height=600,scrollbars=yes'
    );

    if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
        alert('Cửa sổ popup bị trình duyệt chặn! Vui lòng cho phép popup.');
        return;
    }

    // Tạo nội dung HTML cho popup
    const htmlContent = `
    <html>
        <head>
            <title>Chi tiết bản cập nhật</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #e1e4e8; /* Nền màu xám tối hơn một chút */
                    color: #333;
                }

                h2 {
                    font-size: 28px;
                    color: #4CAF50;
                    border-bottom: 3px solid #4CAF50;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    position: relative; /* Cần thiết để căn chỉnh nút với tiêu đề */
                }

                h3 {
                    font-size: 22px;
                    color: #007bff;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    font-weight: bold;
                }

                ul {
                    list-style-type: none;
                    padding-left: 0;
                    margin-bottom: 0;
                }

                .popup-container {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 25px;
                    background-color: #ffffff; /* Giữ nền popup sáng */
                    border-radius: 10px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
                    width: 95vw;
                    position: relative; /* Cho phép căn chỉnh nút ở vị trí tuyệt đối */
                }

                .sid-item {
                    padding: 15px;
                    margin-bottom: 20px;
                    background-color: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
                    color: #555;
                    transition: background-color 0.3s ease, box-shadow 0.3s ease;
                }

                /* Hiệu ứng khi hover */
                .sid-item:hover {
                    background-color: #d1d3d8; /* Màu nền tối hơn khi hover */
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); /* Tăng độ đậm của bóng */
                }

                .sid-item p {
                    margin: 5px 0;
                    font-size: 16px;
                }

                .sid-item p strong {
                    font-weight: bold;
                    color: #333;
                }

                .highlight {
                    background-color: #f8d700; /* Nền vàng đậm */
                    color: #d32f2f; /* Màu chữ đỏ đậm */
                    font-weight: bold;
                    padding: 5px;
                    border-radius: 4px;
                }

                .rule-section {
                    margin-bottom: 40px;
                }

                /* Nút "Đóng" sửa thành màu đỏ */
                button {
                    background-color: #d32f2f; /* Màu nền đỏ */
                    color: white;
                    padding: 10px 20px; /* Tăng kích thước nút */
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px; /* Tăng kích thước font */
                    position: absolute; /* Đặt vị trí tuyệt đối */
                    top: 48px; /* Căn chỉnh với góc trên */
                    right: 70px; /* Căn chỉnh với góc phải */
                }

                button:hover {
                    background-color: #b71c1c; /* Màu đỏ đậm hơn khi hover */
                }

                .sid-item p.local,
                .sid-item p.remote {
                    font-size: 14px;
                    line-height: 1.5;
                    color: #777;
                }

                /* Giảm kích thước cho những dòng text dài để dễ đọc */
                pre {
                    background-color: #f9f9f9;
                    padding: 10px;
                    border-radius: 5px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    color: #444;
                    font-size: 14px;
                }

                /* Phần Local và Remote sẽ có màu nền khác biệt để dễ phân biệt */
                .sid-item .local,
                .sid-item .remote {
                    background-color: #f9f9f9;
                    padding: 10px;
                    margin-top: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

            </style>
        </head>
        <body>
            <div class="popup-container">
                <h2>Chi tiết các thay đổi</h2>

                <h3>Rules mới:</h3>
                <div class="rule-section">
                    ${differences.newRules.map(rule => `
                        <div class="sid-item">
                            <p><strong>SID:</strong> ${rule.sid}</p>
                            <p class="remote"><strong>Remote:</strong><br>${rule.remote}</p>
                        </div>
                    `).join('')}
                </div>

                <h3>Rules sửa đổi:</h3>
                <div class="rule-section">
                    ${differences.modifiedRules.map(rule => `
                        <div class="sid-item">
                            <p><strong>SID:</strong> ${rule.sid}</p>
                            <p class="local"><strong>Local:</strong><br>${rule.local}</p>
                            <p class="remote"><strong>Remote:</strong><br>${rule.remote}</p>
                        </div>
                    `).join('')}
                </div>

                <button onclick="window.close()">Đóng</button>
            </div>
        </body>
    </html>
    `;

    popupWindow.document.write(htmlContent);
    popupWindow.document.close();
}