document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/rules/count');
        const data = await response.json();
        document.querySelector('#rulesCount').textContent = data.count; // Cập nhật số lượng lên giao diện
    } catch (error) {
        console.error('Error fetching rules count:', error);
    }
});
