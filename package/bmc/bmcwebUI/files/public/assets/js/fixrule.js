// API endpoint cho server
const API_BASE = '/api/rules/file/';

// Tạo Ace Editor
const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/text");

// Biến lưu trữ dữ liệu
let originalContent = ""; // File gốc
let modifiedContent = ""; // File đã sửa đổi
let changes = []; // Các thay đổi thực sự
let fullContent = ""; // Toàn bộ nội dung file mới

// Hàm lấy query parameter từ URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Lấy tên file từ query parameter
const fileName = getQueryParameter('search');

// Hiển thị tên rules trong h2#ruleName
if (fileName) {
    const ruleNameElement = document.getElementById('ruleName');
    ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">${decodeURIComponent(fileName)}</span>`;
} else {
    const ruleNameElement = document.getElementById('ruleName');
    ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">[No rule selected]</span>`;
}

// Tải nội dung file
function loadFile(fileName) {
    fetch(`${API_BASE}${fileName}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                originalContent = data.content.trim(); // Lưu nội dung gốc khi tải file
                modifiedContent = originalContent; // Ban đầu nội dung sửa đổi giống file gốc
                fullContent = originalContent; // Cập nhật toàn bộ nội dung ban đầu
                editor.setValue(originalContent, -1); // Nạp nội dung file vào editor
            } else {
                showSaveMessage('Không thể tải nội dung file: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showSaveMessage('Lỗi khi tải file: ' + error.message, 'error');
        });
}

// Theo dõi các thay đổi trong editor
editor.session.on('change', function () {
    fullContent = editor.getValue().trim(); // Lưu toàn bộ nội dung mới vào biến
    const currentContent = fullContent; 
    if (currentContent !== modifiedContent) {
        modifiedContent = currentContent;
        changes = calculateChanges(originalContent, modifiedContent); // Cập nhật danh sách thay đổi
    }
});

// Hàm tính toán các thay đổi
function calculateChanges(original, modified) {
    const originalLines = original.split("\n");
    const modifiedLines = modified.split("\n");
    const result = [];

    const originalMap = new Map(); // Lưu các dòng gốc theo SID
    originalLines.forEach(line => {
        const sidMatch = line.match(/sid:(\d+);/);
        if (sidMatch) {
            originalMap.set(sidMatch[1], line.trim());
        }
    });

    modifiedLines.forEach((line, index) => {
        const sidMatch = line.match(/sid:(\d+);/);
        const isNewLine = !sidMatch || !originalMap.has(sidMatch[1]);

        // Nếu dòng mới hoặc khác dòng gốc
        if (isNewLine || (sidMatch && originalMap.get(sidMatch[1]) !== line.trim())) {
            result.push({
                content: line.trim(),
                index: index
            });
        }
    });

    return result;
}

// Lưu nội dung chỉnh sửa
function saveFile(fileName) {
    const spinner = document.getElementById('loading-spinner');
    const saveMessage = document.getElementById('saveMessage');
    const errorDetails = document.getElementById('errorDetails');

    if (!fullContent || fullContent.trim() === originalContent.trim()) {
        showSaveMessage('Không có thay đổi nào để lưu.', 'error');
        return;
    }

    // Hiển thị spinner
    spinner.style.display = 'inline-block';
    saveMessage.textContent = '';

    fetch(`${API_BASE}${fileName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            changes: changes, // Danh sách thay đổi cụ thể
            fullFileContent: fullContent // Toàn bộ nội dung file mới
        })
    })
        .then(response => response.json())
        .then(data => {
            // Ẩn spinner
            spinner.style.display = 'none';

            if (data.success) {
                showSaveMessage(data.message || 'Tệp đã được lưu thành công!', 'success');
                errorDetails.style.display = 'none';
                resetState(fullContent); // Reset lại trạng thái
            } else {
                showSaveMessage(data.message || 'Có lỗi xảy ra!', 'error');
                errorDetails.textContent = data.errors ? data.errors.join('\n') : 'Không rõ lỗi!';
                errorDetails.style.display = 'block';
            }
        })
        .catch(error => {
            spinner.style.display = 'none';
            showSaveMessage('Lỗi: ' + error.message, 'error');
            errorDetails.textContent = error.message;
            errorDetails.style.display = 'block';
        });
}

// Reset trạng thái sau khi lưu
function resetState(content) {
    originalContent = content;
    modifiedContent = content;
    fullContent = content; // Cập nhật lại nội dung mới
    changes = [];
    editor.setValue(content, -1);
}

