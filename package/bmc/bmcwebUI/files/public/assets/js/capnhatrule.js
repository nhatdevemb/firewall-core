// Hàm kiểm tra cập nhật cho một feed cụ thể
function checkUpdate(feedInputId, notificationBarId, loaderId, downloadUpdateBtnId, importUpdateDeviceId) {
    const feedUrlElement = document.getElementById(feedInputId);
    const notificationBar = document.getElementById(notificationBarId);
    const loader = document.getElementById(loaderId);
    const downloadUpdateBtn = document.getElementById(downloadUpdateBtnId);
    const importUpdateDevice = document.getElementById(importUpdateDeviceId);

    // Kiểm tra xem các phần tử có tồn tại không
    if (!feedUrlElement || !notificationBar || !loader || !downloadUpdateBtn || !importUpdateDevice) {
        console.error('[DEBUG] Một hoặc nhiều phần tử không tồn tại:');
        if (!feedUrlElement) console.error(`[DEBUG] feedInputId (${feedInputId}) không tồn tại.`);
        if (!notificationBar) console.error(`[DEBUG] notificationBarId (${notificationBarId}) không tồn tại.`);
        if (!loader) console.error(`[DEBUG] loaderId (${loaderId}) không tồn tại.`);
        if (!downloadUpdateBtn) console.error(`[DEBUG] downloadUpdateBtnId (${downloadUpdateBtnId}) không tồn tại.`);
        if (!importUpdateDevice) console.error(`[DEBUG] importUpdateDeviceId (${importUpdateDeviceId}) không tồn tại.`);
        return;
    }

    const feedUrl = feedUrlElement.value;

    // Hiển thị hiệu ứng loading
    loader.style.display = 'block';
    notificationBar.style.display = 'none'; // Ẩn thanh thông báo ban đầu
    downloadUpdateBtn.disabled = true; // Vô hiệu hóa nút "Tải bản cập nhật mới"
    importUpdateDevice.disabled = true; // Vô hiệu hóa nút "Cập nhật cho thiết bị"

    // Gửi yêu cầu kiểm tra cập nhật
    fetch('/api/check-update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedUrl })
    })
    .then(response => response.json())
    .then(data => {
        loader.style.display = 'none'; // Ẩn loader sau khi kiểm tra

        if (data.updateAvailable) {
            // Hiển thị thông báo "Có bản cập nhật mới"
            notificationBar.innerHTML = '<span class="update-available">Có bản cập nhật mới</span>';
            notificationBar.style.display = 'block';
            notificationBar.classList.add('update-available-blink'); // Hiệu ứng nhấp nháy
            notificationBar.style.color = 'white';
            downloadUpdateBtn.disabled = false; // Kích hoạt nút "Tải bản cập nhật mới"
            importUpdateDevice.disabled = false; // Kích hoạt nút "Cập nhật cho thiết bị"

            // Khi nhấn vào thông báo, hiển thị modal chi tiết khác biệt
            notificationBar.querySelector('.update-available').addEventListener('click', function() {
                displayDifferencesModal(data.differences);
            });
        } else {
            // Trường hợp không có bản cập nhật mới
            notificationBar.innerHTML = '<span class="no-update-available">Không có bản cập nhật mới</span>';
            notificationBar.style.display = 'block';
            notificationBar.classList.remove('update-available-blink');
            notificationBar.style.backgroundColor = '#e67e22'; // Nền cam
            notificationBar.style.color = 'white';
        }
    })
    .catch(error => {
        console.error('Lỗi khi kiểm tra cập nhật:', error);
        loader.style.display = 'none'; // Ẩn loader khi có lỗi
        notificationBar.innerHTML = 'Có lỗi xảy ra khi kiểm tra cập nhật.';
        notificationBar.style.display = 'block';
        notificationBar.style.backgroundColor = 'red'; // Nền đỏ
        notificationBar.style.color = 'white';
    });
}

