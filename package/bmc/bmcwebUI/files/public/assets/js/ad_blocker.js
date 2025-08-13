import {
    sessionID,
    csrfToken,
    setDeviceInfo,
    checkSession,
    getSessionID,
} from "./pihole-session.js";

// Thêm vào đầu file, sau phần import
const utils = {
    hexEncode: function(str) {
        return str.split('').map(char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    },
    
    hexDecode: function(str) {
        return decodeURIComponent(str);
    },
  
    escapeHtml: function(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    },
  
    datetime: function(timestamp, html = true) {
        const date = new Date(timestamp * 1000);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        };
        return date.toLocaleString(undefined, options);
    },
    
    datetimeRelative: function(timestamp) {
        const now = new Date();
        const date = new Date(timestamp * 1000);
        const diff = (now - date) / 1000; // seconds
        if (diff < 60) return `${Math.round(diff)} seconds ago`;
        if (diff < 3600) return `${Math.round(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.round(diff / 3600)} hours ago`;
        return `${Math.round(diff / 86400)} days ago`;
    },
  
    disableAll: function() {
        $("input").prop("disabled", true);
        $("select").prop("disabled", true);
        $("button").prop("disabled", true);
        $(".btn").addClass("disabled");
    },
  
    enableAll: function() {
        $("input").prop("disabled", false);
        $("select").prop("disabled", false);
        $("button").prop("disabled", false);
        $(".btn").removeClass("disabled");
    },
  
    changeBulkDeleteStates: function(table) {
        const count = table.rows({ selected: true }).count();
        const buttons = $(".datatable-bt");
        const deleteButton = $(".deleteSelected");
        
        buttons.css("display", "inline-block");
        deleteButton.prop("disabled", count === 0);
    },
  
    stateSaveCallback: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.log("Failed to save state data:", e);
        }
    },
  
    stateLoadCallback: function(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            console.log("Failed to load state data:", e);
            return null;
        }
    }
};

// Thêm hàm apiFailure
function apiFailure(data) {
    let text = data.responseText;
    if (data.responseJSON && data.responseJSON.error) {
        text = data.responseJSON.error;
    }
    showAlert("error", "", "Lỗi API", text);
    console.error("Lỗi API:", data);
}

