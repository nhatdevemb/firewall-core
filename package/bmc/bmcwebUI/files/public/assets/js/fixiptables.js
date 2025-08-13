// Hàm lấy tên chain dựa trên class của section
function getChainName(section) {
    if (section.classList.contains('input')) return 'INPUT';
    if (section.classList.contains('forward')) return 'FORWARD';
    if (section.classList.contains('output')) return 'OUTPUT';
    if (section.classList.contains('prerouting')) return 'PREROUTING';
    if (section.classList.contains('postrouting')) return 'POSTROUTING';
    return '';
}
  
// Hàm hiển thị loading overlay
function showLoading(message = "Đang xử lý...") {
    let loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loading-overlay';
      loadingOverlay.style.position = 'fixed';
      loadingOverlay.style.top = '0';
      loadingOverlay.style.left = '0';
      loadingOverlay.style.width = '100%';
      loadingOverlay.style.height = '100%';
      loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.justifyContent = 'center';
      loadingOverlay.style.alignItems = 'center';
      loadingOverlay.style.color = '#fff';
      loadingOverlay.style.fontSize = '1.5em';
      loadingOverlay.style.zIndex = '9999';
      document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.textContent = message;
    loadingOverlay.style.display = 'flex';

    // Hiển thị progress bar với thiết lập mới
    showProgressBar();
}


// them thu nghiem
    // Hiển thị thanh tiến trình
    let loadingProgress = document.getElementById('loading-progress');
    if (!loadingProgress) {
        loadingProgress = document.createElement('div');
        loadingProgress.id = 'loading-progress';
        loadingProgress.style.display = 'block';
        document.body.appendChild(loadingProgress);
    }

    let progressBar = document.getElementById('progress-bar');
    progressBar.style.width = '0%';

    // Cập nhật thanh tiến trình từ 0% đến 100%
    let progress = 0;
    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
        } else {
            progress += 1; // Tăng tiến độ mỗi 0.1 giây
            progressBar.style.width = progress + '%';
        }
    }, 40); // Chỉnh sửa tốc độ của thanh tiến trình


    // Hàm ẩn loading overlay và thanh tiến trình
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingProgress = document.getElementById('loading-progress');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    if (loadingProgress) {
        loadingProgress.style.display = 'none';
    }
}

// them thu nghiem

  
// // Hàm ẩn loading overlay
// function hideLoading() {
//     const loadingOverlay = document.getElementById('loading-overlay');
//     if (loadingOverlay) {
//       loadingOverlay.style.display = 'none';
//     }
// }
  
