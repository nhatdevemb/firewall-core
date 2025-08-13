document.addEventListener('DOMContentLoaded', async () => {
    // Hàm để lấy thông tin RAM
    async function fetchTimeHoatdong() {
        try {
            const response = await fetch('/api/system/checkTimehoatdong');
            const data = await response.json();
            document.querySelector('#checkTimehoatdong').textContent = data.count; // Cập nhật số lượng lên giao diện
        } catch (error) {
            console.error('Error fetching logdisk usage:', error);
        }
    }

    // Gọi lần đầu tiên khi trang được tải
    await fetchTimeHoatdong();

    // Gọi định kỳ mỗi 1 phút 30 giây
    setInterval(fetchTimeHoatdong, 90000);
});
