// Tạo và thêm CSS vào <head> để giữ HTML gọn gàng
const style = document.createElement("style");
style.innerHTML = `
/* Container của switch */
.switch {
    position: relative;
    display: inline-block;
    width: 80px;
    height: 32px;
}

/* Ẩn checkbox mặc định */
.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

/* Kiểu hiển thị nền của switch */
.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #FF4C4C; /* Mặc định là DROP */
    border-radius: 32px;
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    font-size: 12px;
    font-weight: bold;
    color: white;
}

/* Nút trượt bên trong */
.slider:before {
    position: absolute;
    content: "";
    height: 24px;
    width: 24px;
    background-color: white;
    border-radius: 50%;
    left: 5px;
    bottom: 4px;
    transition: 0.3s;
}

/* Chữ trạng thái trong switch */
.slider-text {
    position: absolute;
    transition: 0.3s;
    width: 50px;
    text-align: center;
}

/* Khi bật (ACCEPT) */
.switch input:checked + .slider {
    background-color: #00FF7F;
}

/* Khi nút bật (ACCEPT), đẩy nút trượt sang phải, chữ sang trái */
.switch input:checked + .slider:before {
    transform: translateX(50px);
}

.switch input:checked + .slider .slider-text {
    left: 5px;
    right: auto;
}

/* Khi nút tắt (DROP), đẩy chữ sang phải */
.switch input:not(:checked) + .slider .slider-text {
    right: 5px;
    left: auto;
}
`;
document.head.appendChild(style);

// Hiển thị trạng thái loading khi gửi request
function setLoadingState(isLoading) {
    const button = document.getElementById("checkButton");
    if (!button) return;
    button.disabled = isLoading;
    button.innerText = isLoading ? "Đang kiểm tra..." : "Kiểm tra";
}

// Hàm gọi tới backend để lấy thông tin về địa chỉ IP
function checkIP() {
    const ipAddress = document.getElementById("ipAddress").value.trim();

    if (!ipAddress) {
        alert("Vui lòng nhập địa chỉ IP!");
        return;
    }

    setLoadingState(true); // Hiển thị trạng thái loading

    fetch('http://192.168.2.41:1234/get-mac-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip: ipAddress })
    })
    .then(response => response.json()) // Chuyển response thành JSON
    .then(data => {
        setLoadingState(false); // Kết thúc trạng thái loading
        if (data.error) {
            alert(data.error);
            return;
        }
        displayResults(data);
    })
    .catch(error => {
        setLoadingState(false); // Kết thúc trạng thái loading nếu có lỗi
        console.error('Lỗi:', error);
        alert("Không thể thực thi yêu cầu.");
    });
}

