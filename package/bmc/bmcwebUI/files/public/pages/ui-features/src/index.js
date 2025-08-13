$(document).ready(function () {
    const table = $('#hienthirule').DataTable({
        ajax: {
            url: '/api/rules', // URL đến API endpoint
            dataSrc: '' // Dữ liệu sẽ được lấy từ root của JSON
        },
        columns: [
            {
                data: 'sid',
                render: function (data, type, row) {
                    // Chuyển SID thành nút có sự kiện click
                    return `<button class="sid-btn btn btn-link" data-sid="${data}">${data}</button>`;
                }
            },
            { data: 'msg' },
            { data: 'action' },
            { data: 'protocol' },
            { data: 'src' },
            { data: 'dst' },
            { data: 'severity' }
        ],
        scrollY: '500px',
        scrollX: true,
        paging: true,
    });

    // Thêm sự kiện click cho các nút SID
    $('#hienthirule').on('click', '.sid-btn', function () {
        const sid = $(this).data('sid');

        // Gọi API mới để lấy chi tiết rule
        $.ajax({
            url: `/api/rule/${sid}`,
            method: 'GET',
            success: function (ruleData) {
                console.log('Dữ liệu nhận được từ API:', ruleData);

                if (ruleData) {
                    // Cập nhật thông tin chi tiết rule vào các phần tử modal
                    $('#ruleSid').text(ruleData.sid);
                    $('#ruleMsg').text(ruleData.msg);
                    $('#ruleAction').text(ruleData.action);
                    $('#ruleProtocol').text(ruleData.protocol);
                    $('#ruleSrc').text(ruleData.src);
                    $('#ruleDst').text(ruleData.dst);
                    $('#ruleSeverity').text(ruleData.severity);

                    // Hiển thị toàn bộ nội dung rule từ server (nguyên bản) với các dòng được giữ nguyên
                    $('#fullRuleContent').html(ruleData.fullRule);

                    // Mở modal
                    $('#ruleDetailsModal').modal('show');
                } else {
                    console.log("Không có dữ liệu trả về cho SID này.");
                }
            },
            error: function (error) {
                console.error('Lỗi khi lấy chi tiết rule:', error); // Log lỗi để kiểm tra
            }
        });
    });
});
