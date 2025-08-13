// Lưu trữ thông tin phiên trong localStorage để tái sử dụng khi reload
let sessionID = localStorage.getItem("pihole_sid") || null;
let csrfToken = localStorage.getItem("pihole_csrf") || null;
let sessionExpiration = parseInt(localStorage.getItem("pihole_expiration")) || 0;
let retryCount = 0;

document.addEventListener("DOMContentLoaded", function () {
    console.log("🔄 Kiểm tra phiên đăng nhập...");
    checkSession();
    setInterval(fetchBlockedDomains, 30000); // Cập nhật dữ liệu mỗi 30 giây
});

function checkSession() {
    const now = Math.floor(Date.now() / 1000);
    console.log(`🕒 Thời gian hiện tại: ${now}`);
    console.log(`🔎 Kiểm tra session... SID: ${sessionID}, Hết hạn: ${sessionExpiration}`);

    if (sessionID && now < sessionExpiration) {
        console.log(`✅ SID còn hiệu lực (${sessionExpiration - now} giây còn lại), kiểm tra với server...`);
        verifySessionOnServer();
    } else {
        console.log("🔄 SID hết hạn hoặc chưa có, xóa SID cũ và yêu cầu mới...");
        resetSession();  // 🛑 XÓA SID CŨ TRƯỚC KHI LẤY MỚI
        getSessionID();
    }
}


// 🔹 Kiểm tra `SID` trên server bằng `/api/stats`
function verifySessionOnServer() {
    if (!sessionID) {
        console.log("🔍 Không có SID, yêu cầu mới...");
        getSessionID();
        return;
    }

    console.log("🔄 Kiểm tra SID trên server...");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://192.168.2.55/api/stats/top_domains?blocked=true", true);
    xhr.setRequestHeader("X-FTL-SID", sessionID);
    xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(`📡 Phản hồi từ server: ${xhr.status}`);
            if (xhr.status === 200) {
                console.log("✅ SID hợp lệ, tiếp tục sử dụng.");
                fetchBlockedDomains();
            } else {
                console.warn("🔒 SID không hợp lệ hoặc đã hết hạn, hủy session...");
                logoutAllSessions(getSessionID);
            }
        }
    };

    xhr.send();
}

// 🔹 Hủy SID trước khi lấy mới để tránh lỗi session limit
function logoutAllSessions(callback) {
    if (!sessionID) {
        console.log("🔒 Không có SID, bỏ qua bước logout.");
        callback();
        return;
    }

    console.log(`🔒 Đang hủy SID hiện tại: ${sessionID}`);

    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", `https://192.168.2.55/api/auth`, true);
    xhr.setRequestHeader("X-FTL-SID", sessionID);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(`📡 Phản hồi từ server khi hủy SID: ${xhr.status}`);
            if (xhr.status === 204 || xhr.status === 410) {
                console.log("✅ Đã hủy SID cũ thành công.");
            } else {
                console.warn("⚠️ Không thể hủy phiên hoặc không có phiên nào hoạt động.");
            }
            resetSession();
            callback();
        }
    };

    xhr.send(null);
}

function resetSession() {
    console.warn("🔄 Đang xóa SID cũ khỏi localStorage do hết hạn...");
    sessionID = null;
    csrfToken = null;
    sessionExpiration = 0;
    localStorage.removeItem("pihole_sid");
    localStorage.removeItem("pihole_csrf");
    localStorage.removeItem("pihole_expiration");
}


// 🔹 Lấy SID mới từ Pi-hole nếu cần thiết
function getSessionID() {
    if (retryCount >= 3) {
        console.warn("⚠️ Đã thử lấy SID quá nhiều lần, dừng lại để tránh bị chặn.");
        return;
    }

    console.log("🔄 Đang yêu cầu SID mới...");
    
    var data = JSON.stringify({ "password": "admin123;" });

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://192.168.2.55/api/auth", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(`📡 Phản hồi từ server khi lấy SID: ${xhr.status}`);
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                sessionID = response.session.sid;
                csrfToken = response.session.csrf;
                sessionExpiration = Math.floor(Date.now() / 1000) + response.session.validity;

                // Lưu vào localStorage để dùng lại khi tải lại trang
                localStorage.setItem("pihole_sid", sessionID);
                localStorage.setItem("pihole_csrf", csrfToken);
                localStorage.setItem("pihole_expiration", sessionExpiration);

                console.log(`✅ Lấy SID thành công: ${sessionID}`);
                fetchBlockedDomains();
            } else {
                console.error("❌ Lỗi lấy SID:", xhr.responseText);
                retryCount++;
            }
        }
    };

    xhr.send(data);
}

// 🔹 Lấy danh sách Top Blocked Domains
function fetchBlockedDomains() {
    if (!sessionID) {
        console.warn("⚠️ Không có SID hợp lệ, lấy lại SID...");
        getSessionID();
        return;
    }

    console.log("📡 Gọi API lấy Top Blocked Domains...");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://192.168.2.55/api/stats/top_domains?blocked=true", true);
    xhr.setRequestHeader("X-FTL-SID", sessionID);
    xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(`📡 Phản hồi khi lấy dữ liệu: ${xhr.status}`);
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                console.log("📊 Dữ liệu Top Blocked Domains:", data);
                updateBlockedDomainsTable(data);
            } else {
                console.error("❌ Lỗi khi gọi API:", xhr.responseText);
            }
        }
    };

    xhr.send();
}

// 🔹 Hủy SID khi rời trang
window.addEventListener("beforeunload", function () {
    console.log("🔒 Hủy SID khi thoát trang...");
    logoutAllSessions();
});

function updateBlockedDomainsTable(data) {
    var tableBody = document.querySelector("#ad-frequency tbody");
    var overlay = document.querySelector("#ad-frequency .overlay");

    if (!tableBody) {
        console.error("❌ Không tìm thấy phần tử bảng trong DOM!");
        return;
    }

    // Xóa dữ liệu cũ trong bảng
    tableBody.innerHTML = "";

    // Kiểm tra dữ liệu hợp lệ
    if (!data || !data.domains || !Array.isArray(data.domains)) {
        console.error("❌ Dữ liệu API không hợp lệ hoặc thiếu `domains`:", data);
        return;
    }

    console.log("✅ Cập nhật bảng với dữ liệu mới...");

    // Lấy tổng số lượt truy cập từ danh sách
    let totalBlocked = data.domains.reduce((sum, item) => sum + item.count, 0);

    // Lặp qua danh sách domain và cập nhật bảng
    data.domains.forEach((item) => {
        let barWidth = (item.count / totalBlocked) * 100; // So với tổng số lượt truy cập của tất cả domain

        var row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.domain}</td>
            <td>${item.count}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${barWidth}%;"></div>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (overlay) {
        overlay.style.display = "none";
    }
}


