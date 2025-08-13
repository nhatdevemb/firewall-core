document.addEventListener('DOMContentLoaded', function () {
    let editors = {};

    // Hàm để tải file vào editor
    function loadFile(file) {
        fetch(`/api/file/${file}`)
            .then(response => response.text())
            .then(data => {
                if (!editors[file]) {
                    editors[file] = ace.edit(`editor-${file}`);
                    editors[file].setTheme("ace/theme/monokai");
                    editors[file].session.setMode("ace/mode/yaml");
                }
                editors[file].setValue(data, -1); // Nạp nội dung vào editor
            });
    }

    // Hàm để lưu nội dung file sau khi chỉnh sửa
    // Hàm để lưu nội dung file sau khi chỉnh sửa
    function saveFile(file) {
        const content = editors[file].getValue();
        const spinner = document.getElementById(`loading-spinner-${file}`); // Lấy spinner tương ứng

        // Hiển thị spinner
        spinner.style.display = 'inline-block';

        fetch(`/api/file/${file}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        })
        .then(response => response.json())
        .then(data => {
            // Ẩn spinner
            spinner.style.display = 'none';

            if (data.success) {
                showSaveMessage(file, 'Sửa file cấu hình thành công!', 'success');
                hideErrorList();
            } else {
                showSaveMessage(file, 'Có lỗi xảy ra!', 'error');
                displayErrorList(data.errors); // Hiển thị danh sách lỗi
            }
        })
        .catch(error => {
            // Ẩn spinner
            spinner.style.display = 'none';
            showSaveMessage(file, 'Có lỗi xảy ra: ' + error, 'error');
        });
    }


    // Khi click vào tab, tải file tương ứng
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            const file = this.getAttribute('data-file');
            document.querySelectorAll('.config-content').forEach(content => content.classList.remove('active'));
            document.getElementById(file).classList.add('active');
            loadFile(file); // Tải nội dung file vào editor
        });
    });

    // Xử lý chuyển tab
    const tabs = document.querySelectorAll('.config-tab');
    const contents = document.querySelectorAll('.config-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));

            this.classList.add('active');
            const contentId = this.getAttribute('data-file');
            document.getElementById(contentId).classList.add('active');
        });
    });

    // Khi nhấn nút "Lưu", lưu nội dung chỉnh sửa
    document.querySelectorAll('.config-save-button').forEach(button => {
        button.addEventListener('click', function () {
            const file = this.getAttribute('data-file');
            saveFile(file); // Lưu file khi người dùng nhấn "Lưu"
        });
    });

    // Hiển thị thông báo bên cạnh nút "Lưu"
    function showSaveMessage(file, message, type) {
        const messageElement = document.getElementById(`save-message-${file}`);
        messageElement.textContent = message;

        if (type === 'error') {
            messageElement.classList.add('error');
        } else {
            messageElement.classList.remove('error');
        }

        // Hiển thị thông báo
        messageElement.style.display = 'inline';

        // Ẩn thông báo sau 3 giây
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 30000);
    }

    // Hiển thị danh sách lỗi
    function displayErrorList(errors) {
        const errorContainer = document.getElementById('error-container');
        const errorList = document.getElementById('error-list');

        // Xóa danh sách lỗi cũ
        errorList.innerHTML = '';

        // Thêm lỗi mới vào danh sách
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorList.appendChild(li);
        });

        // Hiển thị container lỗi
        errorContainer.style.display = 'block';
    }

    // Ẩn danh sách lỗi khi không có lỗi
    function hideErrorList() {
        const errorContainer = document.getElementById('error-container');
        errorContainer.style.display = 'none';
    }
});
