// Hàm xử lý tải file từ feed URL
async function downloadFileFromUrl(url, downloadBtnId, notificationBarId, loaderID) {
    try {
        // Hiển thị loader khi bắt đầu tải file
        const loader = document.getElementById(loaderID);
        loader.style.display = 'inline-block'; // Hiển thị loader

        // Gửi yêu cầu POST tới server để tải file
        const response = await fetch('/api/download-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ updateKey: downloadBtnId }), // Sử dụng ID nút để xác định đường dẫn tải file
        });

        if (!response.ok) {
            throw new Error('Không thể tải file từ server.');
        }

        // Tạo một URL blob từ nội dung phản hồi
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        // Tạo một thẻ <a> tạm thời để kích hoạt tải xuống
        const a = document.createElement('a');
        a.href = downloadUrl;
        const contentDisposition = response.headers.get('Content-Disposition');
        const fileName = contentDisposition.split('filename=')[1].replace(/"/g, ''); // Lấy tên file từ header
        a.download = fileName; // Sử dụng tên file từ header
        document.body.appendChild(a);
        a.click(); // Kích hoạt tải file
        document.body.removeChild(a); // Xóa thẻ <a> sau khi tải xong

        // Hiển thị thông báo thành công
        const notificationBar = document.getElementById(notificationBarId);
        notificationBar.innerHTML = 'Tải file thành công!';
        notificationBar.style.display = 'block';

    } catch (error) {
        console.error('[LOG] Lỗi khi tải file:', error);

        // Hiển thị thông báo lỗi
        const notificationBar = document.getElementById(notificationBarId);
        notificationBar.innerHTML = `Lỗi khi tải file: ${error.message}`;
        notificationBar.style.display = 'block';
    } finally {
        // Ẩn loader sau khi tải xong
        const loader = document.getElementById(loaderID);
        loader.style.display = 'none';
    }
}