document.addEventListener('DOMContentLoaded', function () {
    const iptablesSelect = document.getElementById("iptables-select");

    // Đặt giá trị mặc định là 'filter' khi trang được tải
    iptablesSelect.value = 'filter';  // Mặc định chọn bảng filter
    console.log('Default table set to:', iptablesSelect.value);  // Log bảng mặc định

    // Gọi hàm render bảng "filter" mặc định
    fetchFirewallData(iptablesSelect.value);  // Gọi API cho bảng filter
    document.querySelector('.input').style.display = 'block';
    document.querySelector('.forward').style.display = 'block';
    document.querySelector('.output').style.display = 'block';

    // Các bảng quy tắc cho từng chain
    const inputRulesTable = document.getElementById("input-rules");
    const forwardRulesTable = document.getElementById("forward-rules");
    const outputRulesTable = document.getElementById("output-rules");
    const preroutingRulesTable = document.getElementById("prerouting-rules");
    const postroutingRulesTable = document.getElementById("postrouting-rules");

    // Các mục Default Action cho INPUT, FORWARD, OUTPUT, PREROUTING, POSTROUTING
    const inputDefaultAction = document.getElementById("input-default-action");
    const forwardDefaultAction = document.getElementById("forward-default-action");
    const outputDefaultAction = document.getElementById("output-default-action");
    const preroutingDefaultAction = document.getElementById("prerouting-default-action");
    const postroutingDefaultAction = document.getElementById("postrouting-default-action");

    // Hàm gọi API
    function fetchFirewallData(tableName) {
        console.log(`Fetching firewall data for table: ${tableName}`);
        
        fetch('/get-firewall-from-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableName: tableName })
        })
        .then(response => {
            console.log('API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API Response Data:', data);
            if (data && data.rules) {
                console.log('PREROUTING rules:', data.rules.PREROUTING);
                console.log('POSTROUTING rules:', data.rules.POSTROUTING);
                // Cập nhật Default Action cho INPUT, FORWARD, OUTPUT, PREROUTING, POSTROUTING
                updateDefaultAction(data.default_policies);
                
                // Cập nhật rules cho các chain
                updateRulesTable(data.rules);
            }
        })
        .catch(error => {
            console.error('Error fetching firewall data:', error);
        });
    }

    // Hàm cập nhật Default Action cho các chain
    function updateDefaultAction(defaultPolicies) {
        console.log('Updating default actions with:', defaultPolicies);

        if (defaultPolicies) {
            if (defaultPolicies.INPUT) {
                inputDefaultAction.value = defaultPolicies.INPUT;
                console.log('Updated INPUT default action:', defaultPolicies.INPUT);
            }

            if (defaultPolicies.FORWARD) {
                forwardDefaultAction.value = defaultPolicies.FORWARD;
                console.log('Updated FORWARD default action:', defaultPolicies.FORWARD);
            }

            if (defaultPolicies.OUTPUT) {
                outputDefaultAction.value = defaultPolicies.OUTPUT;
                console.log('Updated OUTPUT default action:', defaultPolicies.OUTPUT);
            }

            if (defaultPolicies.PREROUTING) {
                preroutingDefaultAction.value = defaultPolicies.PREROUTING;
                console.log('Updated PREROUTING default action:', defaultPolicies.PREROUTING);
            }

            if (defaultPolicies.POSTROUTING) {
                postroutingDefaultAction.value = defaultPolicies.POSTROUTING;
                console.log('Updated POSTROUTING default action:', defaultPolicies.POSTROUTING);
            }
        }
    }

    // Hàm cập nhật rules vào bảng
    function updateRulesTable(rules) {
        console.log('Updating rules table with:', rules);
        // Reset các bảng trước khi cập nhật mới
        inputRulesTable.innerHTML = "";
        forwardRulesTable.innerHTML = "";
        outputRulesTable.innerHTML = "";
        preroutingRulesTable.innerHTML = "";
        postroutingRulesTable.innerHTML = "";

        // Cập nhật từng bảng cho từng chain
        ['INPUT', 'FORWARD', 'OUTPUT', 'PREROUTING', 'POSTROUTING'].forEach(chain => {
            const chainRules = rules[chain];
            let table;

            // Lựa chọn bảng tương ứng với chain
            switch(chain) {
                case 'INPUT':
                    table = inputRulesTable;
                    break;
                case 'FORWARD':
                    table = forwardRulesTable;
                    break;
                case 'OUTPUT':
                    table = outputRulesTable;
                    break;
                case 'PREROUTING':
                    table = preroutingRulesTable;
                    break;
                case 'POSTROUTING':
                    table = postroutingRulesTable;
                    break;
            }

            // Kiểm tra nếu chain có rules
            if (chainRules && chainRules.length > 0) {
                console.log(`Rules found for chain: ${chain}`);
                
                // Hiển thị nút "Delete Selected" và "Move Selected"
                const actionButtons = document.querySelector(`#${chain.toLowerCase()}-action-buttons`);
                if (actionButtons) {
                    actionButtons.style.display = 'inline-block';
                    console.log(`Buttons for chain ${chain} are now visible`);
                } else {
                    console.log(`No action buttons found for chain ${chain}`);
                }

                // Thêm các rule vào bảng
                table.innerHTML = "";
                chainRules.forEach(rule => {
                    const row = document.createElement('tr');

                    // Gắn thuộc tính data-index (Lưu ý: phải có rule.lineNumber từ server)
                    row.setAttribute('data-index', rule.lineNumber);

                    const checkboxCell = document.createElement('td');
                    const checkbox = document.createElement('input');
                    checkbox.type = "checkbox";
                    checkboxCell.appendChild(checkbox);

                    const actionCell = document.createElement('td');
                    actionCell.classList.add('iptables-accept');
                    actionCell.textContent = rule.action;

                    if (rule.action === "ACCEPT") {
                        actionCell.style.color = 'lime';
                        actionCell.style.fontWeight = 'semi-bold';
                    } else if (rule.action === "DROP") {
                        actionCell.style.color = 'orangered';
                        actionCell.style.fontWeight = 'semi-bold';
                    } else {
                        actionCell.style.color = 'dodgerblue'; // Màu xanh dương cho các hành động khác
                        actionCell.style.fontWeight = 'semi-bold'; 
                    }

                    const conditionCell = document.createElement('td');
                    conditionCell.textContent = rule.details;

                    const commentCell = document.createElement('td');
                    const moveCell = document.createElement('td');
                    moveCell.textContent = '⬇⬆';

                    const addCell = document.createElement('td');
                    addCell.textContent = '➕';

                    row.appendChild(checkboxCell);
                    row.appendChild(actionCell);
                    row.appendChild(conditionCell);
                    row.appendChild(commentCell);
                    row.appendChild(moveCell);
                    row.appendChild(addCell);

                    table.appendChild(row);
                    console.log('Appended rule to table:', row);
                });
            } else {
                console.log(`No rules found for chain: ${chain}`);
                
                // Ẩn nút "Delete Selected" và "Move Selected"
                const actionButtons = document.querySelector(`#${chain.toLowerCase()}-action-buttons`);
                if (actionButtons) {
                    actionButtons.style.display = 'none';
                    console.log(`Buttons for chain ${chain} are now hidden`);
                }
            }
        });
    }

    // --- 1. Xử lý chức năng "Select All" cho các bảng ---
    document.querySelectorAll('.iptables-table thead input[type="checkbox"]').forEach(headerCheckbox => {
      headerCheckbox.addEventListener('change', function() {
        const table = headerCheckbox.closest('.iptables-table');
        const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]');
        console.log('Header checkbox toggled:', headerCheckbox.checked, '-> Updating', checkboxes.length, 'checkbox(es).');
        checkboxes.forEach(chk => {
          chk.checked = headerCheckbox.checked;
        });
      });
    });
    
    // --- 2. Xử lý nút "Delete Selected" ---
    document.querySelectorAll('.iptables-btn-danger').forEach(deleteButton => {
        deleteButton.addEventListener('click', function() {
        const section = deleteButton.closest('.iptables-section');
        console.log('Delete button clicked for section:', section.className);
    
        // Xác định tableName dựa trên lớp của section
        let tableName = '';
        if (section.classList.contains('input') ||
            section.classList.contains('forward') ||
            section.classList.contains('output')) {
            tableName = 'filter';
        } else if (section.classList.contains('prerouting') ||
                    section.classList.contains('postrouting')) {
            tableName = 'nat';
        } else {
            tableName = 'mangle'; // Mặc định hoặc bổ sung theo logic cụ thể
        }
        console.log('Determined table name:', tableName);
    
        // Xác định chain name từ section
        const chainName = getChainName(section);
        console.log('Determined chain name:', chainName);
    
        // Lấy danh sách rule đã được chọn (dựa vào thuộc tính data-index trên mỗi dòng <tr>)
        const selectedRules = [];
        const allCheckboxes = section.querySelectorAll('tbody input[type="checkbox"]');
        console.log('Total checkboxes in section:', allCheckboxes.length);
    
        section.querySelectorAll('tbody input[type="checkbox"]:checked').forEach(chk => {
            const row = chk.closest('tr');
            const ruleIndex = row.getAttribute('data-index');
            console.log('Found checked rule in row:', row, 'data-index:', ruleIndex);
            if (ruleIndex) {
            selectedRules.push(ruleIndex);
            }
        });
    
        console.log('Total selected rules:', selectedRules.length, '-> Selected rules:', selectedRules);
    
        if (selectedRules.length === 0) {
            alert("Vui lòng chọn ít nhất 1 rule cần xóa.");
            return;
        }


        // Hiển thị loading spinner
        // const loadingSpinner = document.getElementById('loading-spinner-input');
        // loadingSpinner.style.display = 'inline-block';

        // const loadingSpinner1 = document.getElementById('loading-spinner-forward');
        // loadingSpinner1.style.display = 'inline-block';

        // const progressBar = document.getElementById('progress-bar');
        // progressBar.style.display = 'inline-block';

        // Xây dựng ID cho spinner và progress bar theo chainName
        const spinnerId = 'loading-spinner-' + chainName.toLowerCase();
        const progressBarId = 'progress-bar-' + chainName.toLowerCase();

        console.log('hihi', spinnerId);
    

        // Hiển thị loading spinner và progress bar tương ứng với chain
        const loadingSpinner = document.getElementById(spinnerId);
        if (loadingSpinner) {
            loadingSpinner.style.display = 'inline-block';
        }
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.display = 'inline-block';
     
    
        // Gọi API xóa rule với fetch, gửi thêm chainName
        fetch('/delete-firewall-rule', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            tableName: tableName,
            chainName: chainName,
            ruleIndexes: selectedRules
            })
        })
        .then(response => response.json())
        .then(data => {
                    // Ẩn loading sau khi nhận kết quả
            loadingSpinner.style.display = 'none';
            progressBar.style.display = 'none';

            // Ẩn loading sau khi nhận kết quả
            hideLoading();
    
            if (data.success) {
              // Sử dụng SweetAlert2 để hiển thị popup thành công
              Swal.fire({
                toast: true,
                position: 'center',
                width: '360px',  
                icon: 'success',
                title: 'Đang hoàn tất...',
                background: '#f7f8fa',     // Nền sáng và tinh tế
                showConfirmButton: false,
                willOpen: () => {
                    // Hiệu ứng mờ nền khi popup mở
                    Swal.showLoading();
                  },
                timer: 3000,
                timerProgressBar: true
              }).then(() => {
                // Tự động load lại dữ liệu sau khi popup đóng
                // Nếu có dữ liệu trả về từ API, cập nhật giao diện
                if (data.data) {
                    if (data.data.default_policies) {
                      updateDefaultAction(data.data.default_policies);
                    }
                    if (data.data.rules) {
                      updateRulesTable(data.data.rules);
                    }
                } else {
                    // Nếu không có dữ liệu trả về, fallback reload trang
                    window.location.reload();
                }
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Xóa rule thất bại: ' + data.error,
                confirmButtonText: 'Đóng'
              });
            }
          })
          .catch(error => {
            hideLoading();
            console.error("Lỗi khi xóa rule:", error);
            Swal.fire({
              icon: 'error',
              title: 'Lỗi',
              text: 'Đã xảy ra lỗi khi xóa rule.',
              confirmButtonText: 'Đóng'
            });
          });
        });
      });
  
    // Lắng nghe sự kiện khi thay đổi lựa chọn bảng
    iptablesSelect.addEventListener('change', function() {
        const tableName = iptablesSelect.value;
        console.log('Table changed to:', tableName);  // Log bảng được chọn

        fetchFirewallData(tableName);

        // Ẩn tất cả các chain
        document.querySelectorAll('.iptables-section').forEach(section => {
            console.log('Hiding chain:', section.classList);  // Log thông tin chain đang ẩn
            section.style.display = 'none';
        });

        // Kiểm tra điều kiện để hiển thị các chain phù hợp
        if (tableName === 'nat') {
            console.log('Rendering chains for NAT table');
            document.querySelector('.prerouting').style.display = 'block';
            document.querySelector('.input').style.display = 'block';
            document.querySelector('.output').style.display = 'block';
            document.querySelector('.postrouting').style.display = 'block';
        } else if (tableName === 'mangle') {
            console.log('Rendering chains for MANGLE table');
            document.querySelector('.prerouting').style.display = 'block';
            document.querySelector('.input').style.display = 'block';
            document.querySelector('.forward').style.display = 'block';
            document.querySelector('.output').style.display = 'block';
            document.querySelector('.postrouting').style.display = 'block';
        } else if (tableName === 'filter') {
            console.log('Rendering chains for FILTER table');
            document.querySelector('.input').style.display = 'block';
            document.querySelector('.forward').style.display = 'block';
            document.querySelector('.output').style.display = 'block';
        }

        // Log chi tiết các chain đã được hiển thị
        document.querySelectorAll('.iptables-section').forEach(section => {
            if (section.style.display !== 'none') {
                console.log('Visible chain:', section.classList);  // Log thông tin chain đang hiển thị
            }
        });
    });
});


