// Dữ liệu ứng dụng mạng xã hội với tên và icon
const apps = [
    { name: 'Facebook', icon: 'http://192.168.2.41:1234/images/icons/facebook.png', color: '#FF6347', domain: 'www.facebook.com' },  // Tomato Red
    { name: 'Youtube', icon: 'http://192.168.2.41:1234/images/icons/youtube.png', color: '#1E90FF', domain: 'www.youtube.com' },  // Dodger Blue
    { name: 'Zalo', icon: 'http://192.168.2.41:1234/images/icons/zalo.png', color: '#32CD32', domain: 'tt-chat[123]-wpa.chat.zalo.me' },  // Lime Green
    { name: 'Telegram', icon: 'http://192.168.2.41:1234/images/icons/telegram.png', color: '#8A2BE2', domain: 'web.telegram.org' }  // Blue Violet
];

let dailyData = {
    'Facebook': [0, 0, 0, 0], // Default data
    'Youtube': [0, 0, 0, 0],
    'Zalo': [0, 0, 0, 0],
    'Telegram': [0, 0, 0, 0]
};

let logDates = ["Ngày 3", "Ngày 2", "Ngày 1", "Hôm nay"]; // Placeholder for actual dates
let logDataArray = []; // Chứa tất cả dữ liệu từ API

let cachedLogData = null; // Bộ nhớ tạm để lưu các tệp log cũ (pihole.log.3.gz, pihole.log.2.gz, pihole.log.1)
let lastFetchedPiholeLogTime = null; // Lưu thời gian lấy dữ liệu pihole.log lần cuối

document.addEventListener("DOMContentLoaded", function () {
    // Kiểm tra nếu có dữ liệu đã lưu trong localStorage
    const storedData = localStorage.getItem('logData');
    if (storedData) {
        // Nếu có dữ liệu đã lưu, sử dụng dữ liệu đó
        logDataArray = JSON.parse(storedData);
        updateChartsFromStoredData();
    } else {
        // Nếu không có dữ liệu, lấy dữ liệu từ API
        fetchLogData();
    }

    // Gọi API tự động mỗi 10 giây để cập nhật dữ liệu
    setInterval(fetchLogData, 10000); // 10s = 10000ms
});

function updateChartsFromStoredData() {
    logDataArray.forEach((logData, index) => {
        // Cập nhật ngày
        if (logData.log_file === "pihole.log") {
            logDates[index] = "Hôm nay";  // Nếu là pihole.log, đặt là Hôm nay
        } else {
            logDates[index] = logData.log_time.split(" ")[0];  // Cập nhật ngày từ log_time
        }
        dailyData.Facebook[index] = logData.facebook_request_count;
        dailyData.Youtube[index] = logData.youtube_request_count;
        dailyData.Zalo[index] = logData.zalo_request_count;
        dailyData.Telegram[index] = logData.telegram_request_count;
    });

    // Vẽ lại biểu đồ sau khi có dữ liệu mới
    drawTrafficChart();
}

