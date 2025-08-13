document.addEventListener("DOMContentLoaded", function () {
    // Danh sách các ID nút được chỉ định
    const allowedButtonIds = ["downloadUpdate3", "downloadUpdate4", "downloadUpdate5", "downloadUpdate6", "downloadUpdate7"];

    function handleDownload(event) {
        const buttonId = event.target.id; // ID của nút được click

        // Kiểm tra nếu ID của nút không nằm trong danh sách được chỉ định
        if (!allowedButtonIds.includes(buttonId)) {
            console.warn(`Nút không được chỉ định: ${buttonId}`);
            return;
        }

        const urlId = buttonId.replace("downloadUpdate", "feed"); // Tạo ID tương ứng với input URL
        const feedUrlInput = document.getElementById(`${urlId}-url`);

  
      if (feedUrlInput) {
        const fileUrl = feedUrlInput.value; // Lấy URL từ input
  
        if (fileUrl) {
          // Gửi request tải file từ API
          fetch('/api/tairule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: fileUrl }),
          })
            .then((response) => {
              if (response.ok) {
                // Tạo link ảo để trình duyệt tải file
                return response.blob().then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
  
                  // Tách tên file từ URL
                  const fileName = fileUrl.split('/').pop();
                  a.download = fileName;
  
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                });
              } else {
                alert('Lỗi khi tải file!');
              }
            })
            .catch((err) => {
              console.error('Lỗi:', err);
              alert('Không thể tải file!');
            });
        } else {
          alert('URL không hợp lệ!');
        }
      } else {
        alert('Không tìm thấy URL tương ứng!');
      }
    }
  
    // Lắng nghe sự kiện click cho các nút có ID bắt đầu bằng "downloadUpdate"
    document.querySelectorAll("button[id^='downloadUpdate']").forEach((button) => {
      button.addEventListener("click", handleDownload);
    });
  });
  