// Hàm hiển thị kết quả vào bảng
function displayResults(data) {
    const macInfoTable = document.getElementById("macInfoTable");
    macInfoTable.innerHTML = ''; // Xóa dữ liệu cũ

    // Xác định trạng thái thực tế (ACCEPT hoặc DROP)
    const isChecked = data.status === "ACCEPT" ? "checked" : "";

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td style="font-size: 15px; color: #65ff28;">${data.macAddress}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.owner}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.pkts}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.bytes}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.target}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.prot}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.opt}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.in}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.out}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.source}</td>
        <td style="font-size: 15px; color: #65ff28;">${data.destination}</td>
        <td>
            <label class="switch">
                <input type="checkbox" ${isChecked} onchange="toggleSwitch(this, '${data.macAddress}')">
                <span class="slider">
                    <span class="slider-text">${data.status}</span>
                </span>
            </label>
        </td>
    `;
    macInfoTable.appendChild(newRow);
}

// Hàm xử lý toggle switch
function toggleSwitch(element, macAddress) {
    var slider = element.nextElementSibling;
    var text = slider.querySelector(".slider-text");
    var newState = element.checked ? "ACCEPT" : "DROP";

    // Tạm thời khóa nút để tránh spam request
    element.disabled = true;

    fetch('http://192.168.2.41:1234/update-mac-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ macAddress: macAddress, action: newState }) // Chuyển "status" thành "action"
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Lỗi: " + data.error);
            element.checked = !element.checked; // Hoàn tác nếu có lỗi
        } else {
            // Chỉ cập nhật giao diện nếu API phản hồi thành công
            slider.style.backgroundColor = element.checked ? "#00FF7F" : "#FF4C4C"; 
            text.textContent = newState;
        }
    })
    .catch(error => {
        console.error('Lỗi:', error);
        alert("Không thể cập nhật trạng thái.");
        element.checked = !element.checked; // Hoàn tác nếu có lỗi
    })
    .finally(() => {
        element.disabled = false; // Mở khóa nút toggle
    });
}

// Gán sự kiện Enter cho ô nhập IP
document.addEventListener("DOMContentLoaded", function () {
    const ipInput = document.getElementById("ipAddress");
    
    ipInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") { 
            event.preventDefault(); // Ngăn chặn reload trang (nếu có)
            checkIP(); // Gọi hàm kiểm tra IP
        }
    });
});


// // File: ../../assets/js/addrulesFirewall.js
// document.addEventListener('DOMContentLoaded', function() {
//     // Lấy các nút và container cần thiết
//     var addRuleButtons = document.querySelectorAll('.iptables-container .iptables-btn.add-rule-btn');
//     var iptablesContainer = document.querySelector('.iptables-container');
//     var addRuleView = document.getElementById('add-rule-view');
//     var currentChainNameSpan = document.getElementById('current-chain-name');
//     var tableSelectEl = document.getElementById('iptables-select');
    
//     // Hàm fadeOut: sử dụng thời gian 600ms cho chuyển cảnh mượt hơn
//     function fadeOut(el, duration, callback) {
//       el.style.transition = 'opacity ' + duration + 'ms ease';
//       el.style.opacity = 1;
//       requestAnimationFrame(function() {
//         el.style.opacity = 0;
//       });
//       setTimeout(function() {
//         el.style.display = 'none';
//         if (callback) callback();
//       }, duration);
//     }
  
//     // Hàm fadeIn: sử dụng thời gian 600ms
//     function fadeIn(el, duration, callback) {
//       el.style.display = 'block';
//       el.style.opacity = 0;
//       el.style.transition = 'opacity ' + duration + 'ms ease';
//       requestAnimationFrame(function() {
//         el.style.opacity = 1;
//       });
//       setTimeout(function() {
//         if (callback) callback();
//       }, duration);
//     }
    
//     // // Hàm updatePreview: ghép các giá trị từ dropdown và input thành rule cuối cùng
//     // function updatePreview() {
//     //   var selectedOptionsSpan = document.getElementById('selected-options');
//     //   if (!selectedOptionsSpan) return;
      
//     //   // Lấy bảng từ dropdown iptables-select
//     //   var tableOption = "";
//     //   if (tableSelectEl) {
//     //     tableOption = "-t " + tableSelectEl.value + " ";
//     //   }
      
//     //   // Lấy các giá trị từ các dropdown và input
//     //   var ruleFlag = document.getElementById('rule-flag').value;
//     //   var rawChainText = currentChainNameSpan ? currentChainNameSpan.textContent.trim() : "";
//     //   // Nếu ruleFlag là -A hoặc -I, chỉ lấy phần trong dấu ngoặc đơn
//     //   var chainName = rawChainText;
//     //   if ((ruleFlag === "-A" || ruleFlag === "-I") && rawChainText) {
//     //     var match = rawChainText.match(/\(([^)]+)\)/);
//     //     if (match && match[1]) {
//     //       chainName = match[1];
//     //     }
//     //   }
      
//     //   var protocol = document.getElementById('protocol').value;
//     //   var srcAddress = document.getElementById('src-address').value;
//     //   var srcPort = document.getElementById('src-port').value;
//     //   var dstAddress = document.getElementById('dst-address').value;
//     //   var dstPort = document.getElementById('dst-port').value;
      
//     //   var toDstIp = document.getElementById('to-dst-ip').value;
//     //   var toDstPort = document.getElementById('to-dst-port').value;
//     //   var toSrcIp = document.getElementById('to-src-ip').value;
//     //   var toSrcPort = document.getElementById('to-src-port').value;
//     //   var toPorts = document.getElementById('to-ports').value;
      
//     //   var inInterface = document.getElementById('in-interface').value;
//     //   var outInterface = document.getElementById('out-interface').value;
      
//     //   var macSource = document.getElementById('mac-source').value;
      
//     //   // Connection Tracking: chuyển sang dropdown đơn
//     //   var connSelect = document.getElementById('conn-state');
//     //   var connState = connSelect ? connSelect.value : "";
      
//     //   var multiport = document.getElementById('multiport').value;
//     //   var limit = document.getElementById('limit').value;
//     //   var ruleComment = document.getElementById('rule-comment').value;
      
//     //   var target = document.getElementById('target').value;
      
//     //   // Ghép chuỗi final rule preview
//     //   var preview = "";
//     //   preview += tableOption;
//     //   if (ruleFlag && chainName) preview += ruleFlag + " " + chainName + " ";
//     //   if (protocol) preview += "-p " + protocol + " ";
//     //   if (srcAddress) preview += "-s " + srcAddress + " ";
//     //   if (srcPort) preview += "--sport " + srcPort + " ";
//     //   if (dstAddress) preview += "-d " + dstAddress + " ";
//     //   if (dstPort) preview += "--dport " + dstPort + " ";
//     //   if (toDstIp) {
//     //       preview += "--to " + toDstIp;
//     //       if (toDstPort) preview += ":" + toDstPort;
//     //       preview += " ";
//     //   }
//     //   if (toSrcIp) {
//     //       preview += "--to-source " + toSrcIp;
//     //       if (toSrcPort) preview += ":" + toSrcPort;
//     //       preview += " ";
//     //   }
//     //   if (toPorts) preview += "--to-ports " + toPorts + " ";
//     //   if (inInterface) preview += "-i " + inInterface + " ";
//     //   if (outInterface) preview += "-o " + outInterface + " ";
//     //   if (macSource) preview += "-m mac --mac-source " + macSource + " ";
//     //   if (connState) preview += "-m state --state " + connState + " ";
//     //   if (multiport) preview += "-m multiport --ports " + multiport + " ";
//     //   if (limit) preview += "-m limit --limit " + limit + " ";
//     //   if (ruleComment) preview += "-m comment --comment \"" + ruleComment + "\" ";
//     //   if (target) preview += "-j " + target + " ";
      
//     //   selectedOptionsSpan.textContent = preview.trim();
//     // }
    
//     // Gắn event listener "change" cho các dropdown liên quan để cập nhật preview
//     function updatePreview() {
//         var selectedOptionsSpan = document.getElementById('selected-options');
//         if (!selectedOptionsSpan) return;
        
//         // 1. Lấy bảng
//         var tableOption = "";
//         if (tableSelectEl) {
//           tableOption = "-t " + tableSelectEl.value + " ";
//         }
        
//         // 2. Vị trí rule và tên chain
//         var ruleFlag = document.getElementById('rule-flag').value;
//         var rawChainText = currentChainNameSpan ? currentChainNameSpan.textContent.trim() : "";
//         var chainName = rawChainText;
//         if ((ruleFlag === "-A" || ruleFlag === "-I") && rawChainText) {
//           var match = rawChainText.match(/\(([^)]+)\)/);
//           if (match && match[1]) {
//             chainName = match[1];
//           }
//         }
//         var ruleChainPart = "";
//         if (ruleFlag && chainName) {
//           ruleChainPart = ruleFlag + " " + chainName + " ";
//         }
        
//         // 3. Các điều kiện match (trước -j)
//         var matchPart = "";
//         var protocol = document.getElementById('protocol').value;
//         if (protocol) matchPart += "-p " + protocol + " ";
        
//         var srcAddress = document.getElementById('src-address').value;
//         if (srcAddress) matchPart += "-s " + srcAddress + " ";
        
//         var srcPort = document.getElementById('src-port').value;
//         if (srcPort) matchPart += "--sport " + srcPort + " ";
        
//         var dstAddress = document.getElementById('dst-address').value;
//         if (dstAddress) matchPart += "-d " + dstAddress + " ";
        
//         var dstPort = document.getElementById('dst-port').value;
//         if (dstPort) matchPart += "--dport " + dstPort + " ";
        
//         var inInterface = document.getElementById('in-interface').value;
//         if (inInterface) matchPart += "-i " + inInterface + " ";
        
//         var outInterface = document.getElementById('out-interface').value;
//         if (outInterface) matchPart += "-o " + outInterface + " ";
        
//         var macSource = document.getElementById('mac-source').value;
//         if (macSource) matchPart += "-m mac --mac-source " + macSource + " ";
        
//         var connSelect = document.getElementById('conn-state');
//         var connState = connSelect ? connSelect.value : "";
//         if (connState) matchPart += "-m state --state " + connState + " ";
        
//         var multiport = document.getElementById('multiport').value;
//         if (multiport) matchPart += "-m multiport --ports " + multiport + " ";
        
//         var limit = document.getElementById('limit').value;
//         if (limit) matchPart += "-m limit --limit " + limit + " ";
        
//         var ruleComment = document.getElementById('rule-comment').value;
//         if (ruleComment) matchPart += "-m comment --comment \"" + ruleComment + "\" ";
        
//         // 4. Hành động (target)
//         var target = document.getElementById('target').value;
//         var targetPart = "";
//         if (target) targetPart = "-j " + target + " ";
        
//         // 5. Các tùy chọn của target (đặt sau -j)
//         var targetOptions = "";
//         var toDstIp = document.getElementById('to-dst-ip').value;
//         var toDstPort = document.getElementById('to-dst-port').value;
//         if (toDstIp) {
//           targetOptions += "--to-destination " + toDstIp;
//           if (toDstPort) targetOptions += ":" + toDstPort;
//           targetOptions += " ";
//         }
        
//         var toSrcIp = document.getElementById('to-src-ip').value;
//         var toSrcPort = document.getElementById('to-src-port').value;
//         if (toSrcIp) {
//           targetOptions += "--to-source " + toSrcIp;
//           if (toSrcPort) targetOptions += ":" + toSrcPort;
//           targetOptions += " ";
//         }
        
//         var toPorts = document.getElementById('to-ports').value;
//         if (toPorts) {
//           targetOptions += "--to-ports " + toPorts + " ";
//         }
        
//         // Ghép tất cả các phần lại theo thứ tự đúng
//         var preview = tableOption + ruleChainPart + matchPart + targetPart + targetOptions;
        
//         selectedOptionsSpan.textContent = preview.trim();
//       }
      
//     var ruleFlagEl = document.getElementById('rule-flag');
//     if (ruleFlagEl) ruleFlagEl.addEventListener('change', updatePreview);
//     var protocolEl = document.getElementById('protocol');
//     if (protocolEl) protocolEl.addEventListener('change', updatePreview);
//     var targetEl = document.getElementById('target');
//     if (targetEl) targetEl.addEventListener('change', updatePreview);
//     var connStateEl = document.getElementById('conn-state');
//     if (connStateEl) connStateEl.addEventListener('change', updatePreview);
//     if (tableSelectEl) tableSelectEl.addEventListener('change', updatePreview);
    
//     // Gắn event listener cho nút "Xem trước"
//     var previewBtn = document.getElementById('preview-btn');
//     if (previewBtn) {
//       previewBtn.addEventListener('click', function(e) {
//          e.preventDefault();
//          updatePreview();
//       });
//     }
    
//     // Xử lý sự kiện cho nút "Add Rule" ở các chain khác nhau
//     addRuleButtons.forEach(function(btn) {
//       btn.addEventListener('click', function(e) {
//         e.preventDefault();
//         // Xác định chain hiện hành dựa vào phần chứa nút
//         var chainSection = btn.closest('.iptables-section');
//         var chainHeader = chainSection ? chainSection.querySelector('h5') : null;
//         if (chainHeader && currentChainNameSpan) {
//             // Lấy toàn bộ text của h5
//             var fullChainText = chainHeader.textContent;
//             currentChainNameSpan.textContent = fullChainText;
//             // Lấy màu từ chainHeader và áp dụng cho currentChainNameSpan
//             var computedStyle = window.getComputedStyle(chainHeader);
//             var chainColor = computedStyle.getPropertyValue('color');
//             currentChainNameSpan.style.color = chainColor;
//         }
  
//         // Cập nhật giá trị của bảng iptables từ select
//         if (tableSelectEl) {
//           var tableValue = tableSelectEl.value;
//           var tableOption = "-t " + tableValue + " ";
//           var selectedOptionsSpan = document.getElementById('selected-options');
//           if (selectedOptionsSpan) {
//              selectedOptionsSpan.textContent = tableOption;
//           }
//         }
  
//         updatePreview();
  
//         fadeOut(iptablesContainer, 600, function() {
//           fadeIn(addRuleView, 600);
//         });
//       });
//     });
  
//     // Xử lý nút quay lại (Back)
// // Xử lý nút quay lại (Back)
// // Xử lý nút quay lại (Back)
//     var backBtn = document.getElementById('back-btn');
//     if (backBtn) {
//     backBtn.addEventListener('click', function(e) {
//         e.preventDefault();
//         fadeOut(addRuleView, 600, function() {
//         // Reload lại dữ liệu của chain hiện hành
//         var currentTable = tableSelectEl ? tableSelectEl.value : "filter";
//         var currentChain = "";
//         if (currentChainNameSpan) {
//             var rawChain = currentChainNameSpan.textContent.trim();
//             // Lấy chỉ phần trong dấu ngoặc đơn
//             var match = rawChain.match(/\(([^)]+)\)/);
//             currentChain = match ? match[1] : rawChain;
//         }
//         console.log("Reloading chain:", currentChain);
//         fetchFirewallDataByChain(currentTable, currentChain);
        
//         fadeIn(iptablesContainer, 600);
//         });
//     });
//     }


    
//     // Xử lý submit form: gửi final rule đến API
//     var ruleForm = document.getElementById('rule-form-unique');
//     if (ruleForm) {
//       ruleForm.addEventListener('submit', function(e) {
//         e.preventDefault();
//         var finalRule = document.getElementById('selected-options').textContent;
//         console.log("Final Rule sent to API:", finalRule);
//         fetch("/add-firewall-rule", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ rule: finalRule })
//           })
//           .then(function(response) {
//             console.log("Response status:", response.status, response.statusText);
//             if (!response.ok) throw new Error("Network response was not ok");
//             return response.json();
//           })
//           .then(function(data) {
//             console.log("API response:", data);
//             Swal.fire({
//                 toast: true,
//                 position: 'center',
//                 width: '360px',  
//                 icon: 'success',
//                 title: 'Đang hoàn tất...',
//                 background: '#f7f8fa',     // Nền sáng và tinh tế
//                 showConfirmButton: false,
//                 willOpen: () => {
//                     // Hiệu ứng mờ nền khi popup mở
//                     Swal.showLoading();
//                   },
//                 timer: 4000,
//                 timerProgressBar: true
//             }).then(() => {
//               // Sau khi popup đóng, reload lại rules cho chain hiện hành
//               var currentTable = tableSelectEl ? tableSelectEl.value : "filter";
//               var currentChain = currentChainNameSpan ? currentChainNameSpan.textContent.trim() : "";
//               fetchFirewallDataByChain(currentTable, currentChain);
//             });
//           })
//           .catch(function(error) {
//             console.error("Error adding rule:", error);
//             Swal.fire({
//                 toast: true,
//                 position: 'center',
//                 width: '360px',  
//                 icon: 'success',
//                 title: 'Rule không hợp lệ! Vui lòng kiểm tra lại!',
//                 background: '#f7f8fa',     // Nền sáng và tinh tế
//                 showConfirmButton: false,
//                 willOpen: () => {
//                     // Hiệu ứng mờ nền khi popup mở
//                     Swal.showLoading();
//                   },
//                 timer: 4000,
//                 timerProgressBar: true
//             });
//           });
//       });
//     }
    
//     // Hàm fetchFirewallDataByChain: reload dữ liệu cho chain hiện hành
//     function fetchFirewallDataByChain(tableName, chainName) {
//       console.log("Reloading data for table:", tableName, "chain:", chainName);
//       fetch('/get-firewall-from-table', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ tableName: tableName })
//       })
//       .then(response => response.json())
//       .then(data => {
//         console.log("Reload API response:", data);
//         if (data && data.rules && data.rules[chainName]) {
//           updateRulesTableForChain(chainName, data.rules[chainName]);
//         } else {
//           console.warn("No rules found for chain:", chainName);
//         }
//       })
//       .catch(error => {
//         console.error("Error reloading firewall data:", error);
//       });
//     }
    
//     // Hàm cập nhật rules cho chain cụ thể (ví dụ: INPUT, FORWARD, v.v.)
//     function updateRulesTableForChain(chainName, rules) {
//       var tableId = chainName.toLowerCase() + "-rules";
//       var table = document.getElementById(tableId);
//       if (!table) {
//         console.warn("Không tìm thấy bảng cho chain:", chainName);
//         return;
//       }
  
//       table.innerHTML = "";
//       rules.forEach(rule => {
//         var row = document.createElement('tr');
//         row.setAttribute('data-index', rule.lineNumber);
  
//         var checkboxCell = document.createElement('td');
//         var checkbox = document.createElement('input');
//         checkbox.type = "checkbox";
//         checkboxCell.appendChild(checkbox);
  
//         var actionCell = document.createElement('td');
//         actionCell.textContent = rule.action;
//         // Áp dụng màu sắc và font-weight đúng theo hành động
//         if (rule.action === "ACCEPT") {
//             actionCell.style.color = 'lime';
//             actionCell.style.fontWeight = 'semi-bold';
//         } else if (rule.action === "DROP") {
//             actionCell.style.color = 'orangered';
//             actionCell.style.fontWeight = 'semi-bold';
//         } else {
//             actionCell.style.color = 'dodgerblue';
//             actionCell.style.fontWeight = 'semi-bold';
//         }
  
//         var conditionCell = document.createElement('td');
//         conditionCell.textContent = rule.details;
  
//         var commentCell = document.createElement('td');
//         commentCell.textContent = rule.comment || "";
  
//         var moveCell = document.createElement('td');
//         moveCell.textContent = '⬇⬆';
  
//         var addCell = document.createElement('td');
//         addCell.textContent = '➕';
  
//         row.appendChild(checkboxCell);
//         row.appendChild(actionCell);
//         row.appendChild(conditionCell);
//         row.appendChild(commentCell);
//         row.appendChild(moveCell);
//         row.appendChild(addCell);
  
//         table.appendChild(row);
//       });
//       console.log("Updated rules table for chain:", chainName);
//     }
    
//     // Hàm lấy tên chain dựa trên class của section (cũ)
//     function getChainName(section) {
//       if (section.classList.contains('input')) return 'INPUT';
//       if (section.classList.contains('forward')) return 'FORWARD';
//       if (section.classList.contains('output')) return 'OUTPUT';
//       if (section.classList.contains('prerouting')) return 'PREROUTING';
//       if (section.classList.contains('postrouting')) return 'POSTROUTING';
//       return '';
//     }
// });

// // File: ../../assets/js/addrulesFirewall.js
// document.addEventListener('DOMContentLoaded', function() {
//     // Lấy các nút và container cần thiết
//     var addRuleButtons = document.querySelectorAll('.iptables-container .iptables-btn.add-rule-btn');
//     var iptablesContainer = document.querySelector('.iptables-container');
//     var addRuleView = document.getElementById('add-rule-view');
//     var currentChainNameSpan = document.getElementById('current-chain-name');
//     var tableSelectEl = document.getElementById('iptables-select');
    
//     // Hàm fadeOut: giảm opacity rồi ẩn phần tử
//     function fadeOut(el, duration, callback) {
//       el.style.transition = 'opacity ' + duration + 'ms ease';
//       el.style.opacity = 1;
//       requestAnimationFrame(function() {
//         el.style.opacity = 0;
//       });
//       setTimeout(function() {
//         el.style.display = 'none';
//         if (callback) callback();
//       }, duration);
//     }
  
//     // Hàm fadeIn: hiển thị phần tử với hiệu ứng tăng opacity
//     function fadeIn(el, duration, callback) {
//       el.style.display = 'block';
//       el.style.opacity = 0;
//       el.style.transition = 'opacity ' + duration + 'ms ease';
//       requestAnimationFrame(function() {
//         el.style.opacity = 1;
//       });
//       setTimeout(function() {
//         if (callback) callback();
//       }, duration);
//     }
    
//     // Hàm updatePreview: ghép các giá trị từ dropdown và input thành rule cuối cùng
//     function updatePreview() {
//       var selectedOptionsSpan = document.getElementById('selected-options');
//       if (!selectedOptionsSpan) return;
      
//       // Lấy bảng từ dropdown iptables-select
//       var tableOption = "";
//       if (tableSelectEl) {
//         tableOption = "-t " + tableSelectEl.value + " ";
//       }
      
//       // Lấy các giá trị từ các dropdown và input
//       var ruleFlag = document.getElementById('rule-flag').value;
//       var rawChainText = currentChainNameSpan ? currentChainNameSpan.textContent.trim() : "";
//       // Nếu ruleFlag là -A hoặc -I, chỉ lấy phần trong dấu ngoặc đơn
//       var chainName = rawChainText;
//       if ((ruleFlag === "-A" || ruleFlag === "-I") && rawChainText) {
//         var match = rawChainText.match(/\(([^)]+)\)/);
//         if (match && match[1]) {
//           chainName = match[1];
//         }
//       }
      
//       var protocol = document.getElementById('protocol').value;
//       var srcAddress = document.getElementById('src-address').value;
//       var srcPort = document.getElementById('src-port').value;
//       var dstAddress = document.getElementById('dst-address').value;
//       var dstPort = document.getElementById('dst-port').value;
      
//       var toDstIp = document.getElementById('to-dst-ip').value;
//       var toDstPort = document.getElementById('to-dst-port').value;
//       var toSrcIp = document.getElementById('to-src-ip').value;
//       var toSrcPort = document.getElementById('to-src-port').value;
//       var toPorts = document.getElementById('to-ports').value;
      
//       var inInterface = document.getElementById('in-interface').value;
//       var outInterface = document.getElementById('out-interface').value;
      
//       var macSource = document.getElementById('mac-source').value;
      
//       // Connection Tracking: chuyển dropdown đơn
//       var connSelect = document.getElementById('conn-state');
//       var connState = connSelect ? connSelect.value : "";
      
//       var multiport = document.getElementById('multiport').value;
//       var limit = document.getElementById('limit').value;
//       var ruleComment = document.getElementById('rule-comment').value;
      
//       var target = document.getElementById('target').value;
      
//       // Ghép chuỗi final rule preview
//       var preview = "";
//       preview += tableOption;
//       if (ruleFlag && chainName) preview += ruleFlag + " " + chainName + " ";
//       if (protocol) preview += "-p " + protocol + " ";
//       if (srcAddress) preview += "-s " + srcAddress + " ";
//       if (srcPort) preview += "--sport " + srcPort + " ";
//       if (dstAddress) preview += "-d " + dstAddress + " ";
//       if (dstPort) preview += "--dport " + dstPort + " ";
//       if (toDstIp) {
//           preview += "--to-destination " + toDstIp;
//           if (toDstPort) preview += ":" + toDstPort;
//           preview += " ";
//       }
//       if (toSrcIp) {
//           preview += "--to-source " + toSrcIp;
//           if (toSrcPort) preview += ":" + toSrcPort;
//           preview += " ";
//       }
//       if (toPorts) preview += "--to-ports " + toPorts + " ";
//       if (inInterface) preview += "-i " + inInterface + " ";
//       if (outInterface) preview += "-o " + outInterface + " ";
//       if (macSource) preview += "-m mac --mac-source " + macSource + " ";
//       if (connState) preview += "-m state --state " + connState + " ";
//       if (multiport) preview += "-m multiport --ports " + multiport + " ";
//       if (limit) preview += "-m limit --limit " + limit + " ";
//       if (ruleComment) preview += "-m comment --comment \"" + ruleComment + "\" ";
//       if (target) preview += "-j " + target + " ";
      
//       selectedOptionsSpan.textContent = preview.trim();
//     }
    
//     // Gắn event listener "change" cho các dropdown liên quan để cập nhật preview
//     var ruleFlagEl = document.getElementById('rule-flag');
//     if (ruleFlagEl) ruleFlagEl.addEventListener('change', updatePreview);
//     var protocolEl = document.getElementById('protocol');
//     if (protocolEl) protocolEl.addEventListener('change', updatePreview);
//     var targetEl = document.getElementById('target');
//     if (targetEl) targetEl.addEventListener('change', updatePreview);
//     var connStateEl = document.getElementById('conn-state');
//     if (connStateEl) connStateEl.addEventListener('change', updatePreview);
//     if (tableSelectEl) tableSelectEl.addEventListener('change', updatePreview);
    
//     // Gắn event listener cho nút "Xem trước"
//     var previewBtn = document.getElementById('preview-btn');
//     if (previewBtn) {
//       previewBtn.addEventListener('click', function(e) {
//          e.preventDefault();
//          updatePreview();
//       });
//     }



    
//     // Xử lý sự kiện cho nút "Add Rule" ở các chain khác nhau
//     addRuleButtons.forEach(function(btn) {
//       btn.addEventListener('click', function(e) {
//         e.preventDefault();
//         // Xác định chain hiện hành dựa vào phần chứa nút
//         var chainSection = btn.closest('.iptables-section');
//         var chainHeader = chainSection ? chainSection.querySelector('h5') : null;
//         if (chainHeader && currentChainNameSpan) {
//             // Lấy toàn bộ text của h5
//             var fullChainText = chainHeader.textContent;
//             currentChainNameSpan.textContent = fullChainText;
//             // Lấy màu từ chainHeader và áp dụng cho currentChainNameSpan
//             var computedStyle = window.getComputedStyle(chainHeader);
//             var chainColor = computedStyle.getPropertyValue('color');
//             currentChainNameSpan.style.color = chainColor;
//         }
  
//         // Cập nhật giá trị của bảng iptables từ select
//         if (tableSelectEl) {
//           var tableValue = tableSelectEl.value;
//           var tableOption = "-t " + tableValue + " ";
//           var selectedOptionsSpan = document.getElementById('selected-options');
//           if (selectedOptionsSpan) {
//              selectedOptionsSpan.textContent = tableOption;
//           }
//         }
  
//         updatePreview();
  
//         fadeOut(iptablesContainer, 500, function() {
//           fadeIn(addRuleView, 500);
//         });
//       });
//     });
  
//     // Xử lý nút quay lại (Back)
//     var backBtn = document.getElementById('back-btn');
//     if (backBtn) {
//       backBtn.addEventListener('click', function(e) {
//         e.preventDefault();
//         fadeOut(addRuleView, 500, function() {
//           fadeIn(iptablesContainer, 500);
//         });
//       });
//     }
    
//     // Xử lý submit form: gửi final rule đến API
//     var ruleForm = document.getElementById('rule-form-unique');
//     if (ruleForm) {
//       ruleForm.addEventListener('submit', function(e) {
//         e.preventDefault();

//         var finalRule = document.getElementById('selected-options').textContent;

//         fetch("/add-firewall-rule", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ rule: finalRule })
//           })
//           .then(function(response) {
//             console.log("Response status:", response.status, response.statusText);
//             if (!response.ok) throw new Error("Network response was not ok");
//             return response.json();
//           })
//           .then(function(data) {
//             console.log("API response:", data);
//             Swal.fire({
//                 toast: true,
//                 position: 'center',
//                 width: '360px',  
//                 icon: 'success',
//                 title: 'Đang hoàn tất...',
//                 background: '#f7f8fa',     // Nền sáng và tinh tế
//                 showConfirmButton: false,
//                 willOpen: () => {
//                     // Hiệu ứng mờ nền khi popup mở
//                     Swal.showLoading();
//                   },
//                 timer: 4000,
//                 timerProgressBar: true
//             });
//           })
          
//           .catch(function(error) {
//             console.error("Error adding rule:", error);
//             Swal.fire({
//               icon: 'error',
//               title: 'Lỗi',
//               text: 'Error adding rule: ' + error.message,
//               confirmButtonText: 'OK'
//             });
//           });
          
          
//       });
//     }
// });

// // File: ../../assets/js/addrulesFirewall.js
// document.addEventListener('DOMContentLoaded', function() {
//     // Lấy tất cả các nút "Add Rule" trong container iptables ban đầu
//     var addRuleButtons = document.querySelectorAll('.iptables-container .iptables-btn.add-rule-btn');
//     var iptablesContainer = document.querySelector('.iptables-container');
//     var addRuleView = document.getElementById('add-rule-view');
//     var currentChainNameSpan = document.getElementById('current-chain-name');
//     var tableSelectEl = document.getElementById('iptables-select');
    
//     // Hàm fadeOut: giảm opacity từ 1 xuống 0 rồi ẩn phần tử
//     function fadeOut(el, duration, callback) {
//       el.style.transition = 'opacity ' + duration + 'ms ease';
//       el.style.opacity = 1;
//       requestAnimationFrame(function() {
//         el.style.opacity = 0;
//       });
//       setTimeout(function() {
//         el.style.display = 'none';
//         if (callback) callback();
//       }, duration);
//     }
  
//     // Hàm fadeIn: hiển thị phần tử và tăng opacity từ 0 đến 1
//     function fadeIn(el, duration, callback) {
//       el.style.display = 'block';
//       el.style.opacity = 0;
//       el.style.transition = 'opacity ' + duration + 'ms ease';
//       requestAnimationFrame(function() {
//         el.style.opacity = 1;
//       });
//       setTimeout(function() {
//         if (callback) callback();
//       }, duration);
//     }


    
//     // Hàm cập nhật live preview của rule dựa trên các dropdown
//     function updatePreview() {
//       var selectedOptionsSpan = document.getElementById('selected-options');
//       if (!selectedOptionsSpan) return;
  
//       // Lấy bảng
//       var tableSelect = document.getElementById('iptables-select');
//       var tableOption = "";
//       if (tableSelect) {
//         tableOption = "-t " + tableSelect.value;
//       }
  
//     //   // Lấy các giá trị từ các dropdown trong form
//     //   var ruleFlag = document.getElementById('rule-flag').value;
//     //   // Dùng text trong currentChainNameSpan (đã được cập nhật khi nhấn Add Rule)
//     //   var chainName = currentChainNameSpan ? currentChainNameSpan.textContent.trim() : "";


//       // Lấy các giá trị từ các dropdown trong form
//     var ruleFlag = document.getElementById('rule-flag').value;
//     var rawChainText = currentChainNameSpan ? currentChainNameSpan.textContent.trim() : "";
//     // Nếu ruleFlag là -A hoặc -I, chỉ lấy phần trong dấu ngoặc, ngược lại dùng toàn bộ text
//     var chainName = rawChainText;
//     if (ruleFlag === "-A" || ruleFlag === "-I") {
//         var match = rawChainText.match(/\(([^)]+)\)/);
//         if (match && match[1]) {
//         chainName = match[1];
//         }
//     }



//       var protocol = document.getElementById('protocol').value;
//       var target = document.getElementById('target').value;
      
//       // Lấy trạng thái kết nối (multi-select)
//       var connSelect = document.getElementById('conn-state');
//       var connStates = [];
//       if (connSelect) {
//         for (var i = 0; i < connSelect.options.length; i++) {
//           var option = connSelect.options[i];
//           if (option.selected && option.value) {
//             connStates.push(option.value);
//           }
//         }
//       }
  
//       // Ghép chuỗi final rule preview
//       var preview = "";
//       if (tableOption) preview += tableOption + " ";
//       if (ruleFlag && chainName) preview += ruleFlag + " " + chainName + " ";
//       if (protocol) preview += "-p " + protocol + " ";
//       if (connStates.length > 0) preview += "-m state --state " + connStates.join(",") + " ";
//       if (target) preview += "-j " + target + " ";
  
//       selectedOptionsSpan.textContent = preview.trim();
//     }
    
//     // Gắn event listener "change" cho các dropdown liên quan
//     var ruleFlagEl = document.getElementById('rule-flag');
//     if(ruleFlagEl) ruleFlagEl.addEventListener('change', updatePreview);
//     var protocolEl = document.getElementById('protocol');
//     if(protocolEl) protocolEl.addEventListener('change', updatePreview);
//     var targetEl = document.getElementById('target');
//     if(targetEl) targetEl.addEventListener('change', updatePreview);
//     var connStateEl = document.getElementById('conn-state');
//     if(connStateEl) connStateEl.addEventListener('change', updatePreview);
//     var tableSelectEl = document.getElementById('iptables-select');
//     if(tableSelectEl) tableSelectEl.addEventListener('change', updatePreview);
  
//     // Xử lý sự kiện cho nút "Add Rule" ở các chain khác nhau
//     addRuleButtons.forEach(function(btn) {
//       btn.addEventListener('click', function(e) {
//         e.preventDefault();
//         // Xác định chain hiện hành dựa vào phần chứa nút
//         var chainSection = btn.closest('.iptables-section');
//         var chainHeader = chainSection ? chainSection.querySelector('h5') : null;
//         if (chainHeader && currentChainNameSpan) {
//             // Lấy toàn bộ text của h5
//             var fullChainText = chainHeader.textContent;
//             currentChainNameSpan.textContent = fullChainText;
//             // Lấy màu từ chainHeader và áp dụng cho currentChainNameSpan
//             var computedStyle = window.getComputedStyle(chainHeader);
//             var chainColor = computedStyle.getPropertyValue('color');
//             currentChainNameSpan.style.color = chainColor;
//         }
  
//         // Lấy giá trị của bảng iptables từ select và cập nhật ô hiển thị options
//         if (tableSelectEl) {
//           var tableValue = tableSelectEl.value;
//           var tableOption = "-t " + tableValue;
//           var selectedOptionsSpan = document.getElementById('selected-options');
//           if (selectedOptionsSpan) {
//              selectedOptionsSpan.textContent = tableOption;
//           }
//         }
  
//         // Gọi updatePreview để cập nhật các giá trị từ dropdown khác (nếu có)
//         updatePreview();
  
//         // Chuyển đổi giao diện: Ẩn iptables-container và hiển thị add-rule-view với hiệu ứng fade
//         fadeOut(iptablesContainer, 500, function() {
//           fadeIn(addRuleView, 500);
//         });
//       });
//     });
  
//     // Xử lý sự kiện nút quay lại (Back)
//     var backBtn = document.getElementById('back-btn');
//     if(backBtn) {
//       backBtn.addEventListener('click', function(e) {
//         e.preventDefault();
//         fadeOut(addRuleView, 500, function() {
//           fadeIn(iptablesContainer, 500);
//         });
//       });
//     }
    
//     // Xử lý submit form để ghép rule (hiển thị final rule qua alert)
//     var ruleForm = document.getElementById('rule-form-unique');
//     if(ruleForm) {
//       ruleForm.addEventListener('submit', function(e) {
//         e.preventDefault();
//         // Sử dụng cùng logic ghép chuỗi đã có ở updatePreview()
//         var finalRule = document.getElementById('selected-options').textContent;
//         alert("Final Rule: " + finalRule);
//         // Hoặc xử lý theo nhu cầu (ví dụ: gửi lệnh đến thiết bị)
//       });
//     }
// });