// Thêm hàm updateFtlInfo
async function updateFtlInfo() {
    try {
        const response = await fetch('/api/proxy/stats');
        if (!response.ok) {
            throw new Error(`Phản hồi mạng không ổn: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data && typeof data.lists_being_processed === 'number') {
            $("#lists-count").text(data.lists_being_processed.toLocaleString());
        } else {
            console.warn("Dữ liệu từ /api/proxy/stats không hợp lệ:", data);
            $("#lists-count").text("N/A");
        }
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin FTL:", error);
        $("#lists-count").text("N/A");
    }
}

// Biến global để lưu thông tin thiết bị và bảng DataTable
let deviceInfo_analysis = null;
let table = null;
let groups = [];

// Hàm lấy thông tin thiết bị từ session
async function getDeviceInfo() {
    try {
        const response = await fetch("/get-current-device");
        const result = await response.json();
  
        if (result.success) {
            deviceInfo_analysis = result.data;
            console.log("✅ Thông tin thiết bị đã lưu:", deviceInfo_analysis);
            return deviceInfo_analysis;
        } else {
            console.error("❌ Lỗi:", result.message);
            return null;
        }
    } catch (error) {
        console.error("❌ Lỗi khi lấy thông tin thiết bị:", error);
        return null;
    }
}

// Hàm điền danh sách groups vào select
function populateGroupSelect(selectEl) {
    if (selectEl.length === 0) {
        return;
    }
  
    selectEl.empty();
  
    for (var i = 0; i < groups.length; i++) {
        var dataSub = "";
        if (!groups[i].enabled) {
            dataSub = 'data-subtext="(tắt)"';
        }
  
        selectEl.append(
            $("<option " + dataSub + "/>")
                .val(groups[i].id)
                .text(groups[i].name)
        );
    }
  
    selectEl.val([0]);
    selectEl.selectpicker("refresh");
}

// Hàm lấy danh sách groups
async function getGroups() {
    try {
        const sid = await checkSession();
        if (!sid) {
            console.warn("⚠️ Không có SID hợp lệ để lấy danh sách groups...");
            return;
        }
  
        const response = await fetch("/api/proxy/groups", {
            method: 'GET',
            headers: {
                'X-FTL-SID': sessionID,
                'X-FTL-CSRF': csrfToken
            }
        });
  
        if (!response.ok) {
            throw new Error('Phản hồi mạng không ổn');
        }
  
        const data = await response.json();
        console.log("📊 Dữ liệu Groups:", data);
        groups = data.groups || [];
  
        const groupSelectors = $(".selectpicker");
        groupSelectors.each(function() {
            populateGroupSelect($(this));
        });
    } catch (error) {
        console.error("❌ Lỗi khi lấy danh sách groups:", error);
        showAlert("error", "", "Lỗi khi lấy danh sách groups", error.message);
    }
}

// Hàm xử lý kết quả thao tác với groups
function processGroupResult(data, type, done, notDone) {
    if (data.processed && data.processed.success) {
        data.processed.success.forEach(function (item) {
            showAlert("success", "fas fa-pencil-alt", `Đã ${done} thành công`);
        });
    }
  
    if (data.processed && data.processed.errors) {
        data.processed.errors.forEach(function (error) {
            console.error(error);
            showAlert("error", "", `Lỗi khi ${notDone} ${type} ${error.item}`, error.error);
        });
    }
}

// Hàm xóa nhiều items
async function delGroupItems(type, ids, table, listType = undefined) {
    if (!Array.isArray(ids)) return;
  
    try {
        const sid = await checkSession();
        if (!sid) {
            console.warn("⚠️ Không có SID hợp lệ để xóa items...");
            return;
        }
  
        let idstring = ids.map(id => utils.hexDecode(id.item)).join(", ");
        type += ids.length > 1 ? "s" : "";
        if (listType !== undefined) {
            type = listType + " " + type;
        }
  
        showAlert("info", "", `Đang xóa ${ids.length} ${type}...`, idstring);
  
        console.log("Gửi yêu cầu xóa đến /api/proxy/lists:batchDelete với dữ liệu:", ids);
        const response = await fetch(`/api/proxy/lists:batchDelete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-FTL-SID': sessionID,
                'X-FTL-CSRF': csrfToken
            },
            body: JSON.stringify(ids)
        });
  
        if (!response.ok) {
            const errorText = await response.text();
            console.log("Phản hồi lỗi từ /api/proxy/lists:batchDelete:", errorText);
            throw new Error(errorText || 'Phản hồi mạng không ổn');
        }
  
        const data = await response.json();
        console.log("Phản hồi từ /api/proxy/lists:batchDelete:", data);
        showAlert("success", "far fa-trash-alt", `Đã xóa ${type} thành công`, idstring);
        table.ajax.reload(null, false);
        table.rows().deselect();
        const hasSelected = table.rows({ selected: true }).count() > 0;
        $(".deleteSelected").prop("disabled", !hasSelected);
        updateFtlInfo();
  
    } catch (error) {
        console.error(`❌ Lỗi khi xóa ${type}:`, error);
        showAlert("error", "", `Lỗi khi xóa ${type}`, error.message);
    }
}

// Hàm hiển thị alert
function showAlert(type, icon, title, message) {
    let alertClass = "alert-info";
    switch (type) {
        case "success":
            alertClass = "alert-success";
            break;
        case "error":
            alertClass = "alert-danger";
            break;
        case "warning":
            alertClass = "alert-warning";
            break;
    }
  
    const alert = $('<div class="alert ' + alertClass + ' alert-dismissible fade show" role="alert">')
        .append($('<strong>').text(title))
        .append($('<p>').text(message))
        .append('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>');
  
    $("#alerts").append(alert);
  
    setTimeout(function() {
        alert.alert('close');
    }, 5000);
}

