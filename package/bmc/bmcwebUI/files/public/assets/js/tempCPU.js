document.addEventListener('DOMContentLoaded', async () => {
    // Hàm để lấy thông tin nhiệt độ CPU
    async function fetchtempCPU() {
        try {
            const response = await fetch('/api/system/tempCPU'); // Gửi request tới API
            const data = await response.json(); // Parse JSON trả về

            // Hiển thị giá trị nhiệt độ lên giao diện
            // document.querySelector('#core1').textContent = `Core 1: ${data.core1}`;
            // document.querySelector('#core2').textContent = `Core 2: ${data.core2}`;
            document.querySelector('#core1').innerHTML = `<i class="fa fa-microchip"></i> ${data.core1}`;
            document.querySelector('#core2').innerHTML = `<i class="fa fa-microchip"></i> ${data.core2}`;

        } catch (error) {
            console.error('Error fetching CPU temperature:', error);
        }
    }

    // Gọi lần đầu tiên khi trang được tải
    await fetchtempCPU();

    // Gọi định kỳ mỗi 1 phút 30 giây
    setInterval(fetchtempCPU, 90000);
});
