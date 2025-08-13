// Hàm lấy tên chain dựa trên class của section
function getChainName(section) {
    if (section.classList.contains('input')) return 'INPUT';
    if (section.classList.contains('forward')) return 'FORWARD';
    if (section.classList.contains('output')) return 'OUTPUT';
    if (section.classList.contains('prerouting')) return 'PREROUTING';
    if (section.classList.contains('postrouting')) return 'POSTROUTING';
    return '';
  }
  
document.addEventListener("DOMContentLoaded", function() {
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

    // Cập nhật Default Action cho INPUT, FORWARD, OUTPUT, PREROUTING, POSTROUTING
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

    // Cập nhật rules vào bảng
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

                                        // 1) GẮN THUỘC TÍNH data-index (Lưu ý: phải có rule.lineNumber từ server)
                    //    Nếu JSON trả về { "lineNumber": 1, "action": "ACCEPT", ... },
                    //    ta gắn row.setAttribute('data-index', rule.lineNumber);
                    //    Hoặc nếu dùng tên trường khác, sửa lại cho phù hợp.
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


    // Thực hiện gọi API mặc định khi trang được tải
  
});







// document.addEventListener("DOMContentLoaded", function() {
//     const iptablesSelect = document.getElementById("iptables-select");
//     const forwardRulesTable = document.getElementById("forward-rules");
//     const inputDefaultAction = document.getElementById("input-default-action");
//     const forwardDefaultAction = document.getElementById("forward-default-action");
//     const outputDefaultAction = document.getElementById("output-default-action");

//     // Hàm gọi API
//     function fetchFirewallData(tableName) {
//         console.log(`Fetching firewall data for table: ${tableName}`);
        
//         fetch('/get-firewall-from-table', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ tableName: tableName })
//         })
//         .then(response => {
//             console.log('API Response Status:', response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('API Response Data:', data);
//             if (data && data.rules) {
//                 // Cập nhật Default Action cho INPUT, FORWARD, OUTPUT
//                 updateDefaultAction(data.default_policies);
                
//                 // Cập nhật rules cho các chain
//                 updateRulesTable(data.rules);
//             }
//         })
//         .catch(error => {
//             console.error('Error fetching firewall data:', error);
//         });
//     }

//     // Cập nhật Default Action cho INPUT, FORWARD, OUTPUT
//     function updateDefaultAction(defaultPolicies) {
//         console.log('Updating default actions with:', defaultPolicies);

//         if (defaultPolicies) {
//             if (defaultPolicies.INPUT) {
//                 inputDefaultAction.value = defaultPolicies.INPUT;
//                 console.log('Updated INPUT default action:', defaultPolicies.INPUT);
//             }

//             if (defaultPolicies.FORWARD) {
//                 forwardDefaultAction.value = defaultPolicies.FORWARD;
//                 console.log('Updated FORWARD default action:', defaultPolicies.FORWARD);
//             }

//             if (defaultPolicies.OUTPUT) {
//                 outputDefaultAction.value = defaultPolicies.OUTPUT;
//                 console.log('Updated OUTPUT default action:', defaultPolicies.OUTPUT);
//             }
//         }
//     }

//     // Cập nhật rules vào bảng
//     function updateRulesTable(rules) {
//         console.log('Updating rules table with:', rules);

//         forwardRulesTable.innerHTML = "";

//         // Duyệt qua các chain và cập nhật bảng cho từng chain
//         ['INPUT', 'FORWARD', 'OUTPUT'].forEach(chain => {
//             const chainRules = rules[chain];

//             // Kiểm tra nếu chain có rules
//             const table = chain === 'FORWARD' ? forwardRulesTable : null;

//             if (chainRules && chainRules.length > 0) {
//                 console.log(`Rules found for chain: ${chain}`);
                
