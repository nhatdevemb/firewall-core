


const toggleSwitch = document.getElementById('toggleSwitch');
const feedUrlInput = document.getElementById('feed3-url');
const notificationBar = document.getElementById('notification-bar3');

// Hàm kiểm tra trạng thái khi trang được tải
document.addEventListener('DOMContentLoaded', async function () {
  const fileName = feedUrlInput.value.split('/').pop(); // Lấy tên file từ URL

  try {
    // Gọi API để kiểm tra trạng thái của file
    const response = await fetch('/api/rules/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName }) // Gửi tên file lên server để kiểm tra trạng thái
    });

    const result = await response.json();
    console.log("File Status:", result.status); // Debug trạng thái của file

    // Cập nhật trạng thái của toggleSwitch dựa trên kết quả trả về
    if (result.status === 'Enable') {
      toggleSwitch.checked = true; // Nút bật
    } else {
      toggleSwitch.checked = false; // Nút tắt
    }

  } catch (error) {
    console.error('Error checking file status:', error); // Debug lỗi nếu có
  }
});

// Sự kiện thay đổi trạng thái nút Enable/Disable
// Sự kiện thay đổi trạng thái nút Enable/Disable
toggleSwitch.addEventListener('change', async function () {
  const fileName = feedUrlInput.value.split('/').pop(); // Lấy tên file từ URL
  const action = this.checked ? 'Enable' : 'Disable'; // Xác định trạng thái (Enable/Disable)

  // // Hiển thị loader trong quá trình xử lý
  // document.getElementById('loader3').style.display = 'block';

  try {
    // Gọi API để thực hiện Enable/Disable
    await fetch('/api/rules/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, action }) // Gửi tên file và trạng thái lên server
    });

  } catch (error) {
    console.error('Error:', error); // Debug lỗi nếu có
  } 
  // finally {
  //   // Ẩn loader sau khi hoàn tất xử lý
  //   document.getElementById('loader3').style.display = 'none';
  // }
});