// Hiển thị thông báo
function showSaveMessage(message, type) {
    const saveMessage = document.getElementById('saveMessage');
    saveMessage.textContent = message;
    saveMessage.style.color = type === 'success' ? 'green' : 'red';
    saveMessage.style.display = 'inline';
}

// Gắn sự kiện nhấn nút "Lưu"
document.getElementById('saveFileBtn').addEventListener('click', function () {
    saveFile(fileName);
});

// Tải nội dung file khi trang được load
if (fileName) {
    loadFile(fileName);
} else {
    showSaveMessage('Tên file không hợp lệ!', 'error');
}

// // API endpoint cho server
// const API_BASE = '/api/rules/file/';

// // Tạo Ace Editor
// const editor = ace.edit("editor");
// editor.setTheme("ace/theme/monokai");
// editor.session.setMode("ace/mode/text");

// // Biến lưu trữ dữ liệu
// let originalContent = ""; // File gốc
// let modifiedContent = ""; // File đã sửa đổi
// let changes = []; // Các thay đổi thực sự

// // Hàm lấy query parameter từ URL
// function getQueryParameter(name) {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(name);
// }

// // Lấy tên file từ query parameter
// const fileName = getQueryParameter('search');

// // Hiển thị tên rules trong h2#ruleName
// if (fileName) {
//     const ruleNameElement = document.getElementById('ruleName');
//     ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">${decodeURIComponent(fileName)}</span>`;
// } else {
//     const ruleNameElement = document.getElementById('ruleName');
//     ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">[No rule selected]</span>`;
// }

// // Tải nội dung file
// function loadFile(fileName) {
//     fetch(`${API_BASE}${fileName}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 originalContent = data.content.trim(); // Lưu nội dung gốc khi tải file
//                 modifiedContent = originalContent; // Ban đầu nội dung sửa đổi giống file gốc
//                 editor.setValue(originalContent, -1); // Nạp nội dung file vào editor
//             } else {
//                 showSaveMessage('Không thể tải nội dung file: ' + data.message, 'error');
//             }
//         })
//         .catch(error => {
//             showSaveMessage('Lỗi khi tải file: ' + error.message, 'error');
//         });
// }

// // Theo dõi các thay đổi trong editor
// editor.session.on('change', function () {
//     const currentContent = editor.getValue().trim();
//     if (currentContent !== modifiedContent) {
//         modifiedContent = currentContent;
//         changes = calculateChanges(originalContent, modifiedContent); // Cập nhật danh sách thay đổi
//     }
// });

// // Hàm tính toán các thay đổi
// function calculateChanges(original, modified) {
//     const originalLines = original.split("\n");
//     const modifiedLines = modified.split("\n");
//     const result = [];

//     const originalMap = new Map(); // Lưu các dòng gốc theo SID
//     originalLines.forEach(line => {
//         const sidMatch = line.match(/sid:(\d+);/);
//         if (sidMatch) {
//             originalMap.set(sidMatch[1], line.trim());
//         }
//     });

//     modifiedLines.forEach((line, index) => {
//         const sidMatch = line.match(/sid:(\d+);/);
//         const isNewLine = !sidMatch || !originalMap.has(sidMatch[1]);

//         // Nếu dòng mới hoặc khác dòng gốc
//         if (isNewLine || (sidMatch && originalMap.get(sidMatch[1]) !== line.trim())) {
//             result.push({
//                 content: line.trim(),
//                 index: index
//             });
//         }
//     });

//     return result;
// }

// // Lưu nội dung chỉnh sửa
// function saveFile(fileName) {
//     const spinner = document.getElementById('loading-spinner');
//     const saveMessage = document.getElementById('saveMessage');
//     const errorDetails = document.getElementById('errorDetails');

//     if (changes.length === 0) {
//         showSaveMessage('Không có thay đổi nào để lưu.', 'error');
//         return;
//     }

//     // Hiển thị spinner
//     spinner.style.display = 'inline-block';
//     saveMessage.textContent = '';

//     fetch(`${API_BASE}${fileName}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             changes: changes,
//             fullFileContent: modifiedContent
//         })
//     })
//         .then(response => response.json())
//         .then(data => {
//             // Ẩn spinner
//             spinner.style.display = 'none';

//             if (data.success) {
//                 showSaveMessage(data.message || 'Tệp đã được lưu thành công!', 'success');
//                 errorDetails.style.display = 'none';
//                 resetState(modifiedContent); // Reset lại trạng thái
//             } else {
//                 showSaveMessage(data.message || 'Có lỗi xảy ra!', 'error');
//                 errorDetails.textContent = data.errors ? data.errors.join('\n') : 'Không rõ lỗi!';
//                 errorDetails.style.display = 'block';
//             }
//         })
//         .catch(error => {
//             spinner.style.display = 'none';
//             showSaveMessage('Lỗi: ' + error.message, 'error');
//             errorDetails.textContent = error.message;
//             errorDetails.style.display = 'block';
//         });
// }

