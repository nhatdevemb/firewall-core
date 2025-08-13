document.addEventListener('DOMContentLoaded', function () {
    // Lấy giá trị msg từ localStorage
    const ruleMsg = localStorage.getItem('ruleMsg');

    // Nếu có msg, tự động điền vào ô tìm kiếm và kích hoạt nút "Tìm kiếm"
    if (ruleMsg) {
        // Điền giá trị msg vào ô tìm kiếm
        const searchInput = document.getElementById('keyword');
        searchInput.value = ruleMsg;

        // Tự động nhấn vào nút "Tìm kiếm"
        const searchButton = document.getElementById('search-button');
        searchButton.click();

        // Xóa giá trị khỏi localStorage sau khi sử dụng để tránh tự động tìm kiếm lần sau
        localStorage.removeItem('ruleMsg');
    }
});
