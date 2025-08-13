// Hàm xử lý khi nhấn nút "Sửa rules này"
document.getElementById('editRuleButton').addEventListener('click', function() {
    // Lấy thông tin rule hiện tại (msg) từ rule đang hiển thị
    const msg = document.getElementById('ruleMsg').textContent;

    // Lưu msg vào localStorage để truyền sang suarule.html
    localStorage.setItem('ruleMsg', msg);

    // Chuyển hướng người dùng sang trang suarule.html
    window.location.href = 'suarule.html';
});