// // Reset trạng thái sau khi lưu
// function resetState(content) {
//     originalContent = content;
//     modifiedContent = content;
//     changes = [];
//     editor.setValue(content, -1);
// }

// // Hiển thị thông báo
// function showSaveMessage(message, type) {
//     const saveMessage = document.getElementById('saveMessage');
//     saveMessage.textContent = message;
//     saveMessage.style.color = type === 'success' ? 'green' : 'red';
//     saveMessage.style.display = 'inline';
// }

// // Gắn sự kiện nhấn nút "Lưu"
// document.getElementById('saveFileBtn').addEventListener('click', function () {
//     saveFile(fileName);
// });

// // Tải nội dung file khi trang được load
// if (fileName) {
//     loadFile(fileName);
// } else {
//     showSaveMessage('Tên file không hợp lệ!', 'error');
// }



// // API endpoints đã được đổi tên
// const API_BASE = '/api/rules/file/';

// // Tạo Ace Editor
// const editor = ace.edit("editor");
// editor.setTheme("ace/theme/monokai");
// editor.session.setMode("ace/mode/text");

// // Lưu nội dung gốc khi tải file
// let originalContent = "";

// // Hàm lấy query parameter từ URL
// function getQueryParameter(name) {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(name);
// }

// // Lấy tên file từ query parameter
// const fileName = getQueryParameter('search');

// // Hiển thị tên rules trong h2#ruleName
// if (fileName) {
//     const ruleNameElement = document.getElementById('ruleName');
//     ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">${decodeURIComponent(fileName)}</span>`;
// } else {
//     const ruleNameElement = document.getElementById('ruleName');
//     ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">[No rule selected]</span>`;
// }

// // Tải nội dung file
// function loadFile(fileName) {
//     fetch(`${API_BASE}${fileName}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 originalContent = data.content.trim(); // Lưu nội dung gốc khi tải file
//                 editor.setValue(data.content.trim(), -1); // Nạp nội dung file vào editor
//             } else {
//                 showSaveMessage('Không thể tải nội dung file: ' + data.message, 'error');
//             }
//         })
//         .catch(error => {
//             showSaveMessage('Lỗi khi tải file: ' + error.message, 'error');
//         });
// }

// // Hàm tìm các dòng khác biệt (sửa đổi hoặc thêm mới)
// function getChangedLines(original, current) {
//     const originalLines = original.split("\n");
//     const currentLines = current.split("\n");
//     const changedLines = [];

//     currentLines.forEach((line, index) => {
//         if (line.trim() !== (originalLines[index] || "").trim()) {
//             const sidMatch = line.match(/sid:(\d+);/); // Lấy sid từ dòng sửa
//             const sid = sidMatch ? sidMatch[1] : null;
//             if (sid) {
//                 changedLines.push({ sid, content: line.trim() });
//             }
//         }
//     });

//     return changedLines;
// }

// // Lưu nội dung chỉnh sửa
// function saveFile(fileName) {
//     const currentContent = editor.getValue().trim(); // Lấy nội dung hiện tại từ editor
//     const changedLines = getChangedLines(originalContent, currentContent); // Tìm các dòng khác biệt
//     const spinner = document.getElementById('loading-spinner'); // Lấy spinner
//     const saveMessage = document.getElementById('saveMessage'); // Thông báo lưu
//     const errorDetails = document.getElementById('errorDetails'); // Hiển thị lỗi

//     if (changedLines.length === 0) {
//         showSaveMessage('Không có thay đổi nào để lưu.', 'error');
//         return;
//     }

//     // Hiển thị spinner
//     spinner.style.display = 'inline-block';
//     saveMessage.textContent = ''; // Xóa thông báo cũ

//     fetch(`${API_BASE}${fileName}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ changes: changedLines }) // Gửi các dòng khác biệt với `sid`
//     })
//         .then(response => response.json())
//         .then(data => {
//             // Ẩn spinner
//             spinner.style.display = 'none';

//             if (data.success) {
//                 showSaveMessage(data.message || 'Tệp đã được lưu thành công!', 'success');
//                 errorDetails.style.display = 'none'; // Ẩn thông báo lỗi nếu có
//             } else {
//                 showSaveMessage(data.message || 'Có lỗi xảy ra!', 'error');
//                 // Hiển thị lỗi chi tiết
//                 errorDetails.textContent = data.errors ? data.errors.join('\n') : 'Không rõ lỗi!';
//                 errorDetails.style.display = 'block';
//             }
//         })
//         .catch(error => {
//             // Ẩn spinner
//             spinner.style.display = 'none';
//             showSaveMessage('Lỗi: ' + error.message, 'error');
//             errorDetails.textContent = error.message;
//             errorDetails.style.display = 'block';
//         });
// }

