

let currentPage = 1;
let rowsPerPage = 10;
let currentRulesData = []; // Toàn bộ dữ liệu rules
let selectedRules = new Set(); // Lưu trữ các rule được chọn

// Hàm load danh sách rules từ server
async function loadSwitchModeRules() {
    try {
        const response = await fetch('/api/switchmode/get-rules');
        if (!response.ok) throw new Error('Không thể tải danh sách rules');
        const rulesData = await response.json();
        console.log('Dữ liệu từ API:', rulesData); // Kiểm tra dữ liệu trả về
        currentRulesData = rulesData; // Lưu dữ liệu
        renderPagination(); // Hiển thị phân trang
        renderSwitchModeTable(); // Render bảng
    } catch (error) {
        console.error('Lỗi khi tải rules:', error);
    }
}

// Hàm render bảng từ dữ liệu rules
function renderSwitchModeTable() {
    const tbody = document.querySelector('.switchmode-table tbody');
    tbody.innerHTML = ''; // Xóa nội dung cũ

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = currentRulesData.slice(startIndex, endIndex);

    pageData.forEach((rule) => {
        const isChecked = selectedRules.has(rule.name); // Kiểm tra rule đã được chọn chưa
        const row = `
            <tr>
                <td><input type="checkbox" class="row-checkbox" data-rule-name="${rule.name}" ${isChecked ? 'checked' : ''} /></td>
                <td>${rule.name}</td>
                <td><i class="mdi ${getIconClass(rule.status)}"></i> ${rule.status}</td>
                <td>${rule.lastModified}</td>
                <td>
                    <select class="form-control switchmode-select" data-rule-name="${rule.name}">
                        <option value="IPS" ${rule.status === 'IPS' ? 'selected' : ''}>IPS</option>
                        <option value="IDS" ${rule.status === 'IDS' ? 'selected' : ''}>IDS</option>
                        <option value="Disabled" ${rule.status === 'Disabled' ? 'selected' : ''}>Disabled</option>
                    </select>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    setupRowCheckboxListeners(); // Gắn sự kiện cho các checkbox
    setupDropdownListeners(); // Gắn sự kiện cho dropdown
}

// Hàm lấy class icon theo trạng thái
function getIconClass(status) {
    switch (status) {
        case 'IPS':
            return 'mdi-shield-check text-success';
        case 'IDS':
            return 'mdi-shield text-primary';
        case 'Disabled':
            return 'mdi-shield-off text-muted';
        default:
            return 'mdi-alert-circle text-warning';
    }
}

// Hàm gắn sự kiện cho checkbox từng dòng
function setupRowCheckboxListeners() {
    document.querySelectorAll('.row-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', (event) => {
            const ruleName = event.target.dataset.ruleName;
            if (event.target.checked) {
                selectedRules.add(ruleName);
            } else {
                selectedRules.delete(ruleName);
            }
        });
    });
}

// Hàm gắn sự kiện cho dropdown từng dòng
function setupDropdownListeners() {
    document.querySelectorAll('.switchmode-select').forEach((dropdown) => {
        dropdown.addEventListener('change', (event) => {
            const ruleName = event.target.dataset.ruleName; // Lấy tên rule
            const newStatus = event.target.value; // Lấy trạng thái mới từ dropdown

            // Cập nhật trạng thái rule trong dữ liệu hiện tại
            currentRulesData = currentRulesData.map((rule) =>
                rule.name === ruleName ? { ...rule, newStatus: newStatus, hasChanged: rule.status !== newStatus } : rule
            );

            console.log(`Cập nhật trạng thái rule "${ruleName}" thành "${newStatus}" trong dữ liệu cục bộ.`);
        });
    });
}

// Hàm gắn sự kiện cho checkbox "Chọn Tất Cả"
function setupSelectAllListener() {
    const selectAllCheckbox = document.getElementById('selectAll');

    selectAllCheckbox.addEventListener('change', (event) => {
        const isChecked = event.target.checked;

        if (isChecked) {
            currentRulesData.forEach((rule) => selectedRules.add(rule.name));
        } else {
            selectedRules.clear(); // Xóa toàn bộ lựa chọn
        }

        renderSwitchModeTable(); // Cập nhật bảng
    });
}

// Hàm render các nút phân trang
function renderPagination() {
    const totalRows = currentRulesData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const paginationControls = document.getElementById('paginationControls');
    paginationControls.innerHTML = ''; // Xóa nội dung cũ

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = 'btn btn-outline-primary mx-1';
        if (i === currentPage) button.classList.add('active');

        button.addEventListener('click', () => {
            currentPage = i;
            renderSwitchModeTable();
        });

        paginationControls.appendChild(button);
    }
}

// Xử lý khi người dùng chọn số dòng hiển thị
function setupRowsPerPageListener() {
    const rowsPerPageSelect = document.getElementById('rowsPerPage');

    rowsPerPageSelect.addEventListener('change', (event) => {
        rowsPerPage = parseInt(event.target.value, 10); // Lấy số dòng từ dropdown
        currentPage = 1; // Reset về trang đầu tiên
        renderPagination(); // Render lại phân trang
        renderSwitchModeTable(); // Render lại bảng
    });
}


// Hàm áp dụng bulk action
async function applySwitchModeBulkAction() {
    const selectedAction = document.getElementById('bulkActionSelect').value;

    // Mảng chứa các rules được tích chọn và áp dụng bulk action
    const bulkRulesArray = Array.from(selectedRules).map((ruleName) => {
        const rule = currentRulesData.find((r) => r.name === ruleName);
        return rule ? { name: rule.name, status: selectedAction } : null; // Định dạng: { name, status }
    }).filter(Boolean); // Loại bỏ giá trị null

    // Mảng chứa các rules không được tích nhưng có thay đổi trạng thái
    const nonSelectedChangedRulesArray = currentRulesData.filter((rule) => {
        return rule.hasChanged && !selectedRules.has(rule.name);
    }).map((rule) => {
        return { name: rule.name, status: rule.newStatus }; // Định dạng: { name, status }
    });

    let updatedRulesArray = [];

    // Nếu có rules được tích chọn
    if (bulkRulesArray.length > 0) {
        updatedRulesArray = [...bulkRulesArray, ...nonSelectedChangedRulesArray];
    } else {
        // Nếu không có rules được tích chọn, kiểm tra toàn bộ xem có thay đổi không
        updatedRulesArray = currentRulesData.filter((rule) => rule.hasChanged).map((rule) => {
            return { name: rule.name, status: rule.newStatus }; // Định dạng: { name, status }
        });
    }

    // Chuẩn hóa dữ liệu để phù hợp với API
    const formattedRules = updatedRulesArray.map((rule) => `${rule.name} ${rule.status}`);

    // Nếu không có thay đổi nào, dừng lại
    if (formattedRules.length === 0) {
        console.log('Không có thay đổi nào để cập nhật.');
        return;
    }

    console.log('Dữ liệu gửi đến API (đã chuẩn hóa):', formattedRules);

    // Gửi dữ liệu đến server
    try {
        const response = await fetch('/api/switchmode/update-rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rules: formattedRules }),
        });

        if (!response.ok) throw new Error('Không thể cập nhật trạng thái rules');
        const result = await response.json();
        showToast(result.message);


        selectedRules.clear(); // Xóa lựa chọn tick
        loadSwitchModeRules(); // Refresh dữ liệu sau khi cập nhật
    } catch (error) {
        console.error('Lỗi khi áp dụng cập nhật:', error);
    }
}

// async function applySwitchModeBulkAction() {
//     const selectedAction = document.getElementById('bulkActionSelect').value;

//     // Kiểm tra nếu có chọn hành động từ dropdown "Bulk Action"
//     if (selectedAction) {
//         // Lấy danh sách các rules đã được tick chọn
//         const selectedRulesArray = Array.from(selectedRules).map((ruleName) => {
//             const rule = currentRulesData.find((r) => r.name === ruleName);
//             return rule ? `${rule.name} ${selectedAction}` : null; // Định dạng: "name action"
//         }).filter(Boolean); // Loại bỏ giá trị null

//         // Nếu không có rule nào được tick chọn, vẫn xử lý toàn bộ currentRulesData
//         if (selectedRulesArray.length === 0) {
//             const allRulesArray = currentRulesData.map((rule) => `${rule.name} ${rule.status}`);
//             console.log('Dữ liệu gửi đến API (toàn bộ trạng thái cập nhật):', allRulesArray);

//             try {
//                 const response = await fetch('/api/switchmode/update-rules', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ rules: allRulesArray }), // Gửi toàn bộ dữ liệu đã thay đổi
//                 });

//                 if (!response.ok) throw new Error('Không thể cập nhật trạng thái rules');
//                 const result = await response.json();
//                 alert(result.message);
//                 loadSwitchModeRules(); // Refresh dữ liệu sau khi cập nhật
//             } catch (error) {
//                 console.error('Lỗi khi áp dụng cập nhật:', error);
//             }
//             return; // Kết thúc xử lý nếu không có tick chọn
//         }

//         // Nếu có rules được tick chọn
//         console.log('Dữ liệu gửi đến API (bulk action):', selectedRulesArray);

//         try {
//             const response = await fetch('/api/switchmode/update-rules', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ rules: selectedRulesArray }), // Gửi các rule được chọn với bulk action
//             });

//             if (!response.ok) throw new Error('Không thể cập nhật trạng thái rules (bulk action)');
//             const result = await response.json();
//             alert(result.message);
//             selectedRules.clear();
            
//             loadSwitchModeRules(); // Refresh dữ liệu sau khi cập nhật
//         } catch (error) {
//             console.error('Lỗi khi áp dụng bulk action:', error);
//         }
//         return; // Kết thúc xử lý bulk action
//     }

//     // Nếu không chọn hành động bulk, gửi toàn bộ trạng thái đã cập nhật từ currentRulesData
//     const updatedRulesArray = currentRulesData.map((rule) => `${rule.name} ${rule.status}`); // Định dạng: "name status"

//     console.log('Dữ liệu gửi đến API (toàn bộ trạng thái cập nhật):', updatedRulesArray);

//     try {
//         const response = await fetch('/api/switchmode/update-rules', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ rules: updatedRulesArray }), // Gửi toàn bộ dữ liệu đã thay đổi
//         });

//         if (!response.ok) throw new Error('Không thể cập nhật trạng thái rules');
//         const result = await response.json();
//         alert(result.message);
//         loadSwitchModeRules(); // Refresh dữ liệu sau khi cập nhật
//     } catch (error) {
//         console.error('Lỗi khi áp dụng cập nhật:', error);
//     }
// }

// async function applySwitchModeBulkAction() {
//     const selectedAction = document.getElementById('bulkActionSelect').value;

//     // Kiểm tra nếu có chọn hành động từ dropdown "Bulk Action"
//     if (selectedAction) {
//         const selectedRulesArray = Array.from(selectedRules).map((ruleName) => {
//             const rule = currentRulesData.find((r) => r.name === ruleName);
//             return rule ? `${rule.name} ${selectedAction}` : null; // Định dạng: "name action"
//         }).filter(Boolean); // Loại bỏ giá trị null

//         console.log('Dữ liệu gửi đến API (bulk action):', selectedRulesArray);

//         if (selectedRulesArray.length === 0) {
//             alert('Không có rule nào được chọn để áp dụng hành động.');
//             return;
//         }

//         try {
//             const response = await fetch('/api/switchmode/update-rules', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ rules: selectedRulesArray }), // Gửi các rule được chọn với bulk action
//             });

//             if (!response.ok) throw new Error('Không thể cập nhật trạng thái rules (bulk action)');
//             const result = await response.json();
//             alert(result.message);
//             loadSwitchModeRules(); // Refresh dữ liệu sau khi cập nhật
//         } catch (error) {
//             console.error('Lỗi khi áp dụng bulk action:', error);
//         }
//         return;
//     }

//     // Trường hợp không tick chọn gì, gửi toàn bộ trạng thái đã cập nhật từ currentRulesData
//     const updatedRulesArray = currentRulesData.map((rule) => `${rule.name} ${rule.status}`); // Định dạng: "name status"

//     console.log('Dữ liệu gửi đến API (toàn bộ trạng thái cập nhật):', updatedRulesArray);

//     try {
//         const response = await fetch('/api/switchmode/update-rules', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ rules: updatedRulesArray }), // Gửi toàn bộ dữ liệu đã thay đổi
//         });

//         if (!response.ok) throw new Error('Không thể cập nhật trạng thái rules');
//         const result = await response.json();
//         alert(result.message);
//         loadSwitchModeRules(); // Refresh dữ liệu sau khi cập nhật
//     } catch (error) {
//         console.error('Lỗi khi áp dụng cập nhật:', error);
//     }
// }



// Lắng nghe khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => {
    loadSwitchModeRules();
    setupSelectAllListener();
    setupRowsPerPageListener(); // Gắn sự kiện thay đổi số dòng hiển thị
    document.querySelector('.switchmode-apply-btn').addEventListener('click', applySwitchModeBulkAction);
});

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');

    // Tạo một thông báo mới
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    // Thêm thông báo vào container
    toastContainer.appendChild(toast);

    // Xóa thông báo sau khi animation kết thúc
    setTimeout(() => {
        toast.remove();
    }, 9900); // Thời gian = thời gian animation slideIn + fadeOut
}


