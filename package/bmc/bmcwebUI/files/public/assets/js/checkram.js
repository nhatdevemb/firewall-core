document.addEventListener('DOMContentLoaded', function() {
    async function fetchRamUsage() {
        try {
            const response = await fetch('/api/system/ram');
            const data = await response.json();
            if (window.updateGauge) window.updateGauge('#gauge-ram', data.percent);
            var ramDetailElem = document.getElementById('ram-info');
            if (ramDetailElem) {
                ramDetailElem.textContent = `RAM: ${(data.total/1024).toFixed(1)} GB`;
                ramDetailElem.setAttribute('data-tooltip', `Đang dùng: ${(data.used/1024).toFixed(1)} GB (${data.percent}%)`);
            }
            // Gắn tooltip cho gauge
            const gaugeElem = document.getElementById('gauge-ram');
            if (gaugeElem) {
                gaugeElem.onmouseenter = function(e) {
                    let tooltip = document.createElement('div');
                    tooltip.id = 'ram-tooltip';
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
                    let tooltip = document.getElementById('ram-tooltip');
                    if (tooltip) tooltip.remove();
                };
            }
        } catch (error) {
            console.error('Error fetching RAM usage:', error);
        }
    }
    fetchRamUsage();
    setInterval(fetchRamUsage, 30000);
});
