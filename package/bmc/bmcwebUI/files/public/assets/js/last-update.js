document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/rules/lastUpdate');
        const data = await response.json();
        document.querySelector('#lastUpdate').textContent = data.count; // Cập nhật số lượng lên giao diện
    } catch (error) {
        console.error('Error fetching rules count:', error);
    }
});