//                 // Hiển thị nút "Delete Selected" và "Move Selected"
//                 const actionButtons = document.querySelector(`#${chain.toLowerCase()}-action-buttons`);
//                 if (actionButtons) {
//                     actionButtons.style.display = 'inline-block';
//                     console.log(`Buttons for chain ${chain} are now visible`);
//                 }

//                 // Thêm các rule vào bảng
//                 chainRules.forEach(rule => {
//                     const row = document.createElement('tr');
//                     const checkboxCell = document.createElement('td');
//                     const checkbox = document.createElement('input');
//                     checkbox.type = "checkbox";
//                     checkboxCell.appendChild(checkbox);

//                     const actionCell = document.createElement('td');
//                     actionCell.classList.add('iptables-accept');
//                     actionCell.textContent = rule.action;

//                     if (rule.action === "ACCEPT") {
//                         actionCell.style.color = 'lime';
//                         actionCell.style.fontWeight = 'semi-bold';
//                     } else if (rule.action === "DROP") {
//                         actionCell.style.color = 'darkred';
//                         actionCell.style.fontWeight = 'semi-bold';
//                     }

//                     const conditionCell = document.createElement('td');
//                     conditionCell.textContent = rule.details;

//                     const commentCell = document.createElement('td');
//                     const moveCell = document.createElement('td');
//                     moveCell.textContent = '⬇⬆';

//                     const addCell = document.createElement('td');
//                     addCell.textContent = '➕';

//                     row.appendChild(checkboxCell);
//                     row.appendChild(actionCell);
//                     row.appendChild(conditionCell);
//                     row.appendChild(commentCell);
//                     row.appendChild(moveCell);
//                     row.appendChild(addCell);
    
//                     forwardRulesTable.appendChild(row);
//                     console.log('Appended rule to table:', row);
//                 });
//             } else {
//                 console.log(`No rules found for chain: ${chain}`);
                
//                 // Ẩn nút "Delete Selected" và "Move Selected"
//                 const actionButtons = document.querySelector(`#${chain.toLowerCase()}-action-buttons`);
//                 if (actionButtons) {
//                     actionButtons.style.display = 'none';
//                     console.log(`Buttons for chain ${chain} are now hidden`);
//                 }
//             }
//         });
//     }
    
//     // Lắng nghe sự kiện khi thay đổi lựa chọn bảng
//     iptablesSelect.addEventListener('change', function() {
//         const tableName = iptablesSelect.value;
//         console.log('Table changed to:', tableName);
//         fetchFirewallData(tableName);
//     });
    
//     // Thực hiện gọi API mặc định khi trang được tải
//     fetchFirewallData(iptablesSelect.value);
// });
    



// document.addEventListener("DOMContentLoaded", function() {
//     const iptablesSelect = document.getElementById("iptables-select");
//     const forwardRulesTable = document.getElementById("forward-rules");
//     const inputDefaultAction = document.getElementById("input-default-action");
//     const forwardDefaultAction = document.getElementById("forward-default-action");
//     const outputDefaultAction = document.getElementById("output-default-action");

//     // Hàm gọi API
//     function fetchFirewallData(tableName) {
//         console.log(`Fetching firewall data for table: ${tableName}`);
        
//         fetch('/get-firewall-from-table', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ tableName: tableName })
//         })
//         .then(response => {
//             console.log('API Response Status:', response.status);
//             return response.json();
//         })
//         .then(data => {
//             console.log('API Response Data:', data);
//             if (data && data.rules) {
//                 // Cập nhật Default Action cho INPUT, FORWARD, OUTPUT
//                 updateDefaultAction(data.default_policies);
                
//                 // Cập nhật rules cho các chain
//                 updateRulesTable(data.rules);
//             }
//         })
//         .catch(error => {
//             console.error('Error fetching firewall data:', error);
//         });
//     }

//     // Cập nhật Default Action cho INPUT, FORWARD, OUTPUT
//     function updateDefaultAction(defaultPolicies) {
//         console.log('Updating default actions with:', defaultPolicies);

