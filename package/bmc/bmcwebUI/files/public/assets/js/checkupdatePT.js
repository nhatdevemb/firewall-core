document.addEventListener('DOMContentLoaded', () => {
    const checkUpdateButton = document.getElementById('checkUpdate2');
    const notificationBar = document.getElementById('notification-bar2');
    const loader = document.getElementById('loader2');
    const downloadUpdateBtn = document.getElementById('downloadUpdate2');
    const importUpdateDevice = document.getElementById('importUpdateDevice2');

    if (checkUpdateButton) {
        checkUpdateButton.addEventListener('click', async () => {
            // Hiển thị hiệu ứng loading
            loader.style.display = 'block';
            notificationBar.style.display = 'none';
            downloadUpdateBtn.disabled = true; // Vô hiệu hóa nút "Tải bản cập nhật mới"
            importUpdateDevice.disabled = true; // Vô hiệu hóa nút "Cập nhật cho thiết bị"

            try {
                // Gửi yêu cầu tới API để kiểm tra cập nhật
                const response = await fetch('/api/check-updatePT');
                if (!response.ok) {
                    throw new Error(`Lỗi từ server: ${response.statusText}`);
                }
                const data = await response.json();

                // Ẩn loader sau khi kiểm tra
                loader.style.display = 'none';

                if (data.updateAvailable) {
                    // Hiển thị thông báo "Có bản cập nhật mới"
                    notificationBar.innerHTML = `<span class="update-available">Có bản cập nhật mới</span>`;
                    notificationBar.style.display = 'block';
                    notificationBar.classList.add('update-available-blink');
                    notificationBar.style.color = 'white';

                    // Kích hoạt nút "Tải bản cập nhật mới" và "Cập nhật cho thiết bị"
                    downloadUpdateBtn.disabled = false;
                    importUpdateDevice.disabled = false;

                    // Lắng nghe sự kiện nhấn vào notification bar
                    notificationBar.addEventListener('click', () => {
                        // Mở popup thông báo cập nhật mới
                        openUpdatePopupNew(data.localVersion, data.remoteVersion);
                    });
                } else {
                    // Không có bản cập nhật mới
                    notificationBar.innerHTML = `<span class="no-update-available">Không có bản cập nhật mới</span>`;
                    notificationBar.style.display = 'block';
                    notificationBar.classList.remove('update-available-blink');
                    notificationBar.style.backgroundColor = '#e67e22'; // Nền cam
                    notificationBar.style.color = 'white';
                }

                // Lắng nghe sự kiện click vào notification bar để mở popup so sánh rule
                // notificationBar.addEventListener('click', () => {
                //     const popupWindow = window.open(
                //         './sosanhrule.html',
                //         'SoSanhRulePopup',
                //         'width=800,height=600,scrollbars=yes'
                //     );
                //     if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
                //         alert('Cửa sổ popup bị trình duyệt chặn! Vui lòng cho phép popup.');
                //     }
                // });
            } catch (error) {
                // Xử lý lỗi
                console.error('Error checking update:', error);
                loader.style.display = 'none';
                notificationBar.innerHTML = `<span class="error-message">Lỗi khi kiểm tra bản cập nhật</span>`;
                notificationBar.style.display = 'block';
                notificationBar.style.backgroundColor = '#e74c3c'; // Nền đỏ
                notificationBar.style.color = 'white';
            }
        });
    } else {
        console.error('Nút kiểm tra cập nhật không tồn tại!');
    }
});
