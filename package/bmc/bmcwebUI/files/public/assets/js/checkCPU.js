document.addEventListener('DOMContentLoaded', async () => {
    // Hàm để lấy thông tin CPU
    async function fetchCpuUsage() {
        try {
            const response = await fetch('/api/system/cpu');
            const data = await response.json();
            if (window.updateGauge) window.updateGauge('#gauge-cpu', data.percent);
            var cpuDetailElem = document.getElementById('cpu-info');
            if (cpuDetailElem) {
                cpuDetailElem.textContent = `CPU: ${data.cores} core`;
                cpuDetailElem.setAttribute('data-tooltip', `Đang dùng: ${data.usedCore} core (${data.percent}%)`);
            }
            // Gắn tooltip cho gauge
            const gaugeElem = document.getElementById('gauge-cpu');
            if (gaugeElem) {
                gaugeElem.onmouseenter = function(e) {
                    let tooltip = document.createElement('div');
                    tooltip.id = 'cpu-tooltip';
                    tooltip.style.position = 'fixed';
                    tooltip.style.background = 'rgba(30,30,30,0.97)';
                    tooltip.style.color = '#fff';
                    tooltip.style.padding = '6px 14px';
                    tooltip.style.borderRadius = '6px';
                    tooltip.style.fontSize = '1em';
                    tooltip.style.zIndex = '9999';
                    tooltip.style.pointerEvents = 'none';
                    tooltip.textContent = `Đang dùng: ${data.usedCore} core (${data.percent}%)`;
                    document.body.appendChild(tooltip);
                    gaugeElem.onmousemove = function(ev) {
                        tooltip.style.left = (ev.clientX + 16) + 'px';
                        tooltip.style.top = (ev.clientY - 8) + 'px';
                    };
                };
                gaugeElem.onmouseleave = function() {
                    let tooltip = document.getElementById('cpu-tooltip');
                    if (tooltip) tooltip.remove();
                };
            }
        } catch (error) {
            console.error('Error fetching CPU usage:', error);
        }
    }

    // Gọi sau 1 giây khi trang được tải
    setTimeout(async () => {
        await fetchCpuUsage();
    }, 200);

    // Gọi định kỳ mỗi 1 phút 30 giây
    setInterval(fetchCpuUsage, 30000);
});