function drawTrafficChart() {
    // Tạo datasets cho mỗi ứng dụng
    const datasets = apps.map((app) => {
        return {
            label: app.name,
            data: dailyData[app.name],
            backgroundColor: app.color,  // Màu sắc đã cập nhật theo ứng dụng
            borderColor: app.color,  // Cập nhật màu sắc viền cột
            borderWidth: 1,
            barPercentage: 0.5, // Tỷ lệ chiều rộng cột
            categoryPercentage: 0.5 // Tỷ lệ chiều rộng của nhóm cột
        };
    });

    const ctx = document.getElementById("trafficChart").getContext("2d");

    // Cập nhật biểu đồ hoặc tạo mới nếu chưa có
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    window.chartInstance = new Chart(ctx, {
        type: 'bar',  // Loại biểu đồ là bar (hình cột)
        data: {
            labels: logDates,  // Dùng các ngày thực tế lấy từ API
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 50,
                        color: "#ECF0F1" // Màu chữ trục y sáng hơn
                    }
                },
                x: {
                    ticks: {
                        color: "#ECF0F1" // Màu chữ trục x sáng hơn
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const appName = tooltipItem.dataset.label;
                            return appName + ": " + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });

    // Hiển thị biểu tượng bên dưới biểu đồ
    displayLegend();
}

// Hàm gọi API để lấy dữ liệu log cho từng ngày
function fetchLogData() {
    fetch('/get-log-from-pihole', {
        method: 'GET',  // Sử dụng GET thay vì POST
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        // console.log('Dữ liệu log từ API:', data);
        logDataArray = data;  // Lưu dữ liệu API vào mảng logDataArray
        localStorage.setItem('logData', JSON.stringify(logDataArray)); // Lưu vào localStorage

        data.forEach((logData, index) => {
            // Cập nhật log date
            if (logData.log_file === "pihole.log") {
                logDates[index] = "Hôm nay";  // Nếu là pihole.log, đặt là Hôm nay
            } else {
                logDates[index] = logData.log_time.split(" ")[0];  // Cập nhật ngày từ log_time
            }
            dailyData.Facebook[index] = logData.facebook_request_count;  // Cập nhật số lượng truy cập Facebook
            dailyData.Youtube[index] = logData.youtube_request_count;  // Cập nhật số lượng truy cập Youtube
            dailyData.Zalo[index] = logData.zalo_request_count;  // Cập nhật số lượng truy cập Zalo
            dailyData.Telegram[index] = logData.telegram_request_count;  // Cập nhật số lượng truy cập Telegram
        });

        // Vẽ lại biểu đồ sau khi có dữ liệu mới
        drawTrafficChart();
    })
    .catch(error => {
        console.error('Lỗi khi lấy dữ liệu từ API:', error);
    });
}

// Hàm để hiển thị popup khi người dùng nhấn vào biểu tượng ứng dụng
function showAppDetailsPopup(appName) {
    // Lọc tất cả các log dữ liệu từ logDataArray theo ứng dụng (ví dụ Facebook)
    let ipRequestCount = [];

    logDataArray.forEach(logData => {
        // Chỉ lấy dữ liệu của ứng dụng cần xem (ví dụ Facebook)
        if (logData.log_file.toLowerCase().includes(appName.toLowerCase())) {
            ipRequestCount = ipRequestCount.concat(logData.ip_request_count);  // Kết hợp các IP request từ tất cả các file log
        }
    });

    if (ipRequestCount.length === 0) {
        console.error(`Dữ liệu log không tìm thấy cho ${appName}`);
        alert(`Dữ liệu log không tìm thấy cho ${appName}`);
        return;
    }

    // Tính tổng số lượt yêu cầu cho tất cả các IP từ tất cả các ngày
    let totalRequests = {};
    ipRequestCount.forEach(item => {
        if (totalRequests[item.ip]) {
            totalRequests[item.ip] += item.count;
        } else {
            totalRequests[item.ip] = item.count;
        }
    });

    // Chuyển tổng số lượt yêu cầu thành một mảng các đối tượng
    let sortedIpRequest = [];
    for (let ip in totalRequests) {
        sortedIpRequest.push({ ip: ip, count: totalRequests[ip] });
    }

    // Sắp xếp mảng các IP theo số lượng yêu cầu giảm dần
    sortedIpRequest.sort((a, b) => b.count - a.count);

    // Lấy top 5 IP có số lượng yêu cầu cao nhất
    const top5Ips = sortedIpRequest.slice(0, 5);

    // Hiển thị popup
    const popupContainer = document.createElement("div");
    popupContainer.classList.add("popup-container");

    const popupContent = document.createElement("div");
    popupContent.classList.add("popup-content");

    // Thêm tiêu đề của popup
    const title = document.createElement("h4");
    title.innerText = `Chi tiết thống kê ${appName}`;
    popupContent.appendChild(title);

    // Thêm dữ liệu IP Request Count
    const ipRequestList = document.createElement("ul");
    top5Ips.forEach(item => {
        const li = document.createElement("li");
        li.innerText = `${item.ip}: ${item.count} lần truy cập`;
        ipRequestList.appendChild(li);
    });
    popupContent.appendChild(ipRequestList);

    // Thêm nút đóng popup
    const closeButton = document.createElement("button");
    closeButton.innerText = "Đóng";
    closeButton.addEventListener("click", () => {
        document.body.removeChild(popupContainer);
    });
    popupContent.appendChild(closeButton);

    popupContainer.appendChild(popupContent);
    document.body.appendChild(popupContainer);
}

// Hàm hiển thị biểu tượng ứng dụng trong legend và xử lý sự kiện click
function displayLegend() {
    const legendContainer = document.querySelector(".legend-container");

    // Kiểm tra nếu legend đã được hiển thị, tránh tạo lại
    if (legendContainer.childElementCount > 0) {
        return;  // Nếu đã có phần tử trong legendContainer, không làm gì thêm
    }

    apps.forEach((app) => {
        const legendItem = document.createElement("div");
        legendItem.classList.add("legend-item");

        // Tạo phần tử biểu tượng ứng dụng
        const icon = document.createElement("img");
        icon.src = app.icon;  // Lấy đường dẫn đến icon của ứng dụng
        icon.alt = app.name;  // Đặt alt cho icon
        icon.style.width = "30px";  // Kích thước biểu tượng
        icon.style.height = "30px";  // Kích thước biểu tượng
        legendItem.appendChild(icon);  // Thêm biểu tượng vào phần tử

        // Tạo phần tử tên ứng dụng
        const label = document.createElement("span");
        label.innerText = app.name;  // Tên ứng dụng
        label.style.marginTop = "5px";  // Khoảng cách giữa icon và tên ứng dụng
        legendItem.appendChild(label);  // Thêm tên ứng dụng vào phần tử

        // Thêm sự kiện click vào biểu tượng
        icon.addEventListener("click", () => {
            showAppDetailsPopup(app.name);  // Gọi hàm hiển thị popup khi click vào biểu tượng
        });

        // Thêm phần tử legendItem vào trong legendContainer
        legendContainer.appendChild(legendItem);
    });
}







