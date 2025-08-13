document.addEventListener('DOMContentLoaded', async () => {
    // Hàm để lấy thông tin RAM
    async function fetchhanlicense() {
        try {
            const response = await fetch('/api/system/hanlicense');
            const data = await response.json();
            document.querySelector('#hanlicense').textContent = data.count; // Cập nhật số lượng lên giao diện
        } catch (error) {
            console.error('Error fetching logdisk usage:', error);
        }
    }

    // Gọi lần đầu tiên khi trang được tải
    await fetchhanlicense();

    // Gọi định kỳ mỗi 1 phút 30 giây
    setInterval(fetchhanlicense, 90000);
});