// Hàm định dạng chi tiết cho child rows
function format(data) {
    var statusText = setStatusText(data, true);
    var numbers = data.status !== 0 && data.status !== 4;
  
    var dateAddedISO = utils.datetime(data.date_added, false),
        dateModifiedISO = utils.datetime(data.date_modified, false),
        dateUpdated = data.date_updated > 0
            ? utils.datetimeRelative(data.date_updated) + " (" + utils.datetime(data.date_updated, false) + ")"
            : "N/A",
        numberOfEntries = numbers
            ? parseInt(data.number, 10).toLocaleString() +
              (data.abp_entries > 0 ? ` (trong đó ${parseInt(data.abp_entries, 10).toLocaleString()} là kiểu ABP)` : "")
            : "N/A",
        nonDomains = numbers ? parseInt(data.invalid_domains, 10).toLocaleString() : "N/A";
  
    return `<table>
        <tr class="dataTables-child">
            <td>Loại:  </td><td>${setTypeIcon(data.type)}${data.type}list</td>
        </tr>
        <tr class="dataTables-child">
            <td>Trạng thái sức khỏe:  </td><td>${statusText}</td>
        </tr>
        <tr class="dataTables-child">
            <td>Thêm vào Pi-hole:  </td>
            <td>${utils.datetimeRelative(data.date_added)} (${dateAddedISO})</td>
        </tr>
        <tr class="dataTables-child">
            <td>Lần sửa cuối trong cơ sở dữ liệu:  </td>
            <td>${utils.datetimeRelative(data.date_modified)} (${dateModifiedISO})</td>
        </tr>
        <tr class="dataTables-child">
            <td>Nội dung cập nhật lần cuối:  </td><td>${dateUpdated}</td>
        </tr>
        <tr class="dataTables-child">
            <td>Số lượng mục:  </td><td>${numberOfEntries}</td>
        </tr>
        <tr class="dataTables-child">
            <td>Số lượng không phải domain:  </td><td>${nonDomains}</td>
        </tr>
        <tr class="dataTables-child">
            <td>ID cơ sở dữ liệu:</td><td>${data.id}</td>
        </tr>
    </table>`;
}

// Hàm đặt biểu tượng trạng thái với màu sắc
function setStatusIcon(data) {
    var statusCode = parseInt(data.status, 10),
        statusTitle = setStatusText(data) + "\nNhấp để xem chi tiết về danh sách này",
        statusIcon,
        colorClass;

    switch (statusCode) {
        case 1:
            statusIcon = "fa-check-circle";
            colorClass = "text-green"; // Màu xanh lá cho trạng thái thành công
            break;
        case 2:
            statusIcon = "fa-history";
            colorClass = "text-yellow"; // Màu vàng cho trạng thái sử dụng bản sao cục bộ
            break;
        case 3:
            statusIcon = "fa-exclamation-circle";
            colorClass = "text-orange"; // Màu cam cho trạng thái cảnh báo
            break;
        case 4:
            statusIcon = "fa-times-circle";
            colorClass = "text-red"; // Màu đỏ cho trạng thái lỗi
            break;
        default:
            statusIcon = "fa-question-circle";
            colorClass = "text-gray"; // Màu xám cho trạng thái không xác định
            break;
    }

    return `<i class='fa fa-fw ${statusIcon} ${colorClass}' title='${statusTitle}'></i>`;
}

// Hàm đặt văn bản trạng thái
function setStatusText(data, showdetails = false) {
    var statusText = "Không xác định",
        statusDetails = "";
    if (data.status !== null) {
        switch (parseInt(data.status, 10)) {
            case 0:
                statusText = data.enabled === 0 ? "Danh sách bị tắt và không được kiểm tra" : "Danh sách chưa được tải xuống";
                break;
            case 1:
                statusText = "Tải danh sách thành công";
                statusDetails = ' (<span class="list-status-1">OK</span>)';
                break;
            case 2:
                statusText = "Danh sách không thay đổi ở nguồn, Pi-hole sử dụng bản sao cục bộ";
                statusDetails = ' (<span class="list-status-2">OK</span>)';
                break;
            case 3:
                statusText = "Danh sách không khả dụng, Pi-hole sử dụng bản sao cục bộ";
                statusDetails = ' (<span class="list-status-3">kiểm tra danh sách</span>)';
                break;
            case 4:
                statusText = "Danh sách không khả dụng, không có bản sao cục bộ trên Pi-hole";
                statusDetails = ' (<span class="list-status-4">thay thế danh sách</span>)';
                break;
            default:
                statusText = "Không xác định";
                statusDetails = ' (<span class="list-status-0">' + parseInt(data.status, 10) + "</span>)";
                break;
        }
    }
  
    return statusText + (showdetails ? statusDetails : "");
}

// Hàm đặt biểu tượng loại
function setTypeIcon(type) {
    let iconClass = "fa-question text-orange",
        title = "Danh sách này thuộc loại không xác định";
    if (type === "block") {
        iconClass = "fa-ban text-red";
        title = "Đây là blocklist";
    } else if (type === "allow") {
        iconClass = "fa-check text-green";
        title = "Đây là allowlist";
    }
  
    return `<i class='fa fa-fw ${iconClass}' title='${title}\nNhấp để xem chi tiết về danh sách này'></i> `;
}

