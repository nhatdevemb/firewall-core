document.addEventListener('DOMContentLoaded', () => {
    // Mapping rule names to toggle switch IDs
    const rules = {
        'trafficid.rules': 'toggleSwitch3',
        'hunting.rules': 'toggleSwitch4',
        'sslblacklist_tls_cert.rules': 'toggleSwitch5',
        'sslipblacklist_aggressive.rules': 'toggleSwitch6',
        'ja3_fingerprints.rules': 'toggleSwitch7',
        'custom.rules': 'toggleSwitch8'
    };

    const loader = document.getElementById('loader8'); // Sử dụng chung loader
    const notificationBar = document.getElementById('notification-bar8'); // Sử dụng chung notification bar

    // Hàm hiển thị thông báo
    const showNotification = (message, isError = false) => {
        notificationBar.style.display = 'block';
        notificationBar.textContent = message;

        // Điều chỉnh cỡ chữ và độ đậm trực tiếp
        notificationBar.style.fontSize = '18px'; // Cỡ chữ lớn hơn
        notificationBar.style.fontWeight = 'bold'; // Chữ đậm hơn
        notificationBar.style.color = isError ? 'red' : 'green'; // Màu sắc thông báo
        notificationBar.style.padding = '10px'; // Tăng khoảng cách cho dễ nhìn
        notificationBar.style.textAlign = 'center'; // Căn giữa nội dung
        notificationBar.style.borderRadius = '5px'; // Bo góc cho thông báo

        setTimeout(() => {
            notificationBar.style.display = 'none';
        }, 3000);
    };

    // Hàm kiểm tra trạng thái cho tất cả rules
    const checkRuleStatuses = async () => {
        try {
            const response = await fetch('/api/rules/status');';;'
            const data = await response.json();

            if (response.ok) {
                Object.keys(rules).forEach(ruleName => {
                    const toggleSwitch = document.getElementById(rules[ruleName]);
                    if (toggleSwitch && data.statuses[ruleName]) {
                        toggleSwitch.checked = data.statuses[ruleName] === 'Enable';
                    }
                });
            } else {
                console.error('Lỗi khi kiểm tra trạng thái rules:', data.message);
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái rules:', error);
        }
    };

    // Hàm cập nhật trạng thái rule
    const updateRuleStatus = async (ruleName, enable) => {
        try {
            // loader.style.display = 'block';

            const response = await fetch('/api/rules/updateStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ruleName, enable }),
            });

            if (response.ok) {
                showNotification(`Cập nhật trạng thái ${ruleName} thành công.`);
            } else {
                throw new Error(`Cập nhật trạng thái ${ruleName} thất bại.`);
            }
        } catch (error) {
            console.error(`Lỗi khi cập nhật trạng thái ${ruleName}:`, error);
            showNotification(`Lỗi khi cập nhật trạng thái ${ruleName}.`, true);
        } finally {
            loader.style.display = 'none';
        }
    };

    // Gán sự kiện thay đổi trạng thái cho từng toggle switch
    Object.keys(rules).forEach(ruleName => {
        const toggleSwitch = document.getElementById(rules[ruleName]);
        if (toggleSwitch) {
            toggleSwitch.addEventListener('change', () => {
                const enable = toggleSwitch.checked; // Trạng thái mới sau khi thay đổi
                updateRuleStatus(ruleName, enable);
            });
        }
    });

    // Gọi hàm kiểm tra trạng thái mỗi 2 giây
    setInterval(checkRuleStatuses, 2000);

    // Gọi kiểm tra trạng thái ban đầu
    checkRuleStatuses();
});