// // Hàm hiển thị loading overlay
// function showLoading(message = "Đang xử lý...") {
//     let loadingOverlay = document.getElementById('loading-overlay');
//     if (!loadingOverlay) {
//       loadingOverlay = document.createElement('div');
//       loadingOverlay.id = 'loading-overlay';
//       loadingOverlay.style.position = 'fixed';
//       loadingOverlay.style.top = '0';
//       loadingOverlay.style.left = '0';
//       loadingOverlay.style.width = '100%';
//       loadingOverlay.style.height = '100%';
//       loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
//       loadingOverlay.style.display = 'flex';
//       loadingOverlay.style.justifyContent = 'center';
//       loadingOverlay.style.alignItems = 'center';
//       loadingOverlay.style.color = '#fff';
//       loadingOverlay.style.fontSize = '1.5em';
//       loadingOverlay.style.zIndex = '9999';
//       document.body.appendChild(loadingOverlay);
//     }
//     loadingOverlay.textContent = message;
//     loadingOverlay.style.display = 'flex';
//   }
  
//   // Hàm ẩn loading overlay
//   function hideLoading() {
//     const loadingOverlay = document.getElementById('loading-overlay');
//     if (loadingOverlay) {
//       loadingOverlay.style.display = 'none';
//     }
//   }
  


