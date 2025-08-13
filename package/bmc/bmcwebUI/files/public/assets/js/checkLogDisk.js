document.addEventListener('DOMContentLoaded', async () => {
    // Hàm để lấy thông tin RAM
    async function fetchLogDisk() {
        try {
            const response = await fetch('/api/system/logdisk');
            const data = await response.json();
            document.querySelector('#checkLogDisk').textContent = data.count; // Cập nhật số lượng lên giao diện
        } catch (error) {
            console.error('Error fetching logdisk usage:', error);
        }
    }

    // Gọi lần đầu tiên khi trang được tải
    await fetchLogDisk();

    // Gọi định kỳ mỗi 1 phút 30 giây
    setInterval(fetchLogDisk, 90000);
});
