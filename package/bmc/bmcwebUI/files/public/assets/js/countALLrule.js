document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/rules/countall');
        const data = await response.json();
        document.querySelector('#rulesCountALL').textContent = data.count; // Cập nhật số lượng lên giao diện
    } catch (error) {
        console.error('Error fetching rules count:', error);
    }
});