// Hàm xóa lists
function deleteLists(encodedIds) {
    const decodedIds = encodedIds.map(id => {
        const parts = typeof id === 'string' ? id.split("_") : [id.item, id.type];
        return {
            item: utils.hexDecode(parts[0]),
            type: parts[1]
        };
    });
  
    delGroupItems("list", decodedIds, table);
}

// Hàm xóa list
async function deleteList() {
    const dataId = $(this).closest("tr").attr("data-id");
    if (!dataId) return;
  
    console.log("Data-id từ hàng:", dataId); // Log để debug
    const decodedDataId = utils.hexDecode(dataId); // Giải mã toàn bộ dataId trước
    console.log("Data-id sau khi giải mã:", decodedDataId); // Log để kiểm tra
    const parts = decodedDataId.split("_");
    if (parts.length !== 2) {
        console.error("Định dạng data-id không hợp lệ sau khi giải mã:", decodedDataId);
        return;
    }
  
    const decodedId = {
        item: parts[0], // Phần đầu là item (địa chỉ)
        type: parts[1]  // Phần sau là type (block/allow)
    };
  
    console.log("Dữ liệu sau khi tách:", decodedId); // Log để debug
    try {
        await delGroupItems("list", [decodedId], table);
    } catch (error) {
        console.error("❌ Lỗi trong quá trình xóa list:", error);
        apiFailure({
            responseText: error.message
        });
    }
}

