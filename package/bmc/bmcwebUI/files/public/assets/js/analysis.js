// Import các hàm và biến từ checksession.js
import {
  sessionID,
  csrfToken,
  setDeviceInfo,
  checkSession,
  getSessionID,
} from "./pihole-session.js";

// Biến global để lưu thông tin thiết bị
let deviceInfo_analysis = null;

// Hàm lấy thông tin thiết bị từ session
async function getDeviceInfo() {
  try {
    const response = await fetch("/get-current-device");
    const result = await response.json();

    if (result.success) {
      deviceInfo_analysis = result.data;
      console.log("✅ Thông tin thiết bị đã lưu:", deviceInfo_analysis);
      return deviceInfo_analysis;
    } else {
      console.error("❌ Lỗi:", result.message);
      return null;
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin thiết bị:", error);
    return null;
  }
}

// Test function to call domains API
function testDomainsAPI() {
    console.log("📡 Testing domains API...");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://${deviceInfo_analysis.device_ip}/api/domains`, true);
    xhr.setRequestHeader("X-FTL-SID", sessionID);
    xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(`📡 Phản hồi khi test domains API: ${xhr.status}`);
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log("📊 Dữ liệu Domains:", data);
            } else {
                console.error("❌ Lỗi khi test domains API:", xhr.responseText);
            }
        }
    };
    xhr.send();
}

// Test function to call groups API
function testGroupsAPI() {
    console.log("📡 Testing groups API...");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://${deviceInfo_analysis.device_ip}/api/groups`, true);
    xhr.setRequestHeader("X-FTL-SID", sessionID);
    xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            console.log(`📡 Phản hồi khi test groups API: ${xhr.status}`);
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log("📊 Dữ liệu Groups:", data);
            } else {
                console.error("❌ Lỗi khi test groups API:", xhr.responseText);
            }
        }
    };
    xhr.send();
}

// Khởi tạo khi trang được tải
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Lấy thông tin thiết bị trước
        await getDeviceInfo();

        // Thiết lập thông tin thiết bị cho checksession.js
        setDeviceInfo(deviceInfo_analysis);

        // Kiểm tra session và lấy SID
        const sid = await checkSession();

        // Đảm bảo có SID hợp lệ trước khi gọi các API
        if (!sid) {
            console.warn("⚠️ Không lấy được SID hợp lệ sau khi kiểm tra session, dừng gọi API...");
            return;
        }

        // Test domains and groups APIs
        testDomainsAPI();
        testGroupsAPI();

        // Gọi các hàm lấy dữ liệu sau khi có SID
        fetchClientActivityOverTime();
        fetchTotalQueriesOverTime();
        fetchAllDomainsData();

        // Định kỳ gọi API để cập nhật dữ liệu
        setInterval(function () {
            if (!sessionID) {
                console.warn("⚠️ Không có SID hợp lệ, bỏ qua cập nhật định kỳ...");
                return;
            }
            fetchAllDomainsData();
        }, 90000);
    } catch (error) {
        console.error("❌ Lỗi trong quá trình khởi tạo:", error);
    }
});