// document.addEventListener('DOMContentLoaded', function () {
//     // --- 1. Xử lý chức năng "Select All" cho các bảng ---
//     document.querySelectorAll('.iptables-table thead input[type="checkbox"]').forEach(headerCheckbox => {
//       headerCheckbox.addEventListener('change', function() {
//         const table = headerCheckbox.closest('.iptables-table');
//         const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]');
//         console.log('Header checkbox toggled:', headerCheckbox.checked, '-> Updating', checkboxes.length, 'checkbox(es).');
//         checkboxes.forEach(chk => {
//           chk.checked = headerCheckbox.checked;
//         });
//       });
//     });
    
//     // --- 2. Xử lý nút "Delete Selected" ---
//     document.querySelectorAll('.iptables-btn-danger').forEach(deleteButton => {
//         deleteButton.addEventListener('click', function() {
//         const section = deleteButton.closest('.iptables-section');
//         console.log('Delete button clicked for section:', section.className);
    
//         // Xác định tableName dựa trên lớp của section
//         let tableName = '';
//         if (section.classList.contains('input') ||
//             section.classList.contains('forward') ||
//             section.classList.contains('output')) {
//             tableName = 'filter';
//         } else if (section.classList.contains('prerouting') ||
//                     section.classList.contains('postrouting')) {
//             tableName = 'nat';
//         } else {
//             tableName = 'mangle'; // Mặc định hoặc bổ sung theo logic cụ thể
//         }
//         console.log('Determined table name:', tableName);
    