// Hàm chỉnh sửa list
async function editList() {
    try {
        const sid = await checkSession();
        if (!sid) {
            console.warn("⚠️ Không có SID hợp lệ để sửa list...");
            return;
        }
  
        const elem = $(this).attr("id");
        const tr = $(this).closest("tr");
        const dataId = tr.attr("data-id");
        const address = utils.hexDecode(tr.attr("data-address"));
        const type = tr.attr("data-type");
        const enabled = tr.find(".status-toggle").is(":checked");
        const comment = tr.find("input[type=text]").val();
        const groups = tr.find(".selectpicker").val()?.map(Number) || [];
  
        var done = "sửa";
        var notDone = "sửa";
        if (elem && elem.startsWith("enabled_")) {
            done = enabled ? "kích hoạt" : "tắt";
            notDone = enabled ? "kích hoạt" : "tắt";
        }
  
        utils.disableAll();
        showAlert("info", "", "Tiến hành sửa cấu hình đối với địa chỉ...", address);
  
        const response = await fetch(`/api/proxy/lists/${encodeURIComponent(address)}?type=${type}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-FTL-SID': sessionID,
                'X-FTL-CSRF': csrfToken
            },
            body: JSON.stringify({
                groups: groups,
                comment: comment,
                enabled: enabled,
                type: type
            })
        });
  
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Phản hồi mạng không ổn');
        }
  
        const data = await response.json();
        utils.enableAll();
        processGroupResult(data, "list", done, notDone);
        table.ajax.reload(null, false);
        updateFtlInfo();
  
    } catch (error) {
        utils.enableAll();
        apiFailure({
            responseText: error.message
        });
    }
}

// Hàm khởi tạo bảng
function initTable() {
    if ($.fn.DataTable.isDataTable("#listsTable")) {
        $("#listsTable").DataTable().destroy();
        $("#listsTable").empty();
    }
  
    table = $("#listsTable").DataTable({
        processing: true,
        serverSide: false,
        fixedHeader: true,
        ordering: true,
        ajax: {
            url: "/api/proxy/lists",
            dataSrc: function(json) {
                return Array.isArray(json.lists) ? json.lists : [];
            },
            type: "GET",
            headers: {
                'X-FTL-SID': sessionID,
                'X-FTL-CSRF': csrfToken
            }
        },
        columns: [
            {
                data: "id",
                visible: false
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                width: "15px",
                className: 'select-checkbox',
                render: function() {
                    return null;
                }
            },
            {
                data: "status",
                searchable: false,
                className: 'details-control text-center',
                render: function(data, type, row) {
                    if (type === 'display') {
                        var statusCode = row.enabled && data !== null ? parseInt(data, 10) : 0;
                        return `<span class="list-status-${statusCode}">${setStatusIcon(row)}</span>`;
                    }
                    return data;
                }
            },
            {
                data: "type",
                searchable: false,
                className: 'details-control text-center',
                render: function(data, type) {
                    if (type === 'display') {
                        return setTypeIcon(data);
                    }
                    return data;
                }
            },
            {
                data: "address",
                render: function(data, type, row) {
                    if (type !== 'display') return data;
                    const dataId = utils.hexEncode(data + "_" + row.type);
                    if (data.startsWith("file://")) {
                        return `<code id="address_${dataId}" class="breakall">${utils.escapeHtml(data)}</code>`;
                    }
                    return `<a id="address_${dataId}" class="breakall" href="${encodeURI(data)}" target="_blank" rel="noopener noreferrer">${utils.escapeHtml(data)}</a>`;
                }
            },
            {
                data: "enabled",
                className: 'text-center',
                width: "100px",
                render: function(data, type) {
                    if (type !== 'display') return data;
                    const checked = data ? 'checked' : '';
                    return `
                        <label class="switch">
                            <input type="checkbox" class="status-toggle" ${checked}>
                            <span class="slider round"></span>
                        </label>`;
                }
            },
            {
                data: "comment",
                render: function(data, type) {
                    if (type !== 'display') return data || '';
                    return `<input type="text" class="form-control input-sm" value="${utils.escapeHtml(data || '')}" placeholder="Thêm comment">`;
                }
            },
            {
                data: "groups",
                render: function(data, type) {
                    if (type !== 'display') return data || [];
                    return '<select class="selectpicker" multiple data-width="100%" data-none-selected-text="Không chọn gì"></select>';
                }
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                width: "30px",
                className: 'text-center',
                render: function(data, type) {
                    if (type === 'display') {
                        return '<button type="button" class="btn btn-danger btn-xs delete-row"><i class="fa fa-trash-o"></i></button>';
                    }
                    return null;
                }
            }
        ],
        select: {
            style: "multi",
            selector: "td.select-checkbox",
            info: false
        },
        buttons: [
            {
                text: '<i class="fa fa-check-square-o toggle-select-icon"></i>',
                titleAttr: "Chọn/Bỏ chọn tất cả",
                className: "btn-sm datatable-bt toggleSelectAll",
                action: function () {
                    const selectedCount = table.rows({ selected: true }).count();
                    const totalRows = table.rows({ search: 'applied' }).count();
                    
                    if (selectedCount < totalRows) {
                        table.rows({ search: 'applied' }).select();
                        $(this).find('i').removeClass('fa-check-square-o').addClass('fa-square-o');
                        $(this).attr('title', 'Bỏ chọn tất cả');
                    } else {
                        table.rows().deselect();
                        $(this).find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
                        $(this).attr('title', 'Chọn tất cả');
                    }
                }
            },
            {
                text: '<i class="fa fa-plus-square-o"></i>',
                titleAttr: "Chọn thêm",
                className: "btn-sm datatable-bt selectMore",
                action: function () {
                    table.rows({ page: "current" }).select();
                }
            },
            {
                text: '<i class="fa fa-trash-o"></i>',
                titleAttr: "Xóa đã chọn",
                className: "btn-sm datatable-bt deleteSelected",
                action: function () {
                    const ids = [];
                    table.rows({ selected: true }).every(function () {
                        const data = this.data();
                        const dataId = utils.hexEncode(data.address) + "_" + data.type;
                        ids.push(dataId);
                    });
                    if (ids.length > 0) {
                        if (confirm(`Bạn có chắc chắn muốn xóa ${ids.length} danh sách đã chọn?`)) {
                            deleteLists(ids);
                        }
                    }
                }
            }
        ],
        dom:
            "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
            "<'row'<'col-sm-12'B>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        pageLength: 10,
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "Tất cả"]
        ],
        language: {
            search: "Tìm kiếm:",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            infoEmpty: "Hiển thị 0 đến 0 của 0 mục",
            infoFiltered: "(lọc từ _MAX_ tổng số mục)",
            zeroRecords: "Không tìm thấy danh sách phù hợp",
            lengthMenu: "Hiển thị _MENU_ mục",
            paginate: {
                previous: "Trước",
                next: "Tiếp"
            }
        },
        createdRow: function(row, data) {
            $(row).attr('data-id', utils.hexEncode(data.address + "_" + data.type));
            $(row).attr('data-address', utils.hexEncode(data.address));
            $(row).attr('data-type', data.type);
        },
        drawCallback: function(settings) {
            const api = new $.fn.dataTable.Api(settings);
            const hasRows = api.rows({ filter: 'applied' }).data().length > 0;
            $('.dt-buttons').css("display", "block");
            $('.datatable-bt').css("display", "inline-block");
  
            api.rows().every(function() {
                const rowData = this.data();
                const $row = $(this.node);
                const $select = $row.find('.selectpicker');
  
                if ($select.length && rowData) {
                    if (groups && Array.isArray(groups)) {
                        groups.forEach(group => {
                            if (group && typeof group.id !== 'undefined' && group.name) {
                                $select.append(new Option(
                                    group.name,
                                    group.id,
                                    false,
                                    Array.isArray(rowData.groups) && rowData.groups.includes(group.id)
                                ));
                            }
                        });
                    }
  
                    $select.selectpicker({
                        style: 'btn-default btn-sm',
                        width: '100%'
                    });
                }
            });
  
            api.rows().nodes().each(function(row) {
                const $row = $(row);
                const dataId = $row.attr('data-id');
  
                $row.find('.status-toggle').off('change').on('change', function() {
                    editList.call(this);
                });
  
                $row.find('input[type="text"]').off('change').on('change', function() {
                    editList.call(this);
                });
  
                $row.find('.delete-row').off('click').on('click', function() {
                    if (confirm(`Bạn có chắc chắn muốn xóa danh sách này?`)) {
                        deleteList.call(this);
                    }
                });
            });
  
            $("body > .bootstrap-select.dropdown").remove();
        }
    });
  
    table.on("init select deselect", function () {
        utils.changeBulkDeleteStates(table);
    });
  
    table.on("order.dt", function () {
        var order = table.order();
        if (order && order.length > 0) {
            if (order[0][0] !== 0 || order[0][1] !== "asc") {
                $("#resetButton").removeClass("hidden");
            } else {
                $("#resetButton").addClass("hidden");
            }
        }
    });
  
    $("#resetButton").on("click", function () {
        table.order([[0, "asc"]]).draw();
        $("#resetButton").addClass("hidden");
    });
  
    $("#listsTable tbody").on("click", "td.details-control", function () {
        var tr = $(this).closest("tr");
        var row = table.row(tr);
  
        if (row.child.isShown()) {
            row.child.hide();
            tr.removeClass("shown");
        } else {
            row.child(format(row.data())).show();
            tr.addClass("shown");
        }
    });
  
    const input = document.querySelector("input[type=search]");
    if (input !== null) {
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("autocapitalize", "off");
        input.setAttribute("spellcheck", false);
    }
}

// Hàm thêm list mới
async function addList() {
    try {
        const sid = await checkSession();
        if (!sid) {
            console.warn("⚠️ Không có SID hợp lệ để thêm list...");
            return;
        }
  
        const action = this.id;
        const type = action === "btnAddBlock" ? "block" : "allow";
        const comment = $("#new_comment").val();
        const group = $("#new_group").val() ? $("#new_group").val().map(Number) : [];
  
        var addresses = $("#new_address").val().split(/[\s,]+/);
        addresses = addresses.filter(function (el) {
            return el !== "";
        });
  
        if (addresses.length === 0) {
            showAlert("warning", "", "Cảnh báo", "Vui lòng chỉ định ít nhất một địa chỉ danh sách");
            return;
        }
  
        utils.disableAll();
        showAlert("info", "", `Đang thêm danh sách ${type}...`, addresses.join(", "));
  
        const apiUrl = `/api/proxy/lists`;
        const payload = {
            address: addresses,
            comment: comment,
            type: type,
            groups: group
        };
  
        console.log("[ADD LIST] API:", apiUrl);
        console.log("[ADD LIST] Payload:", payload);
  
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-FTL-SID': sessionID,
                'X-FTL-CSRF': csrfToken
            },
            body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Phản hồi mạng không ổn');
        }
  
        const data = await response.json();
        utils.enableAll();
        processGroupResult(data, "list", "thêm", "thêm");
        
        $("#new_address").val("");
        $("#new_comment").val("");
        table.ajax.reload(null, false);
        table.rows().deselect();
        updateFtlInfo();
  
    } catch (error) {
        utils.enableAll();
        apiFailure({
            responseText: error.message
        });
    }
}

// Khởi tạo khi trang được tải
document.addEventListener("DOMContentLoaded", async function () {
    try {
        await getDeviceInfo();
        setDeviceInfo(deviceInfo_analysis);
        const sid = await checkSession();
  
        if (!sid) {
            console.warn("⚠️ Không lấy được SID hợp lệ sau khi kiểm tra session, dừng gọi API...");
            return;
        }
  
        initTable();
        getGroups();
  
        $("#btnAddBlock, #btnAddAllow").on("click", addList);
  
    } catch (error) {
        console.error("❌ Lỗi trong quá trình khởi tạo:", error);
    }
});