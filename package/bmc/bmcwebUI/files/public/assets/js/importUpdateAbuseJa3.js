document.getElementById('importUpdateDevice7').addEventListener('click', function() {
    document.getElementById('fileInput7').click(); // Mở hộp thoại chọn file
});

document.getElementById('fileInput7').addEventListener('change', function(event) {
    const files = event.target.files;
    const fileNames = [];

    // Chỉ cho phép chọn file có định dạng .txt, .rules hoặc .map
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'txt' || fileExtension === 'rules' || fileExtension === 'map') {
            fileNames.push(file.name);
        }
    }

    // Hiển thị tên các file đã chọn
    if (fileNames.length > 0) {
        document.getElementById('selectedFileName7').style.display = 'block';
        document.getElementById('fileName7').innerHTML = fileNames.join(', ');
    } else {
        showPopup('Chỉ có thể chọn file .txt hoặc .rules');
    }
});

// Lắng nghe sự kiện cho nút "Cập nhật vào thiết bị"
document.getElementById('capnhat7').addEventListener('click', function() {
    const files = document.getElementById('fileInput7').files;

    if (files.length === 0) {
        showPopup('Vui lòng chọn file để cập nhật');
        return;
    }

    // Bắt đầu tải lên từng file
    uploadFilesJA3(files);
});

// Chỉnh sửa phần gửi file để đảm bảo tên trường khớp với tên trong multer
function uploadFilesJA3(files) {
    const loader = document.getElementById('loader7');
    loader.style.display = 'block'; // Hiển thị loader

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]); // Chắc chắn rằng trường là 'file'
    }

    fetch('/api/uploadExtensionRule', {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loader.style.display = 'none'; // Ẩn loader
        if (data.success) {
            showPopup('Cập nhật thành công');
        } else {
            showPopup('Lỗi khi cập nhật: ' + (data.message || 'Không rõ lỗi'));
        }
    })
    .catch(error => {
        loader.style.display = 'none'; // Ẩn loader
        console.error('Lỗi khi gửi file:', error);
        showPopup('Đã xảy ra lỗi: ' + error.message);
    });
}


// Hàm để hiển thị thông báo trong popup
function showPopup(message) {
    const popupMessageElement = document.getElementById('popupMessage');
    popupMessageElement.innerHTML = message;
    
    // Hiển thị popup
    const popupOverlay = document.getElementById('notificationPopup');
    popupOverlay.style.display = 'flex';

    // Đóng popup khi nhấn nút đóng
    const closePopupBtn = document.getElementById('closePopupBtn');
    closePopupBtn.onclick = function() {
        popupOverlay.style.display = 'none'; // Ẩn popup
    }

    // Đóng popup khi click ngoài popup
    window.onclick = function(event) {
        if (event.target === popupOverlay) {
            popupOverlay.style.display = 'none';
        }
    }
}
