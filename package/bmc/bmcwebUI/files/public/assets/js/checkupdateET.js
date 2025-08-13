function checkUpdate1() {
    const feedUrlElement = document.getElementById('feed1-url');
    const notificationBar = document.getElementById('notification-bar1');
    const loader = document.getElementById('loader1');
    const downloadUpdateBtn = document.getElementById('downloadUpdate1');
    const importUpdateDevice = document.getElementById('importUpdateDevice1');

    // Hiển thị hiệu ứng loading
    loader.style.display = 'block';
    notificationBar.style.display = 'none'; // Ẩn thanh thông báo ban đầu
    downloadUpdateBtn.disabled = true; // Vô hiệu hóa nút "Tải bản cập nhật mới"
    importUpdateDevice.disabled = true; // Vô hiệu hóa nút "Cập nhật cho thiết bị"

    // Gửi yêu cầu kiểm tra cập nhật
    fetch('/api/check-updateET', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Lỗi từ server: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        loader.style.display = 'none'; // Ẩn loader sau khi kiểm tra

        if (data.updateAvailable) {
            // Hiển thị thông báo "Có bản cập nhật mới"
            notificationBar.innerHTML = `<span class="update-available">Có bản cập nhật mới</span>`;
            notificationBar.style.display = 'block';
            notificationBar.classList.add('update-available-blink'); // Hiệu ứng nhấp nháy
            notificationBar.style.color = 'white';
            downloadUpdateBtn.disabled = false; // Kích hoạt nút "Tải bản cập nhật mới"
            importUpdateDevice.disabled = false; // Kích hoạt nút "Cập nhật cho thiết bị"

            // Lắng nghe sự kiện nhấn vào thông báo "Có bản cập nhật mới"
            notificationBar.addEventListener('click', function() {
                // Mở popup thông báo cập nhật mới và hiển thị thông tin phiên bản
                openUpdatePopupNew(data.localVersion, data.remoteVersion);  // Chuyển thông tin phiên bản vào popup
            });
        } else {
            // Trường hợp không có bản cập nhật mới
            notificationBar.innerHTML = `<span class="no-update-available">Không có bản cập nhật mới</span>`;
            notificationBar.style.display = 'block';
            notificationBar.classList.remove('update-available-blink');
            notificationBar.style.backgroundColor = '#e67e22'; // Nền cam
            notificationBar.style.color = 'white';
        }

        // Lắng nghe sự kiện click vào notification bar để mở popup
        notificationBar.addEventListener('click', () => {
            // Mở cửa sổ popup chứa tệp sosanhrule.html
            const popupWindow = window.open(
                './sosanhrule.html', // Đường dẫn đến tệp sosanhrule.html
                'SoSanhRulePopup', // Tên cửa sổ popup
                'width=800,height=600,scrollbars=yes' // Kích thước và các thuộc tính của cửa sổ popup
            );

            // Kiểm tra xem popup có bị chặn không
            if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
                alert('Cửa sổ popup bị trình duyệt chặn! Vui lòng cho phép popup.');
            }
        });
    })
    .catch(error => {
        console.error('Error checking update:', error);
        loader.style.display = 'none'; // Ẩn loader nếu có lỗi
        notificationBar.innerHTML = `<span class="error-message">Lỗi khi kiểm tra bản cập nhật</span>`;
        notificationBar.style.display = 'block';
        notificationBar.style.backgroundColor = '#e74c3c'; // Nền đỏ
        notificationBar.style.color = 'white';
    });
}



// Đảm bảo nút "Kiểm tra cập nhật" đã có trên trang
document.addEventListener('DOMContentLoaded', function () {
    const checkUpdateButton = document.getElementById('checkUpdate1');
    if (checkUpdateButton) {
        checkUpdateButton.addEventListener('click', checkUpdate1);
    } else {
        console.error('Nút kiểm tra cập nhật không tồn tại!');
    }
});
