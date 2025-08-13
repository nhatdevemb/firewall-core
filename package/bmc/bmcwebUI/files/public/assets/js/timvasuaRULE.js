// Hàm escape để xử lý các ký tự đặc biệt trong regex
function escapeRegExp(string) {
    return string.replace(/([.*+?^${}()|[\]\\])/g, '\\$&'); 
}

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const keywordInput = document.getElementById('keyword');
    const searchResult = document.getElementById('timvasua');
    const guideText = document.getElementById('guideText'); // Thêm phần lấy guideText để ẩn khi có kết quả

    // Xử lý sự kiện click của nút tìm kiếm
    searchButton.addEventListener('click', () => {
        const keyword = keywordInput.value.trim();

        if (!keyword) {
            searchResult.style.display = "block"; // Hiển thị bảng kết quả nếu không nhập từ khóa
            searchResult.innerHTML = 'Please enter a keyword to search.';
            return;
        }

        // Gửi yêu cầu tìm kiếm đến server
        fetch('/api/rules/timvasua', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                // Hiển thị bảng khi có kết quả
                searchResult.style.display = "block";
                guideText.classList.add('hidden'); // Ẩn phần hướng dẫn khi có kết quả

                // Function to highlight keyword in text
                const highlightKeyword = (text, keyword) => {
                    const escapedKeyword = escapeRegExp(keyword); // Escape các ký tự đặc biệt
                    const keywordRegex = new RegExp(`(${escapedKeyword})`, 'gi');
                    return text.replace(keywordRegex, '<span class="highlight">$1</span>');
                };

                searchResult.innerHTML = data.results.map(result => {
                    const ruleParts = result.content.split(' ');
                    const [action, protocol, source, sourcePort, direction, destination, destinationPort, ...rest] = ruleParts;

                    // Tìm và lấy ra SID từ rule
                    const sidMatch = result.content.match(/sid:\s*(\d+);/);
                    const sid = sidMatch ? sidMatch[1] : '';

                    // Lưu giá trị gốc của rule
                    const originalValues = {
                        action,
                        protocol,
                        source,
                        sourcePort,
                        destination,
                        destinationPort
                    };

                    // Highlight phần từ khóa trong restContent
                    const highlightedRest = highlightKeyword(rest.join(' '), keyword);
                    const restContent = highlightedRest.replace(/;/g, '<span class="semicolon">;</span>');

                    return `
                        <div class="rule-result">
                            <h4 class="rule-title">Rule bạn đang tìm kiếm nằm tại: <span class="file-path">${result.file}</span> - Dòng: <span class="line-number">${result.line}</span></h4>

                            <div class="rule-detail">
                                <div class="rule-fields">
                                    <!-- Trường action và protocol -->
                                    <div class="select-container">
                                        <select class="action-field" data-original="${originalValues.action}">
                                            <option value="alert" ${action === 'alert' ? 'selected' : ''}>alert</option>
                                            <option value="drop" ${action === 'drop' ? 'selected' : ''}>drop</option>
                                            <option value="pass" ${action === 'pass' ? 'selected' : ''}>pass</option>
                                            <option value="reject" ${action === 'reject' ? 'selected' : ''}>reject</option>
                                            <option value="Deactive" ${action.startsWith('#') ? 'selected' : ''}>Deactive</option>
                                        </select>
                                    </div>

                                    <div class="select-container">
                                        <select class="protocol-field" data-original="${originalValues.protocol}">
                                            <option value="http" ${protocol === 'http' ? 'selected' : ''}>http</option>
                                            <option value="tcp" ${protocol === 'tcp' ? 'selected' : ''}>tcp</option>
                                            <option value="udp" ${protocol === 'udp' ? 'selected' : ''}>udp</option>
                                            <option value="icmp" ${protocol === 'icmp' ? 'selected' : ''}>icmp</option>
                                            <option value="ip" ${protocol === 'ip' ? 'selected' : ''}>ip</option>
                                            <option value="tls" ${protocol === 'tls' ? 'selected' : ''}>tls</option>
                                        </select>
                                    </div>

                                    <!-- Các trường cho phép nhập từ bàn phím -->
                                    <input type="text" class="editable-field source-field" value="${source}" data-original="${originalValues.source}">
                                    <input type="text" class="editable-field source-port-field" value="${sourcePort}" data-original="${originalValues.sourcePort}">
                                    <span class="non-editable-field direction-arrow" style="color: red;">${direction}</span> <!-- Đổi màu của "->" thành đỏ -->
                                    <input type="text" class="editable-field destination-field" value="${destination}" data-original="${originalValues.destination}">
                                    <input type="text" class="editable-field destination-port-field" value="${destinationPort}" data-original="${originalValues.destinationPort}">
                                    <span class="non-editable-field">${restContent}</span>
                                </div>
                                <button class="save-rule-button" data-sid="${sid}" data-file="${result.file}">Lưu</button>
                                <div class="loading-spinner"></div>
                                <span class="save-message"></span>
                                <div class="error-details"></div> <!-- Thêm phần hiển thị lỗi -->
                            </div>
                        </div>
                    `;
                }).join('');

                // Gắn sự kiện click cho các nút Lưu
                document.querySelectorAll('.save-rule-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const ruleDetail = e.target.closest('.rule-detail');
                        const file = e.target.dataset.file;
                        const sid = e.target.dataset.sid;

                        const spinner = ruleDetail.querySelector('.loading-spinner');
                        const saveMessage = ruleDetail.querySelector('.save-message');
                        const errorDetails = ruleDetail.querySelector('.error-details');

                        // Ẩn bảng lỗi mỗi lần nhấn Lưu
                        errorDetails.style.display = 'none';
                        errorDetails.innerHTML = '';

                        // Vô hiệu hóa nút Lưu trong khi xử lý
                        e.target.disabled = true;
                        spinner.style.display = 'inline-block';

                        // Lấy giá trị từ các trường
                        let action = ruleDetail.querySelector('.action-field').value.trim();
                        const currentAction = ruleDetail.querySelector('.action-field').getAttribute('data-original');

                        // Kiểm tra điều kiện cho action
                        if (action === 'Deactive') {
                            action = currentAction.startsWith('#') ? currentAction : `#${currentAction}`;
                        }

                        const protocol = ruleDetail.querySelector('.protocol-field').value.trim();
                        const source = ruleDetail.querySelector('.source-field').value.trim();
                        const sourcePort = ruleDetail.querySelector('.source-port-field').value.trim();
                        const destination = ruleDetail.querySelector('.destination-field').value.trim();
                        const destinationPort = ruleDetail.querySelector('.destination-port-field').value.trim();

                        // Gửi yêu cầu để cập nhật rule
                        fetch('/api/rules/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                file,
                                sid,
                                newAction: action,
                                newProtocol: protocol,
                                newSource: source,
                                newSourcePort: sourcePort,
                                newDestination: destination,
                                newDestinationPort: destinationPort
                            }),
                        })
                        .then(response => response.json())
                        .then(data => {
                            // Ẩn spinner và hiển thị thông báo
                            spinner.style.display = 'none';

                            if (data.message.includes('thành công')) {
                                saveMessage.textContent = 'Sửa rule thành công!';
                                saveMessage.classList.remove('error');
                                saveMessage.classList.add('success');
                            } else {
                                // Nếu có lỗi, hiển thị lỗi từ script kiemtrarule.sh và highlight phần bị lỗi
                                saveMessage.textContent = 'Có lỗi xảy ra: ' + data.message;
                                saveMessage.classList.add('error');

                                // Hiển thị lỗi chi tiết
                                if (data.errors) {
                                    errorDetails.innerHTML = `<pre>${data.errors}</pre>`;
                                    errorDetails.style.display = 'block';

                                    // Chỉ highlight những phần thay đổi
                                    if (currentAction !== action) {
                                        ruleDetail.querySelector('.action-field').style.border = '2px solid red';
                                    }
                                    if (ruleDetail.querySelector('.protocol-field').getAttribute('data-original') !== protocol) {
                                        ruleDetail.querySelector('.protocol-field').style.border = '2px solid red';
                                    }
                                    if (ruleDetail.querySelector('.source-field').getAttribute('data-original') !== source) {
                                        ruleDetail.querySelector('.source-field').style.border = '2px solid red';
                                    }
                                    if (ruleDetail.querySelector('.source-port-field').getAttribute('data-original') !== sourcePort) {
                                        ruleDetail.querySelector('.source-port-field').style.border = '2px solid red';
                                    }
                                    if (ruleDetail.querySelector('.destination-field').getAttribute('data-original') !== destination) {
                                        ruleDetail.querySelector('.destination-field').style.border = '2px solid red';
                                    }
                                    if (ruleDetail.querySelector('.destination-port-field').getAttribute('data-original') !== destinationPort) {
                                        ruleDetail.querySelector('.destination-port-field').style.border = '2px solid red';
                                    }
                                }
                            }
                            saveMessage.style.display = 'inline-block'; // Hiển thị thông báo
                        })
                        .catch(error => {
                            spinner.style.display = 'none';
                            saveMessage.textContent = 'Có lỗi xảy ra khi cập nhật rule: ' + error;
                            saveMessage.classList.add('error');
                            saveMessage.style.display = 'inline-block'; // Hiển thị thông báo
                        })
                        .finally(() => {
                            e.target.disabled = false; // Bật lại nút Lưu sau khi xử lý xong
                        });
                    });
                });
            } else {
                searchResult.style.display = "block"; // Hiển thị bảng dù không có kết quả
                searchResult.innerHTML = '<p class="no-result">Không tìm thấy rule nào phù hợp.</p>';
            }
        })
        .catch(error => {
            console.error('Error searching rules:', error);
            searchResult.style.display = "block"; // Hiển thị bảng khi có lỗi
            searchResult.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tìm kiếm rules.</p>';
        });
    });
});