//         // Xác định chain name từ section
//         const chainName = getChainName(section);
//         console.log('Determined chain name:', chainName);
    
//         // Lấy danh sách rule đã được chọn (dựa vào thuộc tính data-index trên mỗi dòng <tr>)
//         const selectedRules = [];
//         const allCheckboxes = section.querySelectorAll('tbody input[type="checkbox"]');
//         console.log('Total checkboxes in section:', allCheckboxes.length);
    
//         section.querySelectorAll('tbody input[type="checkbox"]:checked').forEach(chk => {
//             const row = chk.closest('tr');
//             const ruleIndex = row.getAttribute('data-index');
//             console.log('Found checked rule in row:', row, 'data-index:', ruleIndex);
//             if (ruleIndex) {
//             selectedRules.push(ruleIndex);
//             }
//         });
    
//         console.log('Total selected rules:', selectedRules.length, '-> Selected rules:', selectedRules);
    
//         if (selectedRules.length === 0) {
//             alert("Vui lòng chọn ít nhất 1 rule cần xóa.");
//             return;
//         }
    
//         // Gọi API xóa rule với fetch, gửi thêm chainName
//         fetch('/delete-firewall-rule', {
//             method: 'POST',
//             headers: {
//             'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//             tableName: tableName,
//             chainName: chainName,
//             ruleIndexes: selectedRules
//             })
//         })
//         .then(response => response.json())
//         .then(data => {
//             // Ẩn loading sau khi nhận kết quả
//             hideLoading();
    
//             if (data.success) {
//               // Sử dụng SweetAlert2 để hiển thị popup thành công
//               Swal.fire({
//                 icon: 'success',
//                 title: 'Thành công',
//                 text: 'Đã xóa rule thành công!',
//                 timer: 2000,
//                 showConfirmButton: false
//               }).then(() => {
//                 // Tự động load lại dữ liệu sau khi popup đóng
//                 // Giả sử iptablesSelect là biến toàn cục lưu lựa chọn bảng
//                 // fetchFirewallData(iptablesSelect.value);
//                 // window.location.reload();

//                 if (data.data) {
//                     if (data.data.default_policies) {
//                       updateDefaultAction(data.data.default_policies);
//                     }
//                     if (data.data.rules) {
//                       updateRulesTable(data.data.rules);
//                     }
//                   } else {
//                     // Nếu không có dữ liệu trả về, có thể fallback reload trang
//                     window.location.reload();
//                   }

//               });
//             } else {
//               Swal.fire({
//                 icon: 'error',
//                 title: 'Lỗi',
//                 text: 'Xóa rule thất bại: ' + data.error,
//                 confirmButtonText: 'Đóng'
//               });
//             }
//           })
//           .catch(error => {
//             hideLoading();
//             console.error("Lỗi khi xóa rule:", error);
//             Swal.fire({
//               icon: 'error',
//               title: 'Lỗi',
//               text: 'Đã xảy ra lỗi khi xóa rule.',
//               confirmButtonText: 'Đóng'
//             });
//           });
//         });
//       });
  
// });
  