// 🔹 Gọi tất cả các API đồng thời
function fetchAllDomainsData() {
  if (!sessionID) {
    console.warn("⚠️ Không có SID hợp lệ, lấy lại SID...");
    getSessionID();
    return;
  }

  // Gọi API Top Blocked Domains
  var xhrBlocked = new XMLHttpRequest();
  xhrBlocked.open("GET", `https://${deviceInfo_analysis.device_ip}/api/stats/top_domains?blocked=true`, true);
  xhrBlocked.setRequestHeader("X-FTL-SID", sessionID);
  xhrBlocked.setRequestHeader("X-FTL-CSRF", csrfToken);

  xhrBlocked.onreadystatechange = function () {
    if (xhrBlocked.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi khi lấy dữ liệu blocked: ${xhrBlocked.status}`);
      if (xhrBlocked.status === 200) {
        var data = JSON.parse(xhrBlocked.responseText);
        console.log("📊 Dữ liệu Top Blocked Domains:", data);
        updateBlockedDomainsTable(data);
      } else {
        console.error("❌ Lỗi khi gọi API blocked:", xhrBlocked.responseText);
      }
    }
  };

  xhrBlocked.send();

  // Gọi API Top Permitted Domains
  var xhrPermitted = new XMLHttpRequest();
  xhrPermitted.open("GET", `https://${deviceInfo_analysis.device_ip}/api/stats/top_domains`, true);
  xhrPermitted.setRequestHeader("X-FTL-SID", sessionID);
  xhrPermitted.setRequestHeader("X-FTL-CSRF", csrfToken);

  xhrPermitted.onreadystatechange = function () {
    if (xhrPermitted.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi khi lấy dữ liệu permitted: ${xhrPermitted.status}`);
      if (xhrPermitted.status === 200) {
        var data = JSON.parse(xhrPermitted.responseText);
        console.log("📊 Dữ liệu Top Permitted Domains:", data);
        updatePermittedDomainsTable(data);
      } else {
        console.error("❌ Lỗi khi gọi API permitted:", xhrPermitted.responseText);
      }
    }
  };

  xhrPermitted.send();

  // Gọi API Top Clients (Total)
  var xhrClientsTotal = new XMLHttpRequest();
  xhrClientsTotal.open("GET", `https://${deviceInfo_analysis.device_ip}/api/stats/top_clients`, true);
  xhrClientsTotal.setRequestHeader("X-FTL-SID", sessionID);
  xhrClientsTotal.setRequestHeader("X-FTL-CSRF", csrfToken);

  xhrClientsTotal.onreadystatechange = function () {
    if (xhrClientsTotal.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi khi lấy dữ liệu top clients: ${xhrClientsTotal.status}`);
      if (xhrClientsTotal.status === 200) {
        var data = JSON.parse(xhrClientsTotal.responseText);
        console.log("📊 Dữ liệu Top Clients (Total):", data);
        updateClientsTotalTable(data);
      } else {
        console.error("❌ Lỗi khi gọi API top clients:", xhrClientsTotal.responseText);
      }
    }
  };

  xhrClientsTotal.send();

  // Gọi API Top Clients (Blocked)
  var xhrClientsBlocked = new XMLHttpRequest();
  xhrClientsBlocked.open("GET", `https://${deviceInfo_analysis.device_ip}/api/stats/top_clients?blocked=true`, true);
  xhrClientsBlocked.setRequestHeader("X-FTL-SID", sessionID);
  xhrClientsBlocked.setRequestHeader("X-FTL-CSRF", csrfToken);

  xhrClientsBlocked.onreadystatechange = function () {
    if (xhrClientsBlocked.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi khi lấy dữ liệu top clients blocked: ${xhrClientsBlocked.status}`);
      if (xhrClientsBlocked.status === 200) {
        var data = JSON.parse(xhrClientsBlocked.responseText);
        console.log("📊 Dữ liệu Top Clients (Blocked Only):", data);
        updateClientsBlockedTable(data);
      } else {
        console.error("❌ Lỗi khi gọi API top clients blocked:", xhrClientsBlocked.responseText);
      }
    }
  };

  xhrClientsBlocked.send();
}

// 🔹 Gọi API Client Activity Over Time
let clientActivityChart;

function fetchClientActivityOverTime() {
  console.log("📡 Gọi API /api/history/clients (client activity)...");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", `https://${deviceInfo_analysis.device_ip}/api/history/clients`, true);
  xhr.setRequestHeader("X-FTL-SID", sessionID);
  xhr.setRequestHeader("X-FTL-CSRF", csrfToken);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi client activity: ${xhr.status}`);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log("📊 Dữ liệu client activity:", data);
        renderClientActivityChart(data);
      } else {
        console.error("❌ Lỗi khi gọi API client activity:", xhr.responseText);
      }
    }
  };
  xhr.send();
}

function renderClientActivityChart(data) {
  const ctx = document.getElementById("clientActivityChart").getContext("2d");

  if (!data || !data.history || !Array.isArray(data.history)) {
    console.warn("⚠️ Không có dữ liệu hợp lệ để vẽ biểu đồ.");
    return;
  }

  const labels = []; // Chứa các timestamp cho biểu đồ
  const datasets = []; // Các dataset cho mỗi client

  // Lấy dữ liệu từ mỗi client và chuẩn bị các dataset
  const clientNames = Object.keys(data.clients);

  // Duyệt qua các client và tạo dataset cho từng client
  clientNames.forEach((ip, index) => {
    const name = data.clients[ip].name || ip;
    const clientData = data.history.map((item) => item.data[ip] || 0); // Dữ liệu client theo timestamp
    const color = `hsl(${(index * 60) % 360}, 70%, 50%)`; // Tạo màu sắc cho mỗi client

    // Đặt label cho client "pi.hole" là "Firewall_tang_2", các client khác giữ nguyên
    const label = name === "pi.hole" ? "Firewall_tang_2" : name;

    datasets.push({
      label: label, // Đặt tên client cho mỗi dataset
      data: clientData, // Dữ liệu client theo timestamp
      backgroundColor: color,
      borderColor: color,
      fill: true, // Cho phép fill cho biểu đồ cột
      stack: "client", // Đặt stack cho biểu đồ
    });
  });

  // Tạo biểu đồ với dữ liệu
  new Chart(ctx, {
    type: "bar", // Sử dụng bar chart
    data: {
      labels: data.history.map((item) => new Date(item.timestamp * 1000)), // Chuyển timestamp thành Date
      datasets: datasets, // Dữ liệu được tạo cho các client
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: true, position: "bottom" },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "hour", tooltipFormat: "HH:mm" },
          title: { display: true, text: "Time" },
          stacked: true, // Cho phép chồng dữ liệu trên trục X
          grid: { color: "rgba(225, 225, 225, 0.3)" },
        },
        y: {
          beginAtZero: true,
          stacked: true, // Cho phép các client chồng lên nhau
          title: { display: true, text: "Truy vấn" },
          grid: { color: "rgba(225, 225, 225, 0.3)" },
          ticks: {
            color: "#555",
            precision: 0, // Không hiển thị số thập phân
          },
        },
      },
      elements: {
        bar: {
          borderWidth: 1, // Định nghĩa độ dày của cột
        },
      },
      hover: { animationDuration: 0 },
    },
  });
}

// 🔹 Gọi API Total Queries Over Time
let totalQueriesChart;

function fetchTotalQueriesOverTime() {
  console.log("📡 Đang gọi API /api/history để lấy dữ liệu Total Queries Over Time...");

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `https://${deviceInfo_analysis.device_ip}/api/history`, true);
  xhr.setRequestHeader("X-FTL-SID", sessionID);
  xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi /api/history: ${xhr.status}`);

      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log("📊 Dữ liệu Total Queries Over Time:", data);
        renderTotalQueriesChart(data);
      } else {
        console.error("❌ Lỗi khi gọi API /api/history:", xhr.responseText);
      }
    }
  };

  xhr.send();
}

function renderTotalQueriesChart(data) {
  const ctx = document.getElementById("totalQueriesChart").getContext("2d");

  if (!data || !data.history || !Array.isArray(data.history)) {
    console.warn("⚠️ Không có dữ liệu hợp lệ để vẽ biểu đồ.");
    return;
  }

  const labels = [];
  const otherData = [];
  const blockedData = [];
  const cachedData = [];
  const forwardedData = [];

  data.history.forEach((item) => {
    const timestamp = new Date(item.timestamp * 1000);
    labels.push(timestamp);

    const other = item.total - (item.blocked + item.cached + item.forwarded);
    otherData.push(other);
    blockedData.push(item.blocked);
    cachedData.push(item.cached);
    forwardedData.push(item.forwarded);
  });

  // Hủy chart cũ nếu tồn tại để tránh vẽ đè
  if (totalQueriesChart) {
    totalQueriesChart.destroy();
  }

  totalQueriesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Truy vấn DNS khác",
          data: otherData,
          backgroundColor: "#7f8c8d",
          stack: "dns",
        },
        {
          label: "Truy vấn DNS đã Chặn",
          data: blockedData,
          backgroundColor: "#e74c3c",
          stack: "dns",
        },
        {
          label: "Truy vấn DNS đã lưu vào Bộ nhớ đệm",
          data: cachedData,
          backgroundColor: "#27ae60",
          stack: "dns",
        },
        {
          label: "Truy vấn DNS đã Chuyển tiếp",
          data: forwardedData,
          backgroundColor: "#2980b9",
          stack: "dns",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function (tooltipItem) {
              const value = tooltipItem.raw || 0;
              return `${tooltipItem.dataset.label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "hour",
            tooltipFormat: "HH:mm",
            displayFormats: {
              hour: "HH:mm",
            },
          },
          stacked: true,
          grid: { color: "rgba(225, 225, 225, 0.3)" },
          title: {
            display: true,
            text: "Time",
          },
        },
        y: {
          beginAtZero: true,
          stacked: true,
          grid: { color: "rgba(225, 225, 225, 0.3)" },
          title: {
            display: true,
            text: "Số lượng truy vấn",
          },
        },
      },
    },
  });
}

// 🔹 Cập nhật bảng Top Blocked Domains
function updateBlockedDomainsTable(data) {
  var tableBody = document.querySelector("#blockedDomainsTable");
  var overlay = document.querySelector("#loadingOverlay");

  if (!tableBody) {
    console.error("❌ Không tìm thấy phần tử bảng trong DOM!");
    return;
  }

  tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

  if (!data || !data.domains || !Array.isArray(data.domains)) {
    console.error("❌ Dữ liệu API không hợp lệ hoặc thiếu `domains`:", data);
    return;
  }

  console.log("✅ Cập nhật bảng với dữ liệu mới...");

  let totalBlocked = data.domains.reduce((sum, item) => sum + item.count, 0);

  data.domains.forEach((item) => {
    let barWidth = (item.count / totalBlocked) * 100;

    var row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.domain}</td>
      <td>${item.count}</td>
      <td>
        <div class="progress-container">
          <div class="progress-bar blocked" style="width: ${barWidth}%;"></div>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  if (overlay) {
    overlay.style.display = "none";
  }
}

// 🔹 Cập nhật bảng Top Permitted Domains
function updatePermittedDomainsTable(data) {
  var tableBody = document.querySelector("#permittedDomainsTable");
  var overlay = document.querySelector("#loadingOverlay");

  if (!tableBody) {
    console.error("❌ Không tìm thấy phần tử bảng trong DOM!");
    return;
  }

  tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

  if (!data || !data.domains || !Array.isArray(data.domains)) {
    console.error("❌ Dữ liệu API không hợp lệ hoặc thiếu `domains`:", data);
    return;
  }

  console.log("✅ Cập nhật bảng với dữ liệu mới...");

  let totalPermitted = data.domains.reduce((sum, item) => sum + item.count, 0); // Tính tổng số lượt truy cập

  data.domains.forEach((item) => {
    let barWidth = (item.count / totalPermitted) * 100;

    var row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.domain}</td>
      <td>${item.count}</td>
      <td>
        <div class="progress-container">
          <div class="progress-bar permitted" style="width: ${barWidth}%;"></div>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  if (overlay) {
    overlay.style.display = "none";
  }
}

// 🔹 Cập nhật bảng Top Clients (Total)
function updateClientsTotalTable(data) {
  var tableBody = document.querySelector("#topClientsTable");

  if (!tableBody) {
    console.error("❌ Không tìm thấy phần tử bảng trong DOM!");
    return;
  }

  tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

  if (!data || !data.clients || !Array.isArray(data.clients)) {
    console.error("❌ Dữ liệu API không hợp lệ hoặc thiếu `clients`:", data);
    return;
  }

  let totalClients = data.clients.reduce((sum, item) => sum + item.count, 0); // Tính tổng số requests của tất cả client

  // Duyệt qua từng client và tìm chủ sở hữu, giữ thứ tự ban đầu
  let clientRequests = data.clients.map((item) => {
    return fetchOwnerFromIP(item.ip).then((owner) => {
      item.owner = owner || "Unknown"; // Lưu chủ sở hữu hoặc 'Unknown'
      // Đặt IP 127.0.0.1 là localhost mặc định
      if (item.ip === "127.0.0.1") {
        item.owner = "localhost";
      }
      return item;
    });
  });

  // Chờ tất cả các yêu cầu API trả về, rồi cập nhật bảng
  Promise.all(clientRequests).then((clients) => {
    clients.forEach((item) => {
      let barWidth = (item.count / totalClients) * 100; // Tính chiều rộng thanh tiến trình theo tỷ lệ

      var row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.ip} - ${item.owner}</td>  <!-- Hiển thị tên client hoặc IP nếu không có tên -->
        <td>${item.count}</td>
        <td>
          <div class="progress-container">
            <div class="progress-bar permitted" style="width: ${barWidth}%;"></div>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// 🔹 Cập nhật bảng Top Clients (Blocked Only)
function updateClientsBlockedTable(data) {
  var tableBody = document.querySelector("#blockedClientsTable");

  if (!tableBody) {
    console.error("❌ Không tìm thấy phần tử bảng trong DOM!");
    return;
  }

  tableBody.innerHTML = ""; // Xóa dữ liệu cũ trong bảng

  if (!data || !data.clients || !Array.isArray(data.clients)) {
    console.error("❌ Dữ liệu API không hợp lệ hoặc thiếu `clients`:", data);
    return;
  }

  let totalBlockedClients = data.clients.reduce((sum, item) => sum + item.count, 0); // Tính tổng số blocked requests của tất cả client

  // Duyệt qua từng client và tìm chủ sở hữu, giữ thứ tự ban đầu
  let clientRequests = data.clients.map((item) => {
    return fetchOwnerFromIP(item.ip).then((owner) => {
      item.owner = owner || "Unknown"; // Lưu chủ sở hữu hoặc 'Unknown'
      if (item.ip === "127.0.0.1") {
        item.owner = "localhost";
      }
      return item;
    });
  });

  // Chờ tất cả các yêu cầu API trả về, rồi cập nhật bảng
  Promise.all(clientRequests).then((clients) => {
    clients.forEach((item) => {
      let barWidth = (item.count / totalBlockedClients) * 100; // Tính chiều rộng thanh tiến trình theo tỷ lệ

      var row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.ip} - ${item.owner}</td>  <!-- Hiển thị tên client hoặc IP nếu không có tên -->
        <td>${item.count}</td>
        <td>
          <div class="progress-container">
            <div class="progress-bar blocked" style="width: ${barWidth}%;"></div>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// 🔹 Hàm tìm chủ sở hữu từ IP (dùng API bạn đã tạo)
async function fetchOwnerFromIP(ip) {
  try {
    const response = await fetch("/get-owner-from-ip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ip: ip }),
    });

    const data = await response.json();
    return data.owner || "Unknown"; // Trả về tên chủ sở hữu hoặc "Unknown" nếu không tìm thấy
  } catch (error) {
    console.error("Lỗi khi lấy tên chủ sở hữu:", error);
    return "Unknown"; // Trả về Unknown nếu có lỗi
  }
}