//         // Cập nhật các giá trị cho INPUT, FORWARD, OUTPUT
//         if (defaultPolicies) {
//             // Tìm các chain và cập nhật action cho chúng
//             if (defaultPolicies.INPUT) {
//                 inputDefaultAction.value = defaultPolicies.INPUT;
//                 console.log('Updated INPUT default action:', defaultPolicies.INPUT);
//             }

//             if (defaultPolicies.FORWARD) {
//                 forwardDefaultAction.value = defaultPolicies.FORWARD;
//                 console.log('Updated FORWARD default action:', defaultPolicies.FORWARD);
//             }

//             if (defaultPolicies.OUTPUT) {
//                 outputDefaultAction.value = defaultPolicies.OUTPUT;
//                 console.log('Updated OUTPUT default action:', defaultPolicies.OUTPUT);
//             }
//         }
//     }

//     // Cập nhật rules vào bảng
//     function updateRulesTable(rules) {
//         console.log('Updating rules table with:', rules);

//         // Xóa các dòng hiện tại trong bảng Forward Rules
//         forwardRulesTable.innerHTML = "";

//         // Duyệt qua các chain và cập nhật bảng cho từng chain
//         ['INPUT', 'FORWARD', 'OUTPUT'].forEach(chain => {
//             if (rules[chain] && rules[chain].length > 0) {
//                 console.log(`Updating rules for chain: ${chain}`);
//                 const chainRules = rules[chain];

//                 // Tìm bảng tương ứng với mỗi chain
//                 const table = chain === 'FORWARD' ? forwardRulesTable : null; // Nếu bạn có bảng riêng cho INPUT và OUTPUT, bạn có thể tạo thêm
//                 if (table) {
//                     chainRules.forEach(rule => {
//                         const row = document.createElement('tr');
                        
//                         const checkboxCell = document.createElement('td');
//                         const checkbox = document.createElement('input');
//                         checkbox.type = "checkbox";
//                         checkboxCell.appendChild(checkbox);
                        
//                         const actionCell = document.createElement('td');
//                         actionCell.classList.add('iptables-accept');
//                         actionCell.textContent = rule.action;

//                         // Thêm màu chữ sáng và in đậm tùy theo hành động
//                         if (rule.action === "ACCEPT") {
//                             actionCell.style.color = 'lime';  // Màu chữ sáng hơn cho ACCEPT
//                             actionCell.style.fontWeight = 'semi-bold';  // In đậm cho ACCEPT
//                         } else if (rule.action === "DROP") {
//                             actionCell.style.color = 'darkred';  // Màu chữ sáng hơn cho DROP
//                             actionCell.style.fontWeight = 'semi-bold';  // In đậm cho DROP
//                         }

//                         const conditionCell = document.createElement('td');
//                         conditionCell.textContent = rule.details;

//                         const commentCell = document.createElement('td');
//                         const moveCell = document.createElement('td');
//                         moveCell.textContent = '⬇⬆';
                        
//                         const addCell = document.createElement('td');
//                         addCell.textContent = '➕';
                        
//                         row.appendChild(checkboxCell);
//                         row.appendChild(actionCell);
//                         row.appendChild(conditionCell);
//                         row.appendChild(commentCell);
//                         row.appendChild(moveCell);
//                         row.appendChild(addCell);

//                         table.appendChild(row);
                        
//                         console.log('Appended rule to table:', row);
//                     });
                    
//                 }
//             } else {
//                 console.log(`No rules found for chain: ${chain}`);
//             }
//         });
//     }

//     // Lắng nghe sự kiện khi thay đổi lựa chọn bảng
//     iptablesSelect.addEventListener('change', function() {
//         const tableName = iptablesSelect.value;
//         console.log('Table changed to:', tableName);
//         fetchFirewallData(tableName);
//     });

//     // Thực hiện gọi API mặc định khi trang được tải
//     fetchFirewallData(iptablesSelect.value);
// });
