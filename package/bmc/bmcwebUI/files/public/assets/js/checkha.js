document.addEventListener('DOMContentLoaded', async () => {
    // Hàm để lấy thông tin HA status
    async function fetchHAStatus() {
        try {
            console.log('Fetching HA status...');
            const response = await fetch('/api/system/ha');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Command result received:', data.status); // Log backend status

            // Update the status text
            const checkHaElement = document.querySelector('#checkha');
            const haIcon = document.querySelector('#ha-icon');

            if (data.status === 'Active') {
                checkHaElement.textContent = 'Master';
                haIcon.classList.remove('deactive');
                haIcon.classList.add('active');
            } else {
                checkHaElement.textContent = 'Backup';
                haIcon.classList.remove('active');
                haIcon.classList.add('deactive');
            }
        } catch (error) {
            console.error('Error fetching HA status:', error);
        }
    }

    // Gọi hàm fetchHAStatus lần đầu tiên khi trang được tải
    await fetchHAStatus();

    // Gọi định kỳ mỗi 5s
    setInterval(fetchHAStatus, 30000);
});
