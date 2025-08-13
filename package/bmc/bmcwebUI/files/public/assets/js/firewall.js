updateFirewallBadge();

document.addEventListener("DOMContentLoaded", function () {
    // Mặc định ẩn badge khi trang load

    updateFirewallBadge(); // Cập nhật số request khi load trang
    setInterval(updateFirewallBadge, 3000); // Kiểm tra request mới mỗi 5 giây

    // Thêm sự kiện lắng nghe click vào overlay để tắt popup cho Yêu cầu truy cập mới
    const overlayNewRequest = document.querySelector('#firewall-popup-container');
    overlayNewRequest.addEventListener('click', function (event) {
        if (event.target === overlayNewRequest) {
            closeFirewallPopup(); // Gọi hàm đóng popup khi click ra ngoài
        }
    });

    // Thêm sự kiện lắng nghe click vào overlay để tắt popup cho Full Log
    const overlayFullLog = document.querySelector('#firewall-full-log-container');
    overlayFullLog.addEventListener('click', function (event) {
        if (event.target === overlayFullLog) {
            closeFullLogPopup(); // Gọi hàm đóng popup khi click ra ngoài
        }
    });
});

// 🟢 Mở popup và load dữ liệu từ API cho Yêu cầu truy cập mới
function toggleFirewallPopup() {
    fetch('/api/firewall/logs/mac')
    .then(response => response.json())
    .then(data => {
        console.log("Received MAC Logs:", data);  // Log ra dữ liệu API
        let tableBodyMac = document.querySelector("#firewall-popup-table-mac");
        tableBodyMac.innerHTML = ""; // Xóa dữ liệu cũ

        if (data.logs.length === 0) {
            tableBodyMac.innerHTML = "<tr><td colspan='5'>Không có yêu cầu truy cập mới</td></tr>";  // Cập nhật số cột cho MAC logs
        } else {
            data.logs.forEach(log => {
                console.log("MAC Log entry:", log);  // Log từng entry
                let row = `<tr>
                    <td>${log.mac}</td>  <!-- Hiển thị MAC Address -->
                    <td class="${log.status === 'accepted' ? 'status-accepted' : 'status-dropped'}">${log.status}</td>
                    <td>${new Date(log.timestamp).toLocaleString()}</td> <!-- Hiển thị Timestamp -->
                    <td>${log.ip || 'N/A'}</td>  <!-- Hiển thị IP Address -->
                    <td>${log.reason || 'N/A'}</td> <!-- Hiển thị Reason -->
                </tr>`;
                tableBodyMac.innerHTML += row;
            });
        }

            // Lấy dữ liệu từ Username logs
            fetch('/api/firewall/logs/username')
                .then(response => response.json())
                .then(data => {
                    let tableBodyUsername = document.querySelector("#firewall-popup-table-username");
                    tableBodyUsername.innerHTML = ""; // Xóa dữ liệu cũ

                    if (data.logs.length === 0) {
                        tableBodyUsername.innerHTML = "<tr><td colspan='5'>Không có yêu cầu truy cập mới</td></tr>";
                    } else {
                        data.logs.forEach(log => {
                            let statusClass = log.status === 'Failed' ? 'status-failed' : 'status-success';  // Áp dụng màu sắc theo trạng thái
                            let row = `<tr>
                                <td>${log.username}</td>
                                <td class="${statusClass}">${log.status}</td>
                                <td>${new Date(log.timestamp).toLocaleString()}</td>
                                <td>${log.ip}</td>
                                <td>${log.reason || 'N/A'}</td> <!-- Reason có thể là 'N/A' nếu không có -->
                            </tr>`;
                            tableBodyUsername.innerHTML += row;
                        });
                    }

                    // Hiển thị popup
                    document.getElementById("firewall-popup-container").style.display = "flex";
                    resetFirewallRequests();  // Reset MAC logs
                    resetUserRequests();     // Reset User logs
                })
                .catch(error => console.error("Error loading username logs:", error));
        })
        .catch(error => console.error("Error loading firewall logs:", error));
}
// Đóng popup Yêu cầu truy cập mới
function closeFirewallPopup() {
    document.getElementById("firewall-popup-container").style.display = "none";
}

