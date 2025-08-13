document.addEventListener('DOMContentLoaded', () => {
    // Lắng nghe sự kiện trên nút có id "checkUpdate"
    const checkUpdateButton = document.getElementById('checkUpdate');

    if (checkUpdateButton) {
        checkUpdateButton.addEventListener('click', () => {
            // Lấy host và port động từ window.location
            const host = window.location.hostname || 'localhost';
            const port = window.location.port || '1234'; // Mặc định sử dụng port 1234 nếu không có
            const dynamicUrl = `http://${host}:${port}/pages/ui-features/capnhatrule.html`;

            // Điều hướng đến URL động
            window.location.href = dynamicUrl;
        });
    } else {
        console.error('Nút "checkUpdate" không tồn tại trên trang.');
    }
});
