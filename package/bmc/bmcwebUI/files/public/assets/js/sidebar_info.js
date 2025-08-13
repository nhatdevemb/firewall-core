import {
  sessionID,
  csrfToken,
  setDeviceInfo,
  checkSession,
  getSessionID,
} from "./pihole-session.js";

const REFRESH_INTERVAL = {
  ftl: 10000 // Cập nhật mỗi 10 giây
};

let ftlinfoTimer = null;

async function getDeviceInfo() {
  try {
    const response = await fetch("/get-current-device");
    const result = await response.json();
    if (result.success) {
      const deviceInfo = result.data;
      console.log("✅ Thông tin thiết bị đã lưu:", deviceInfo);
      setDeviceInfo(deviceInfo);
      return deviceInfo;
    } else {
      console.error("❌ Lỗi:", result.message);
      return null;
    }
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin thiết bị:", error);
    return null;
  }
}

async function updateFtlInfo() {
  try {
    const sid = await checkSession();
    if (!sid) {
      console.warn("⚠️ Không có SID hợp lệ để lấy thông tin FTL...");
      return;
    }

    const response = await fetch('/api/proxy/info/ftl', {
      method: 'GET',
      headers: {
        'X-FTL-SID': sessionID,
        'X-FTL-CSRF': csrfToken
      }
    });

    if (!response.ok) {
      throw new Error(`Phản hồi mạng không ổn: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const ftl = data.ftl;
    const database = ftl.database;
    const intl = new Intl.NumberFormat();

    const uptimeDate = new Date(Date.now() - ftl.uptime);
    const options = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    const uptimeFormatted = uptimeDate.toLocaleString('en-US', options);

    window.ftlData = {
      groups: intl.format(database.groups),
      clients: intl.format(database.clients),
      lists: intl.format(database.lists),
      gravity: intl.format(database.gravity),
      allowed: intl.format(database.domains.allowed + database.regex.allowed),
      allowedTitle: `Cho phép: ${intl.format(database.domains.allowed)} tên miền (exact) và ${intl.format(database.regex.allowed)} tên miền (regex)`,
      denied: intl.format(database.domains.denied + database.regex.denied),
      deniedTitle: `Chặn: ${intl.format(database.domains.denied)} tên miền (exact) và ${intl.format(database.regex.denied)} tên miền (regex)`,
      cpu: ftl["%cpu"].toFixed(1),
      mem: ftl["%mem"].toFixed(1),
      pid: ftl.pid,
      uptime: uptimeFormatted,
      privacyLevel: ftl.privacy_level,
      allowDestructive: ftl.allow_destructive
    };

    updateUI();

    clearTimeout(ftlinfoTimer);
    ftlinfoTimer = setTimeout(updateFtlInfo, REFRESH_INTERVAL.ftl);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật thông tin FTL:", error);
    apiFailure({ responseText: error.message });
  }
}

function updateUI() {
  if (!window.ftlData) return;

  const elements = {
    num_groups: document.querySelector("#num_groups"),
    num_clients: document.querySelector("#num_clients"),
    num_lists: document.querySelector("#num_lists"),
    num_gravity: document.querySelector("#num_gravity"),
    num_allowed: document.querySelector("#num_allowed"),
    num_denied: document.querySelector("#num_denied"),
    sysinfo_cpu_ftl: document.querySelector("#sysinfo-cpu-ftl"),
    sysinfo_ram_ftl: document.querySelector("#sysinfo-ram-ftl"),
    sysinfo_pid_ftl: document.querySelector("#sysinfo-pid-ftl"),
    sysinfo_uptime_ftl: document.querySelector("#sysinfo-uptime-ftl"),
    sysinfo_privacy_level: document.querySelector("#sysinfo-privacy_level"),
    sysinfo_ftl_overlay: document.querySelector("#sysinfo-ftl-overlay"),
    destructive_action: document.querySelectorAll(".destructive_action")
  };

  if (elements.num_groups) elements.num_groups.textContent = window.ftlData.groups;
  if (elements.num_clients) elements.num_clients.textContent = window.ftlData.clients;
  if (elements.num_lists) elements.num_lists.textContent = window.ftlData.lists;
  if (elements.num_gravity) elements.num_gravity.textContent = window.ftlData.gravity;
  if (elements.num_allowed) {
    elements.num_allowed.textContent = window.ftlData.allowed;
    elements.num_allowed.setAttribute("title", window.ftlData.allowedTitle);
  }
  if (elements.num_denied) {
    elements.num_denied.textContent = window.ftlData.denied;
    elements.num_denied.setAttribute("title", window.ftlData.deniedTitle);
  }
  if (elements.sysinfo_cpu_ftl) elements.sysinfo_cpu_ftl.textContent = `(${window.ftlData.cpu}% used by FTL)`;
  if (elements.sysinfo_ram_ftl) elements.sysinfo_ram_ftl.textContent = `(${window.ftlData.mem}% used by FTL)`;
  if (elements.sysinfo_pid_ftl) elements.sysinfo_pid_ftl.textContent = window.ftlData.pid;
  if (elements.sysinfo_uptime_ftl) elements.sysinfo_uptime_ftl.textContent = window.ftlData.uptime;
  if (elements.sysinfo_privacy_level) elements.sysinfo_privacy_level.textContent = window.ftlData.privacyLevel;
  if (elements.sysinfo_ftl_overlay) elements.sysinfo_ftl_overlay.style.display = "none";

  elements.destructive_action.forEach(action => {
    action.disabled = !window.ftlData.allowDestructive;
    action.title = window.ftlData.allowDestructive ? "" : "Destructive actions are disabled by a config setting";
  });
}

function apiFailure(data) {
  let text = data.responseText;
  if (data.responseJSON && data.responseJSON.error) {
    text = data.responseJSON.error;
  }
  showAlert("error", "", "Lỗi API", text);
  console.error("Lỗi API:", data);
}

function showAlert(type, icon, title, message) {
  let alertClass = "alert-info";
  switch (type) {
    case "success":
      alertClass = "alert-success";
      break;
    case "error":
      alertClass = "alert-danger";
      break;
    case "warning":
      alertClass = "alert-warning";
      break;
  }

  const alert = document.createElement("div");
  alert.className = `alert ${alertClass} alert-dismissible fade show`;
  alert.setAttribute("role", "alert");
  alert.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">×</span>
    </button>
  `;

  const alertsContainer = document.querySelector("#alerts");
  if (alertsContainer) {
    alertsContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }
}

// Hàm lấy và hiển thị thông tin hệ thống dưới các gauge
async function fetchAndShowSystemInfoPartial(part) {
  if (part === 'hostname') {
    fetch('/api/system/hostname')
      .then(res => res.json())
      .then(data => {
        document.querySelector('#sys-hostname').textContent = data.hostname || '...';
      });
  } else if (part === 'loadavg') {
    fetch('/api/system/loadavg')
      .then(res => res.json())
      .then(data => {
        if (data.loadavg) {
          const loadavgStr = data.loadavg.trim().split(/\s+/).join(', ');
          document.querySelector('#sys-loadavg').textContent = loadavgStr;
        } else {
          document.querySelector('#sys-loadavg').textContent = '...';
        }
      });
  } else if (part === 'ram') {
    fetch('/api/system/ram')
      .then(res => res.json())
      .then(data => {
        if (typeof data.used !== 'undefined' && typeof data.total !== 'undefined') {
          document.querySelector('#sys-ram').textContent = `${(data.used/1024).toFixed(1)} GB / ${(data.total/1024).toFixed(1)} GB`;
        } else {
          document.querySelector('#sys-ram').textContent = '...';
        }
      });
  } else if (part === 'disk') {
    fetch('/api/system/disk')
      .then(res => res.json())
      .then(data => {
        if (typeof data.used !== 'undefined' && typeof data.total !== 'undefined') {
          document.querySelector('#sys-disk').textContent = `${(data.used/1024).toFixed(1)} GB / ${(data.total/1024).toFixed(1)} GB`;
        } else {
          document.querySelector('#sys-disk').textContent = '...';
        }
      });
  } else if (part === 'swap') {
    fetch('/api/system/swap')
      .then(res => res.json())
      .then(data => {
        if (typeof data.used !== 'undefined' && typeof data.total !== 'undefined' && typeof data.percent !== 'undefined') {
          document.querySelector('#sys-swap').textContent = `${(data.used/1024).toFixed(1)} GB / ${(data.total/1024).toFixed(1)} GB (${data.percent}%)`;
        } else {
          document.querySelector('#sys-swap').textContent = '...';
        }
      });
  } else if (part === 'temp') {
    fetch('/api/system/tempCPU')
      .then(res => res.json())
      .then(data => {
        let tempStr = '';
        if (data.core1 && data.core2 && data.core1 !== 'N/A' && data.core2 !== 'N/A') {
          tempStr = `${data.core1}, ${data.core2}`;
        } else if (data.core1 && data.core1 !== 'N/A') {
          tempStr = data.core1;
        } else if (data.core2 && data.core2 !== 'N/A') {
          tempStr = data.core2;
        } else {
          tempStr = '...';
        }
        document.querySelector('#sys-temp').textContent = tempStr;
      });
  } else if (part === 'uptime') {
    fetch('/api/system/uptime')
      .then(res => res.json())
      .then(data => {
        document.querySelector('#sys-uptime').textContent = data.uptime || '...';
      });
  }
}

async function fetchAndShowSystemInfo() {
  // Hostname
  fetchAndShowSystemInfoPartial('hostname');
  // Uptime (chỉ cho System uptime)
  fetchAndShowSystemInfoPartial('uptime');
  // Loadavg
  fetchAndShowSystemInfoPartial('loadavg');
  // RAM
  fetchAndShowSystemInfoPartial('ram');
  // Disk
  fetchAndShowSystemInfoPartial('disk');
  // SWAP
  fetchAndShowSystemInfoPartial('swap');
  // Nhiệt độ CPU
  fetchAndShowSystemInfoPartial('temp');
  // Time (ngày giờ hiện tại) vẫn giữ nguyên realtime JS
  fetch('/api/system/time')
    .then(res => res.json())
    .then(data => {
      if (data.time) {
        startRealtimeClock(data.time);
      } else {
        document.querySelector('#sys-time').textContent = '...';
      }
    });
}

// Hàm cập nhật realtime đồng hồ
function startRealtimeClock(initialTimeStr) {
  // initialTimeStr dạng "YYYY-MM-DD HH:mm:ss"
  let [datePart, timePart] = initialTimeStr.split(' ');
  let [year, month, day] = datePart.split('-').map(Number);
  let [hour, minute, second] = timePart.split(':').map(Number);
  let current = new Date(year, month - 1, day, hour, minute, second);

  function updateClock() {
    // Format lại thành "HH:mm:ss    DD-MM-YYYY" (4 dấu cách, dùng &nbsp;)
    const pad = n => n.toString().padStart(2, '0');
    let str = `${pad(current.getHours())}:${pad(current.getMinutes())}:${pad(current.getSeconds())}&nbsp;&nbsp;&nbsp;&nbsp;` +
              `${pad(current.getDate())}-${pad(current.getMonth() + 1)}-${current.getFullYear()}`;
    const elem = document.getElementById('sys-time');
    if (elem) elem.innerHTML = str;
    current.setSeconds(current.getSeconds() + 1);
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// Khởi tạo: Lấy thông tin thiết bị trước, sau đó gọi updateFtlInfo
(async () => {
  const deviceInfo = await getDeviceInfo();
  if (!deviceInfo) {
    console.warn("⚠️ Không lấy được thông tin thiết bị, dừng gọi API...");
    return;
  }
  await updateFtlInfo();
})();

// Gọi hàm này khi trang load
fetchAndShowSystemInfo();

// Đặt interval refresh cho các trường
setInterval(() => {
  fetchAndShowSystemInfoPartial('hostname');
  fetchAndShowSystemInfoPartial('loadavg');
  fetchAndShowSystemInfoPartial('ram');
  fetchAndShowSystemInfoPartial('disk');
  fetchAndShowSystemInfoPartial('swap');
  fetchAndShowSystemInfoPartial('temp');
}, 30000); // 30 giây
setInterval(() => {
  fetchAndShowSystemInfoPartial('uptime');
}, 60000); // 60 giây

export { updateFtlInfo, updateUI, ftlinfoTimer };