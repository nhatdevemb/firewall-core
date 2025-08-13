document.getElementById('importUpdateDevice1').addEventListener('click', function() {
    document.getElementById('fileInput1').click(); // Mở hộp thoại chọn file
});

document.getElementById('fileInput1').addEventListener('change', function(event) {
    const files = event.target.files;
    const fileNames = [];

    // Chỉ cho phép chọn file có định dạng .txt, .rules hoặc .map
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'txt' || fileExtension === 'rules' || fileExtension === 'map' || fileExtension === 'config') {
            fileNames.push(file.name);
        }
    }

    // Hiển thị tên các file đã chọn
    if (fileNames.length > 0) {
        document.getElementById('selectedFileName1').style.display = 'block';
        document.getElementById('fileName1').innerHTML = fileNames.join(', ');
    } else {
        showPopup('Chỉ có thể chọn file .txt hoặc .rules');
    }
});

// Lắng nghe sự kiện cho nút "Cập nhật vào thiết bị"
document.getElementById('capnhat1').addEventListener('click', function() {
    const files = document.getElementById('fileInput1').files;

    if (files.length === 0) {
        showPopup('Vui lòng chọn file để cập nhật');
        return;
    }

    // Bắt đầu tải lên từng file
    uploadFiles(files);
});

// Chỉnh sửa phần gửi file để đảm bảo tên trường khớp với tên trong multer
function uploadFiles(files) {
    const loader = document.getElementById('loader1');
    loader.style.display = 'block'; // Hiển thị loader

    const formData = new FormData();
    const fileData = [];

    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]); // Chắc chắn rằng trường là 'file'
        fileData.push({ name: files[i].name, size: files[i].size });
    }

    // Gửi thông tin file lên server kèm theo FormData
    fetch('/api/uploadFiles', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        loader.style.display = 'none'; // Ẩn loader
        if (data.success) {
            showPopup('Cập nhật thành công');
        } else {
            showPopup('Lỗi khi cập nhật: ' + data.message);
        }
    })
    .catch(error => {
        loader.style.display = 'none'; // Ẩn loader
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