// // Hiển thị thông báo
// function showSaveMessage(message, type) {
//     const saveMessage = document.getElementById('saveMessage');
//     saveMessage.textContent = message;
//     saveMessage.style.color = type === 'success' ? 'green' : 'red';
//     saveMessage.style.display = 'inline';
//     // setTimeout(() => {
//     //     saveMessage.style.display = 'none';
//     // }, 3000);
// }

// // Gắn sự kiện nhấn nút "Lưu"
// document.getElementById('saveFileBtn').addEventListener('click', function () {
//     saveFile(fileName);
// });

// // Tải nội dung file khi trang được load
// if (fileName) {
//     loadFile(fileName);
// } else {
//     showSaveMessage('Tên file không hợp lệ!', 'error');
// }


// // API endpoints đã được đổi tên
// const API_BASE = '/api/rules/file/';

// // Tạo Ace Editor
// const editor = ace.edit("editor");
// editor.setTheme("ace/theme/monokai");
// editor.session.setMode("ace/mode/text");

// // Lưu nội dung gốc khi tải file
// let originalContent = "";

// // Hàm lấy query parameter từ URL
// function getQueryParameter(name) {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(name);
// }

// // Lấy tên file từ query parameter
// const fileName = getQueryParameter('search');

// // Hiển thị tên rules trong h2#ruleName
// if (fileName) {
//     const ruleNameElement = document.getElementById('ruleName');
//     ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">${decodeURIComponent(fileName)}</span>`;
// } else {
//     const ruleNameElement = document.getElementById('ruleName');
//     ruleNameElement.innerHTML = `<span>Edit rules:</span> <span style="color: #127fbe;">[No rule selected]</span>`;
// }

// // Tải nội dung file
// function loadFile(fileName) {
//     fetch(`${API_BASE}${fileName}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 originalContent = data.content.trim(); // Lưu nội dung gốc khi tải file
//                 editor.setValue(data.content.trim(), -1); // Nạp nội dung file vào editor
//             } else {
//                 alert(data.message);
//             }
//         })
//         .catch(error => {
//             alert('Lỗi khi tải file: ' + error.message);
//         });
// }

// // Hàm tìm các dòng khác biệt (sửa đổi hoặc thêm mới)
// function getChangedLines(original, current) {
//     const originalLines = original.split("\n");
//     const currentLines = current.split("\n");
//     const changedLines = [];

//     currentLines.forEach((line, index) => {
//         if (line.trim() !== (originalLines[index] || "").trim()) {
//             const sidMatch = line.match(/sid:(\d+);/); // Lấy sid từ dòng sửa
//             const sid = sidMatch ? sidMatch[1] : null;
//             if (sid) {
//                 changedLines.push({ sid, content: line.trim() });
//             }
//         }
//     });

//     return changedLines;
// }

// // Lưu nội dung chỉnh sửa
// function saveFile(fileName) {
//     const currentContent = editor.getValue().trim(); // Lấy nội dung hiện tại từ editor
//     const changedLines = getChangedLines(originalContent, currentContent); // Tìm các dòng khác biệt

//     if (changedLines.length === 0) {
//         alert('Không có thay đổi nào để lưu.');
//         return;
//     }

//     fetch(`${API_BASE}${fileName}`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ changes: changedLines }) // Gửi các dòng khác biệt với `sid`
//     })
//         .then(response => response.json())
//         .then(data => {
//             const saveMessage = document.getElementById('saveMessage');
//             if (data.success) {
//                 saveMessage.textContent = 'Tệp đã được lưu thành công!';
//                 saveMessage.style.color = 'green';
//                 console.log('Updated content:', data.updatedContent); // Hiển thị nội dung cập nhật
//             } else {
//                 saveMessage.textContent = `Lỗi: ${data.message}`;
//                 saveMessage.style.color = 'red';
//             }
//         })
//         .catch(error => {
//             alert('Lỗi khi lưu file: ' + error.message);
//         });
// }

// // Gắn sự kiện nhấn nút "Lưu"
// document.getElementById('saveFileBtn').addEventListener('click', function () {
//     saveFile(fileName);
// });

// // Tải nội dung file khi trang được load
// if (fileName) {
//     loadFile(fileName);
// } else {
//     alert('Tên file không hợp lệ!');
// }