// // Hàm escape để xử lý các ký tự đặc biệt trong regex
// function escapeRegExp(string) {
//     // Escape tất cả các ký tự đặc biệt trong regex
//     return string.replace(/([.*+?^${}()|[\]\\])/g, '\\$&'); 
// }

// document.addEventListener('DOMContentLoaded', () => {
//     const searchButton = document.getElementById('search-button');
//     const keywordInput = document.getElementById('keyword');
//     const searchResult = document.getElementById('timvasua');

//     // Xử lý sự kiện click của nút tìm kiếm
//     searchButton.addEventListener('click', () => {
//         const keyword = keywordInput.value.trim();

//         if (!keyword) {
//             searchResult.style.display = "block"; // Hiển thị bảng kết quả nếu không nhập từ khóa
//             searchResult.innerHTML = 'Please enter a keyword to search.';
//             return;
//         }

//         // Gửi yêu cầu tìm kiếm đến server
//         fetch('/api/rules/timvasua', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ keyword }),
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.results && data.results.length > 0) {
//                 // Hiển thị bảng khi có kết quả
//                 searchResult.style.display = "block";

//                 // Function to highlight keyword in text
//                 const highlightKeyword = (text, keyword) => {
//                     const escapedKeyword = escapeRegExp(keyword); // Escape các ký tự đặc biệt
//                     const keywordRegex = new RegExp(`(${escapedKeyword})`, 'gi');
//                     return text.replace(keywordRegex, '<span class="highlight">$1</span>');
//                 };

//                 searchResult.innerHTML = data.results.map(result => {
//                     const ruleParts = result.content.split(' ');
//                     const [action, protocol, source, sourcePort, direction, destination, destinationPort, ...rest] = ruleParts;

//                     // Tìm và lấy ra SID từ rule
//                     const sidMatch = result.content.match(/sid:(\d+);/);
//                     const sid = sidMatch ? sidMatch[1] : '';

//                     // Highlight phần từ khóa trong restContent
//                     const highlightedRest = highlightKeyword(rest.join(' '), keyword);
//                     const restContent = highlightedRest.replace(/;/g, '<span class="semicolon">;</span>');

//                     return `
//                         <div class="rule-result">
//                             <h4 class="rule-title">Rule bạn đang tìm kiếm nằm tại: <span class="file-path">${result.file}</span> - Dòng: <span class="line-number">${result.line}</span></h4>

//                             <div class="rule-detail">
//                                 <div class="rule-fields">
//                                     <!-- Trường action và protocol -->
//                                     <div class="select-container">
//                                         <select class="action-field" data-current-action="${action}">
//                                             <option value="alert" ${action === 'alert' ? 'selected' : ''}>alert</option>
//                                             <option value="drop" ${action === 'drop' ? 'selected' : ''}>drop</option>
//                                             <option value="pass" ${action === 'pass' ? 'selected' : ''}>pass</option>
//                                             <option value="reject" ${action === 'reject' ? 'selected' : ''}>reject</option>
//                                             <option value="Deactive" ${action.startsWith('#') ? 'selected' : ''}>Deactive</option>
//                                         </select>
//                                     </div>

//                                     <div class="select-container">
//                                         <select class="protocol-field">
//                                             <option value="http" ${protocol === 'http' ? 'selected' : ''}>http</option>
//                                             <option value="tcp" ${protocol === 'tcp' ? 'selected' : ''}>tcp</option>
//                                             <option value="udp" ${protocol === 'udp' ? 'selected' : ''}>udp</option>
//                                             <option value="icmp" ${protocol === 'icmp' ? 'selected' : ''}>icmp</option>
//                                         </select>
//                                     </div>

//                                     <!-- Các trường cho phép nhập từ bàn phím -->
//                                     <input type="text" class="editable-field source-field" value="${source}">
//                                     <input type="text" class="editable-field source-port-field" value="${sourcePort}">
//                                     <span class="non-editable-field direction-arrow" style="color: red;">${direction}</span> <!-- Đổi màu của "->" thành đỏ -->
//                                     <input type="text" class="editable-field destination-field" value="${destination}">
//                                     <input type="text" class="editable-field destination-port-field" value="${destinationPort}">
//                                     <span class="non-editable-field">${restContent}</span>
//                                 </div>
//                                 <button class="save-rule-button" data-sid="${sid}" data-file="${result.file}">Lưu</button>
//                             </div>
//                         </div>
//                     `;
//                 }).join('');

//                 // Gắn sự kiện click cho các nút Lưu
//                 document.querySelectorAll('.save-rule-button').forEach(button => {
//                     button.addEventListener('click', (e) => {
//                         const ruleDetail = e.target.closest('.rule-detail');
//                         const file = e.target.dataset.file;
//                         const sid = e.target.dataset.sid;

//                         // Lấy giá trị từ các trường
//                         let action = ruleDetail.querySelector('.action-field').value.trim();
//                         const currentAction = ruleDetail.querySelector('.action-field').getAttribute('data-current-action');

//                         if (action === 'Deactive') {
//                             // Nếu chọn "Deactive", thêm "#" vào giá trị hiện tại nếu nó chưa có
//                             action = currentAction.startsWith('#') ? currentAction : `#${currentAction}`;
//                         }

//                         const protocol = ruleDetail.querySelector('.protocol-field').value.trim();
//                         const source = ruleDetail.querySelector('.source-field').value.trim();
//                         const sourcePort = ruleDetail.querySelector('.source-port-field').value.trim();
//                         const direction = ruleDetail.querySelector('.non-editable-field.direction-arrow').textContent.trim(); // lấy direction (->)
//                         const destination = ruleDetail.querySelector('.destination-field').value.trim();
//                         const destinationPort = ruleDetail.querySelector('.destination-port-field').value.trim();
//                         const rest = ruleDetail.querySelectorAll('.non-editable-field')[1]?.textContent.replace(/<[^>]*>/g, '').trim() || ''; // Loại bỏ HTML khỏi rest

//                         // Tạo nội dung mới của rule
//                         const newContent = `${action} ${protocol} ${source} ${sourcePort} ${direction} ${destination} ${destinationPort} ${rest}`;

//                         // Gửi yêu cầu để cập nhật rule
//                         fetch('/api/rules/update', {
//                             method: 'POST',
//                             headers: {
//                                 'Content-Type': 'application/json',
//                             },
//                             body: JSON.stringify({ file, sid, newAction: action, newProtocol: protocol, newSource: source, newSourcePort: sourcePort, newDestination: destination, newDestinationPort: destinationPort }),
//                         })
//                         .then(response => response.json())
//                         .then(data => {
//                             if (data.message) {
//                                 alert(data.message);
//                             } else {
//                                 console.error('Unexpected response:', data);
//                                 alert('Có lỗi xảy ra khi cập nhật rule.');
//                             }
//                         })
//                         .catch(error => {
//                             console.error('Error updating rule:', error);
//                             alert('Có lỗi xảy ra khi cập nhật rule.');
//                         });
//                     });
//                 });
//             } else {
//                 searchResult.style.display = "block"; // Hiển thị bảng dù không có kết quả
//                 searchResult.innerHTML = '<p class="no-result">Không tìm thấy rule nào phù hợp.</p>';
//             }
//         })
//         .catch(error => {
//             console.error('Error searching rules:', error);
//             searchResult.style.display = "block"; // Hiển thị bảng khi có lỗi
//             searchResult.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tìm kiếm rules.</p>';
//         });
//     });
// });



// document.addEventListener('DOMContentLoaded', () => {
//     const searchButton = document.getElementById('search-button');
//     const keywordInput = document.getElementById('keyword');
//     const searchResult = document.getElementById('timvasua');

//     searchButton.addEventListener('click', () => {
//         const keyword = keywordInput.value.trim();

//         if (!keyword) {
//             searchResult.style.display = "block"; // Hiển thị bảng kết quả nếu không nhập từ khóa
//             searchResult.innerHTML = 'Please enter a keyword to search.';
//             return;
//         }

//         fetch('/api/rules/timvasua', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ keyword }),
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.results && data.results.length > 0) {
//                 // Hiển thị bảng khi có kết quả
//                 searchResult.style.display = "block";

//                 // Function to highlight keyword in text
//                 const highlightKeyword = (text, keyword) => {
//                     const keywordRegex = new RegExp(`(${keyword})`, 'gi');
//                     return text.replace(keywordRegex, '<span class="highlight">$1</span>');
//                 };

//                 searchResult.innerHTML = data.results.map(result => {
//                     const ruleParts = result.content.split(' ');
//                     const [action, protocol, source, sourcePort, direction, destination, destinationPort, ...rest] = ruleParts;

//                     // Tìm và lấy ra SID từ rule
//                     const sidMatch = result.content.match(/sid:(\d+);/);
//                     const sid = sidMatch ? sidMatch[1] : '';

//                     // Highlight phần từ khóa trong restContent
//                     const highlightedRest = highlightKeyword(rest.join(' '), keyword);
//                     const restContent = highlightedRest.replace(/;/g, '<span class="semicolon">;</span>');

//                     return `
//                         <div class="rule-result">
//                             <h4 class="rule-title">Rule bạn đang tìm kiếm nằm tại: <span class="file-path">${result.file}</span> - Dòng: <span class="line-number">${result.line}</span></h4>

//                             <div class="rule-detail">
//                                 <div class="rule-fields">
//                                     <!-- Trường action và protocol -->
//                                     <div class="select-container">
//                                         <select class="action-field" data-current-action="${action}">
//                                             <option value="alert" ${action === 'alert' ? 'selected' : ''}>alert</option>
//                                             <option value="drop" ${action === 'drop' ? 'selected' : ''}>drop</option>
//                                             <option value="pass" ${action === 'pass' ? 'selected' : ''}>pass</option>
//                                             <option value="reject" ${action === 'reject' ? 'selected' : ''}>reject</option>
//                                             <option value="Deactive" ${action.startsWith('#') ? 'selected' : ''}>Deactive</option>
//                                         </select>
//                                     </div>

//                                     <div class="select-container">
//                                         <select class="protocol-field">
//                                             <option value="http" ${protocol === 'http' ? 'selected' : ''}>http</option>
//                                             <option value="tcp" ${protocol === 'tcp' ? 'selected' : ''}>tcp</option>
//                                             <option value="udp" ${protocol === 'udp' ? 'selected' : ''}>udp</option>
//                                             <option value="icmp" ${protocol === 'icmp' ? 'selected' : ''}>icmp</option>
//                                         </select>
//                                     </div>

//                                     <!-- Các trường cho phép nhập từ bàn phím -->
//                                     <input type="text" class="editable-field source-field" value="${source}">
//                                     <input type="text" class="editable-field source-port-field" value="${sourcePort}">
//                                     <span class="non-editable-field direction-arrow" style="color: red;">${direction}</span> <!-- Đổi màu của "->" thành đỏ -->
//                                     <input type="text" class="editable-field destination-field" value="${destination}">
//                                     <input type="text" class="editable-field destination-port-field" value="${destinationPort}">
//                                     <span class="non-editable-field">${restContent}</span>
//                                 </div>
//                                 <button class="save-rule-button" data-sid="${sid}" data-file="${result.file}">Lưu</button>
//                             </div>
//                         </div>
//                     `;
//                 }).join('');

//                 // Gắn sự kiện click cho các nút Lưu
//                 document.querySelectorAll('.save-rule-button').forEach(button => {
//                     button.addEventListener('click', (e) => {
//                         const ruleDetail = e.target.closest('.rule-detail');
//                         const file = e.target.dataset.file;
//                         const sid = e.target.dataset.sid;

//                         // Lấy giá trị từ các trường
//                         let action = ruleDetail.querySelector('.action-field').value.trim();
//                         const currentAction = ruleDetail.querySelector('.action-field').getAttribute('data-current-action');

//                         if (action === 'Deactive') {
//                             // Nếu chọn "Deactive", thêm "#" vào giá trị hiện tại nếu nó chưa có
//                             action = currentAction.startsWith('#') ? currentAction : `#${currentAction}`;
//                         }

//                         const protocol = ruleDetail.querySelector('.protocol-field').value.trim();
//                         const source = ruleDetail.querySelector('.source-field').value.trim();
//                         const sourcePort = ruleDetail.querySelector('.source-port-field').value.trim();
//                         const direction = ruleDetail.querySelector('.non-editable-field.direction-arrow').textContent.trim(); // lấy direction (->)
//                         const destination = ruleDetail.querySelector('.destination-field').value.trim();
//                         const destinationPort = ruleDetail.querySelector('.destination-port-field').value.trim();
//                         const rest = ruleDetail.querySelectorAll('.non-editable-field')[1]?.textContent.replace(/<[^>]*>/g, '').trim() || ''; // Loại bỏ HTML khỏi rest

//                         // Tạo nội dung mới của rule
//                         const newContent = `${action} ${protocol} ${source} ${sourcePort} ${direction} ${destination} ${destinationPort} ${rest}`;

//                         // Gửi yêu cầu để cập nhật rule
//                         fetch('/api/rules/update', {
//                             method: 'POST',
//                             headers: {
//                                 'Content-Type': 'application/json',
//                             },
//                             body: JSON.stringify({ file, sid, newAction: action, newProtocol: protocol, newSource: source, newSourcePort: sourcePort, newDestination: destination, newDestinationPort: destinationPort }),
//                         })
//                         .then(response => response.json())
//                         .then(data => {
//                             if (data.message) {
//                                 alert(data.message);
//                             } else {
//                                 console.error('Unexpected response:', data);
//                                 alert('Có lỗi xảy ra khi cập nhật rule.');
//                             }
//                         })
//                         .catch(error => {
//                             console.error('Error updating rule:', error);
//                             alert('Có lỗi xảy ra khi cập nhật rule.');
//                         });
//                     });
//                 });
//             } else {
//                 searchResult.style.display = "block"; // Hiển thị bảng dù không có kết quả
//                 searchResult.innerHTML = '<p class="no-result">Không tìm thấy rule nào phù hợp.</p>';
//             }
//         })
//         .catch(error => {
//             console.error('Error searching rules:', error);
//             searchResult.style.display = "block"; // Hiển thị bảng khi có lỗi
//             searchResult.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tìm kiếm rules.</p>';
//         });
//     });
// });
