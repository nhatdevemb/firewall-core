// public/assets/js/circleDashboard.js
// Render gauge style dashboard for CPU, RAM, Virtual Memory, Disk

document.addEventListener('DOMContentLoaded', function() {
  // Hàm tạo vạch chia SVG overlay
  function createTicksSVG(size, tickCount, radius, tickLength, tickColor) {
    let svg = `<svg width='${size}' height='${size}' style='position:absolute;left:0;top:0;pointer-events:none;z-index:2;'>`;
    let cx = size/2, cy = size/2;
    for (let i = 0; i < tickCount; i++) {
      let angle = (2 * Math.PI * i) / tickCount;
      let x1 = cx + (radius - tickLength) * Math.cos(angle);
      let y1 = cy + (radius - tickLength) * Math.sin(angle);
      let x2 = cx + radius * Math.cos(angle);
      let y2 = cy + radius * Math.sin(angle);
      svg += `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}' stroke='${tickColor}' stroke-width='2'/>`;
    }
    svg += '</svg>';
    return svg;
  }

  function getGaugeColor(percent) {
    if (percent <= 50) return '#26d99a'; // Xanh
    if (percent <= 80) return '#fbc02d'; // Vàng
    return '#e53935'; // Đỏ
  }

  function renderGauge(gaugeElem, percent) {
    const color = getGaugeColor(percent);
    gaugeElem.innerHTML = '';
    gaugeElem.style.position = 'relative';
    gaugeElem.style.width = '180px';
    gaugeElem.style.height = '180px';
    // SVG vạch chia
    gaugeElem.innerHTML += createTicksSVG(180, 24, 75, 12, '#353942');
    // Div chứa ProgressBar.js
    let barDiv = document.createElement('div');
    barDiv.style.position = 'absolute';
    barDiv.style.left = '0';
    barDiv.style.top = '0';
    barDiv.style.width = '180px';
    barDiv.style.height = '180px';
    barDiv.style.zIndex = '3';
    gaugeElem.appendChild(barDiv);
    // Render ProgressBar.js
    var bar = new ProgressBar.Circle(barDiv, {
      strokeWidth: 5,
      trailWidth: 3,
      trailColor: '#23272f',
      color: color,
      easing: 'easeInOut',
      duration: 1000,
      text: { value: '' },
      svgStyle: { width: '180px', height: '180px', display: 'block', position: 'relative', zIndex: 3 }
    });
    bar.animate(percent / 100);
    // Số % ở giữa tâm
    let percentDiv = document.createElement('div');
    percentDiv.className = 'gauge-percent';
    percentDiv.textContent = percent + '%';
    percentDiv.style.position = 'absolute';
    percentDiv.style.left = '50%';
    percentDiv.style.top = '50%';
    percentDiv.style.transform = 'translate(-50%, -50%)';
    percentDiv.style.fontSize = '1.15rem';
    percentDiv.style.zIndex = '4';
    gaugeElem.appendChild(percentDiv);
  }

  function createGauge(id, percent) {
    const gaugeElem = document.querySelector(id);
    if (!gaugeElem) return;
    renderGauge(gaugeElem, percent);
  }

  window.updateGauge = function(id, percent) {
    const gaugeElem = document.querySelector(id);
    if (!gaugeElem) return;
    renderGauge(gaugeElem, percent);
  };

  // Số liệu mẫu ban đầu
  createGauge('#gauge-cpu', 11);
  createGauge('#gauge-ram', 43);
  createGauge('#gauge-disk', 80);
  createGauge('#gauge-virtual', 99);

  // ========== Gauge Top IPs: Đường tròn chia 5 màu nổi bật cố định ==========
  function renderTopIPsGauge(gaugeElem, ips) {
    gaugeElem.innerHTML = '';
    gaugeElem.style.position = 'relative';
    gaugeElem.style.width = '180px';
    gaugeElem.style.height = '180px';
    // SVG vạch chia
    gaugeElem.innerHTML += createTicksSVG(180, 24, 82, 12, '#353942');
    // SVG gauge chia màu
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '180');
    svg.setAttribute('height', '180');
    svg.setAttribute('viewBox', '0 0 180 180');
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.zIndex = '3';
    // Tooltip
    let tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.background = 'rgba(30,30,30,0.97)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '4px 10px';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '0.95rem';
    tooltip.style.zIndex = '9999';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    // 5 màu nổi bật cố định
    const colors = ['#26d99a', '#fbc02d', '#e53935', '#2979ff', '#ab47bc'];
    // Tính tổng truy cập (chấp nhận cả 'count' và 'total')
    const total = ips.reduce((sum, ip) => sum + (ip.count !== undefined ? ip.count : (ip.total || 0)), 0);
    // Vẽ từng đoạn
    let startAngle = 0;
    ips.forEach((ip, idx) => {
      const value = ip.count !== undefined ? ip.count : (ip.total || 0);
      const percent = total > 0 ? value / total : 0;
      let angle = percent * 360;
      // Nếu chỉ có 1 IP hoặc percent = 1, vẽ full vòng
      if (ips.length === 1 && value > 0) angle = 359.99;
      if (angle === 0 && value > 0) angle = 359.99;
      const endAngle = startAngle + angle;
      // Vẽ arc
      const path = describeArc(90, 90, 82, startAngle, endAngle);
      const arc = document.createElementNS(svgNS, 'path');
      arc.setAttribute('d', path);
      arc.setAttribute('stroke', colors[idx % colors.length]);
      arc.setAttribute('stroke-width', '12');
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke-linecap', 'butt');
      // Tooltip events
      arc.addEventListener('mousemove', function(e) {
        tooltip.textContent = ip.ip;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top = (e.clientY - 8) + 'px';
      });
      arc.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
      });
      svg.appendChild(arc);
      startAngle = endAngle;
    });
    // Nếu ít hơn 5 IP, vẽ phần còn lại màu nền xám
    if (ips.length < 5 && startAngle < 360) {
      const path = describeArc(90, 90, 82, startAngle, 360);
      const arc = document.createElementNS(svgNS, 'path');
      arc.setAttribute('d', path);
      arc.setAttribute('stroke', '#23272f');
      arc.setAttribute('stroke-width', '12');
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke-linecap', 'butt');
      svg.appendChild(arc);
    }
    gaugeElem.appendChild(svg);
    // Không hiển thị số % ở giữa
  }
  // Hàm vẽ arc SVG
  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? '1' : '0';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  }
  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180.0;
    return {
      x: cx + (r * Math.cos(angleRad)),
      y: cy + (r * Math.sin(angleRad))
    };
  }
  function fetchTopIPs() {
    console.log('Fetching top IPs...');
    fetch('/api/system/top-ips')
      .then(res => {
        console.log('Top IPs response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Top IPs data:', data);
        const gaugeElem = document.getElementById('gauge-temp');
        console.log('Gauge element found:', gaugeElem);
        if (!gaugeElem) {
          console.error('Gauge element not found!');
          return;
        }
        renderTopIPsGauge(gaugeElem, data.ips || []);
        // Dưới gauge chỉ có dòng "Top IP quản trị"
        const infoElem = document.getElementById('temp-info');
        if (infoElem) {
          infoElem.textContent = 'Top IP Quản trị';
          infoElem.style.fontFamily = "'Montserrat','Roboto',Arial,sans-serif";
          infoElem.style.fontWeight = '700';
          infoElem.style.fontSize = '1.08em';
          infoElem.style.letterSpacing = '0.5px';
          infoElem.style.color = '#fff';
          infoElem.style.textTransform = 'none';
          infoElem.style.textShadow = 'none';
        }
        console.log('Top IPs gauge rendered successfully');
      })
      .catch((error) => {
        console.error('Error fetching top IPs:', error);
        // Fallback: 3 IP mẫu
        const gaugeElem = document.getElementById('gauge-temp');
        if (!gaugeElem) return;
        renderTopIPsGauge(gaugeElem, [
          { ip: '192.168.1.100', count: 45 },
          { ip: '192.168.1.101', count: 32 },
          { ip: '192.168.1.102', count: 28 }
        ]);
        const infoElem = document.getElementById('temp-info');
        if (infoElem) {
          infoElem.textContent = 'Top IP Quản trị';
          infoElem.style.fontFamily = "'Montserrat','Roboto',Arial,sans-serif";
          infoElem.style.fontWeight = '700';
          infoElem.style.fontSize = '1.08em';
          infoElem.style.letterSpacing = '0.5px';
          infoElem.style.color = '#fff';
          infoElem.style.textTransform = 'none';
          infoElem.style.textShadow = 'none';
        }
      });
  }
  fetchTopIPs();
  setInterval(fetchTopIPs, 30000);

  // Hàm fetch và cập nhật gauge DISK SPACE
  function fetchDiskSpace() {
    fetch('/api/system/disk')
        .then(response => response.json())
        .then(data => {
            let percent = data.percent;
            if (window.updateGauge) window.updateGauge('#gauge-disk', percent);
            updateDiskGauge(data);
        })
        .catch(error => {
            console.error('Error fetching disk space:', error);
        });
  }
  fetchDiskSpace();
  setInterval(fetchDiskSpace, 30000);

  // Sau khi renderGauge xong, chỉnh lại margin-top cho .gauge-info
  function setGaugeInfoSpacing() {
    document.querySelectorAll('.gauge-info').forEach(function(elem) {
      elem.style.marginTop = '18px';
    });
  }
  setGaugeInfoSpacing();

  // Nếu có API, cập nhật realtime:
  function fetchSwap() {
    fetch('/api/system/swap')
      .then(res => res.json())
      .then(data => {
        if (window.updateGauge) window.updateGauge('#gauge-virtual', data.percent);
        updateSwapGauge(data);
      })
      .catch(() => {});
  }
  fetchSwap();
  setInterval(fetchSwap, 30000);

  // Sau khi cập nhật gauge SWAP và DISK, cập nhật nội dung dưới gauge và tooltip
  function updateSwapGauge(data) {
    var swapDetailElem = document.getElementById('virtual-info');
    if (swapDetailElem) {
        swapDetailElem.textContent = `SWAP: ${(data.total/1024).toFixed(1)} GB`;
        swapDetailElem.setAttribute('data-tooltip', `Đang dùng: ${(data.used/1024).toFixed(1)} GB (${data.percent}%)`);
    }
    var gaugeElem = document.getElementById('gauge-virtual');
    if (gaugeElem) {
        gaugeElem.onmouseenter = function(e) {
            let tooltip = document.createElement('div');
            tooltip.id = 'swap-tooltip';
            tooltip.style.position = 'fixed';
            tooltip.style.background = 'rgba(30,30,30,0.97)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '6px 14px';
            tooltip.style.borderRadius = '6px';
            tooltip.style.fontSize = '1em';
            tooltip.style.zIndex = '9999';
            tooltip.style.pointerEvents = 'none';
            tooltip.textContent = `Đang dùng: ${(data.used/1024).toFixed(1)} GB (${data.percent}%)`;
            document.body.appendChild(tooltip);
            gaugeElem.onmousemove = function(ev) {
                tooltip.style.left = (ev.clientX + 16) + 'px';
                tooltip.style.top = (ev.clientY - 8) + 'px';
            };
        };
        gaugeElem.onmouseleave = function() {
            let tooltip = document.getElementById('swap-tooltip');
            if (tooltip) tooltip.remove();
        };
    }
  }
  function updateDiskGauge(data) {
    var diskDetailElem = document.getElementById('disk-info');
    if (diskDetailElem) {
        diskDetailElem.textContent = `DISK SPACE: ${(data.total/1024).toFixed(1)} GB`;
        diskDetailElem.setAttribute('data-tooltip', `Đang dùng: ${(data.used/1024).toFixed(1)} GB (${data.percent}%)`);
    }
    var gaugeElem = document.getElementById('gauge-disk');
    if (gaugeElem) {
        gaugeElem.onmouseenter = function(e) {
            let tooltip = document.createElement('div');
            tooltip.id = 'disk-tooltip';
            tooltip.style.position = 'fixed';
            tooltip.style.background = 'rgba(30,30,30,0.97)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '6px 14px';
            tooltip.style.borderRadius = '6px';
            tooltip.style.fontSize = '1em';
            tooltip.style.zIndex = '9999';
            tooltip.style.pointerEvents = 'none';
            tooltip.textContent = `Đang dùng: ${(data.used/1024).toFixed(1)} GB (${data.percent}%)`;
            document.body.appendChild(tooltip);
            gaugeElem.onmousemove = function(ev) {
                tooltip.style.left = (ev.clientX + 16) + 'px';
                tooltip.style.top = (ev.clientY - 8) + 'px';
            };
        };
        gaugeElem.onmouseleave = function() {
            let tooltip = document.getElementById('disk-tooltip');
            if (tooltip) tooltip.remove();
        };
    }
  }
}); 