// Hàm hiển thị chi tiết khác biệt trong modal
function displayDifferencesModal(differences) {
    let modalContent = `
    <div class="modal-header">
        <span class="close-btn" onclick="closeModal()">&times;</span>
        <h3 class="modal-title">Các sự khác biệt</h3>
    </div>
    <div class="modal-body">`;

    // Phân loại và hiển thị các rule mới
    if (differences.newRules && differences.newRules.length > 0) {
        modalContent += '<h4 class="section-title new-rule-title">Rule mới:</h4>';
        differences.newRules.forEach(rule => {
            modalContent += `<p><strong>SID: ${rule.sid}</strong></p>`;
            modalContent += `<p><span class="label-remote">Remote:</span> ${rule.remote}</p><hr>`;
        });
    }

    // Hiển thị các rule đã chỉnh sửa
    if (differences.modifiedRules && differences.modifiedRules.length > 0) {
        modalContent += '<h4 class="section-title modified-rule-title">Rule đã có sự sửa đổi:</h4>';
        differences.modifiedRules.forEach(rule => {
            modalContent += `<p><strong>SID: ${rule.sid}</strong></p>`;
            modalContent += `<p><span class="label-local">Local:</span> ${rule.local}</p>`;
            modalContent += `<p><span class="label-remote">Remote:</span> ${rule.remote}</p><hr>`;
        });
    }

    // Đóng nội dung modal
    modalContent += '</div>';

    // Cập nhật nội dung modal và hiển thị
    document.getElementById('modalBody').innerHTML = modalContent;
    document.getElementById('diffModal').style.display = 'block';
}

// Hàm đóng modal
function closeModal() {
    document.getElementById('diffModal').style.display = 'none';
}

// Hàm tải bản cập nhật
function downloadRule(feedInputId, downloadUpdateBtnId, importUpdateDeviceId) {
    const feedUrl = document.getElementById(feedInputId).value;

    // Gửi yêu cầu tải file
    fetch('/api/download-update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedUrl })
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        } else {
            throw new Error('Không thể tải file từ server.');
        }
    })
    .then(blob => {
        // Tạo URL blob và kích hoạt tải file
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `rules_${Date.now()}.rules`; // Đặt tên file
        document.body.appendChild(a);
        a.click(); // Kích hoạt tải
        document.body.removeChild(a); // Xóa thẻ sau khi tải

        // Kích hoạt nút "Cập nhật cho thiết bị"
        document.getElementById(importUpdateDeviceId).disabled = false;
    })
    .catch(error => {
        console.error('Lỗi khi tải file:', error);
        alert('Có lỗi xảy ra khi tải file. Vui lòng thử lại.');
    });
}

// Lắng nghe sự kiện nhấn nút kiểm tra cập nhật cho từng feed
document.getElementById('checkUpdate1').addEventListener('click', function() {
    checkUpdate('feed1-url', 'notification-bar1', 'loader1', 'downloadUpdate1', 'importUpdateDevice1');
});

document.getElementById('checkUpdate2').addEventListener('click', function() {
    checkUpdate('feed2-url', 'notification-bar2', 'loader2', 'downloadUpdate2', 'importUpdateDevice2');
});

document.getElementById('checkUpdate3').addEventListener('click', function() {
    checkUpdate('feed3-url', 'notification-bar3', 'loader3', 'downloadUpdate3', 'importUpdateDevice3');
});

document.getElementById('checkUpdate4').addEventListener('click', function() {
    checkUpdate('feed4-url', 'notification-bar4', 'loader4', 'downloadUpdate4', 'importUpdateDevice4');
});

// Lắng nghe sự kiện nhấn nút tải bản cập nhật cho từng feed
document.querySelectorAll('[id^="downloadUpdate"]').forEach(downloadButton => {
    downloadButton.addEventListener('click', function() {
        const feedId = this.id.replace('downloadUpdate', ''); // Lấy số ID từ nút
        const feedInputId = `feed${feedId}-url`;
        const importUpdateDeviceId = `importUpdateDevice${feedId}`;
        downloadRule(feedInputId, this.id, importUpdateDeviceId);
    });
});

// Lắng nghe sự kiện chọn file để cập nhật
document.getElementById('fileInputPopup').addEventListener('change', function (event) {
    const file = event.target.files[0]; // Lấy file đầu tiên được chọn
    const fileNameElement = document.getElementById('selectedFileNamePopup');

    if (file) {
      // Hiển thị tên file bên cạnh nút "Choose File"
      fileNameElement.style.display = 'inline-block';
      fileNameElement.textContent = file.name;

      // Kích hoạt nút "Cập nhật"
      document.getElementById('updateConfirmButton').disabled = false;

      console.log('[DEBUG] File selected:', file.name);
    } else {
      // Nếu không có file nào được chọn
      fileNameElement.style.display = 'none';
      fileNameElement.textContent = '';
      document.getElementById('updateConfirmButton').disabled = true;

      console.log('[DEBUG] No file selected.');
    }
});