// 🔥 Cập nhật badge động khi có request mới từ firewall
// 🔥 Cập nhật badge động khi có request mới từ firewall
function updateFirewallBadge() {
    // Cập nhật badge cho MAC logs
    fetch('/api/firewall/new-requests/mac')
        .then(response => response.json())
        .then(data => {
            let badgeMac = document.getElementById("firewall-badge");
            let countMac = data.count;
            badgeMac.innerText = countMac;
            badgeMac.style.display = countMac > 0 ? 'inline-block' : 'none';

            // Thêm hiệu ứng nảy cho MAC logs
            if (countMac > 0) {
                badgeMac.classList.add("alert");
                badgeMac.classList.add("bounce"); // Class để tạo hiệu ứng nảy
            } else {
                badgeMac.classList.remove("alert");
                badgeMac.classList.remove("bounce");
            }

            // Cập nhật tổng số lượng cho firewall-badge
            updateTotalBadge();
        })
        .catch(error => console.error("Error fetching MAC firewall request count:", error));

    // Cập nhật badge cho User logs
    fetch('/api/firewall/new-requests/username')
        .then(response => response.json())
        .then(data => {
            let badgeUser = document.getElementById("user-firewall-badge");
            let countUser = data.count;
            badgeUser.innerText = countUser;
            badgeUser.style.display = countUser > 0 ? 'inline-block' : 'none';

            // Thêm hiệu ứng nảy cho User logs
            if (countUser > 0) {
                badgeUser.classList.add("alert");
                badgeUser.classList.add("bounce"); // Class để tạo hiệu ứng nảy
            } else {
                badgeUser.classList.remove("alert");
                badgeUser.classList.remove("bounce");
            }

            // Cập nhật tổng số lượng cho firewall-badge
            updateTotalBadge();
        })
        .catch(error => console.error("Error fetching User firewall request count:", error));
}
// Cập nhật tổng số lượng
function updateTotalBadge() {
    // Lấy số lượng từ 2 badge riêng biệt
    const macCount = parseInt(document.getElementById("firewall-badge").innerText) || 0;
    const userCount = parseInt(document.getElementById("user-firewall-badge").innerText) || 0;

    // Cộng dồn số lượng
    const totalCount = macCount + userCount;

    // Cập nhật vào firewall-badge tổng
    let totalBadge = document.getElementById("firewall-badge");
    totalBadge.innerText = totalCount;
    totalBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';

    // Thêm hiệu ứng nảy nếu có yêu cầu mới
    if (totalCount > 0) {
        totalBadge.classList.add("alert");
        totalBadge.classList.add("bounce"); // Class để tạo hiệu ứng nảy
    } else {
        totalBadge.classList.remove("alert");
        totalBadge.classList.remove("bounce");
    }
}


// 🔥 Kiểm tra request mới mỗi 5 giây
setInterval(() => {
    updateFirewallBadge();
}, 3000);

// 🟢 Reset request khi mở popup (MAC logs)
function resetFirewallRequests() {
    fetch('/api/firewall/reset-requests/mac', { method: 'POST' })
        .then(() => {
            updateFirewallBadge(); // Cập nhật lại badge sau khi reset
            console.log("MAC Requests reset successfully");
        })
        .catch(error => console.error("Error resetting MAC requests:", error));
}

// 🟢 Reset request khi mở popup (User logs)
function resetUserRequests() {
    fetch('/api/firewall/reset-requests/username', { method: 'POST' })
        .then(() => {
            console.log("User Login Requests reset successfully");
        })
        .catch(error => console.error("Error resetting User login requests:", error));
}

// 🟢 Gán sự kiện vào nút "View Full Log" sau khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function () {
    let logBtn = document.querySelector(".firewall-log-btn");
    if (logBtn) {
        logBtn.addEventListener("click", openFullLogPopup);
    } else {
        console.error("Error: .firewall-log-btn not found!");
    }
});

// 🟢 Mở popup và load dữ liệu từ file log cho Full Log
function openFullLogPopup() {
    fetch('/api/firewall/full-log/mac')
        .then(response => response.json())
        .then(data => {
            let tableBodyMac = document.getElementById("firewall-full-log-table-mac");

            tableBodyMac.innerHTML = ""; // Xóa dữ liệu cũ

            if (data.logs.length === 0) {
                tableBodyMac.innerHTML = "<tr><td colspan='4'>Không có yêu cầu truy cập mới</td></tr>";
            } else {
                data.logs.forEach(log => {
                    let row = `<tr>
                        <td>${log.mac}</td>
                        <td class="${log.status === 'accepted' ? 'status-accepted' : 'status-dropped'}">${log.status}</td>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                        <td>${log.name || 'Unknown'}</td>
                    </tr>`;
                    tableBodyMac.innerHTML += row;
                });
            }

            // Lấy dữ liệu từ Username logs
            fetch('/api/firewall/full-log/username')
                .then(response => response.json())
                .then(data => {
                    let tableBodyUsername = document.getElementById("firewall-full-log-table-username");
                    tableBodyUsername.innerHTML = ""; // Xóa dữ liệu cũ

                    if (data.logs.length === 0) {
                        tableBodyUsername.innerHTML = "<tr><td colspan='5'>Không có yêu cầu truy cập mới</td></tr>";
                    } else {
                        data.logs.forEach(log => {
                            let row = `<tr>
                                <td>${log.username}</td>
                                <td class="${log.status === 'Failed' ? 'status-failed' : 'status-success'}">${log.status}</td>
                                <td>${new Date(log.timestamp).toLocaleString()}</td>
                                <td>${log.ip}</td>
                                <td>${log.reason}</td>
                            </tr>`;
                            tableBodyUsername.innerHTML += row;
                        });
                    }

                    document.getElementById("firewall-full-log-container").style.display = "flex";
                })
                .catch(error => console.error("Error loading username full logs:", error));
        })
        .catch(error => console.error("Error loading mac full logs:", error));
}

// Đóng popup View Full Log
function closeFullLogPopup() {
    document.getElementById("firewall-full-log-container").style.display = "none";
}



