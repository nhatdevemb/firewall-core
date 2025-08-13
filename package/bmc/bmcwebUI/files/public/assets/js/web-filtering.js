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
        
        buttons.css("display", "inline-block"); // Luôn hiển thị các nút
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
  
  // Thêm vào sau phần khai báo biến global
  let GETDict = new URLSearchParams(window.location.search);
  
  // Thêm hàm apiFailure
  function apiFailure(data) {
    let text = data.responseText;
    if (data.responseJSON && data.responseJSON.error) {
        text = data.responseJSON.error;
    }
    showAlert("error", "", "API Error", text);
    console.error("API Error:", data);
  }
  
  // Thêm hàm updateFtlInfo
  async function updateFtlInfo() {
    try {
        const response = await fetch('/api/proxy/stats');
        const data = await response.json();
        $("#domains-count").text(data.domains_being_blocked.toLocaleString());
    } catch (error) {
        console.error("Failed to update FTL info:", error);
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
  
    // Add all known groups
    for (var i = 0; i < groups.length; i++) {
        var dataSub = "";
        if (!groups[i].enabled) {
            dataSub = 'data-subtext="(disabled)"';
        }
  
        selectEl.append(
            $("<option " + dataSub + "/>")
                .val(groups[i].id)
                .text(groups[i].name)
        );
    }
  
    // Initialize selectpicker
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
            throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        console.log("📊 Dữ liệu Groups:", data);
        groups = data.groups || [];
  
        // Get all <select> elements with the class "selectpicker"
        const groupSelectors = $(".selectpicker");
        // Populate each selector with the groups
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
    // Xử lý các thao tác thành công
    if (data.processed && data.processed.success) {
        data.processed.success.forEach(function (item) {
            // showAlert("success", "fas fa-pencil-alt", `Đã ${done} ${type} thành công`);
            showAlert("success", "fas fa-pencil-alt", `Đã ${done} thành công`);
        });
    }
  
    // Xử lý các lỗi
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
  
        // Tạo chuỗi hiển thị các items sẽ xóa, giải mã domain để hiển thị cho người dùng
        let idstring = ids.map(id => utils.hexDecode(id.item)).join(", ");
  
        // Thêm "s" vào type nếu xóa nhiều hơn 1 item
        type += ids.length > 1 ? "s" : "";
  
        // Thêm listType vào type nếu có
        if (listType !== undefined) {
            type = listType + " " + type;
        }
  
        // Hiển thị thông báo đang xóa
        showAlert("info", "", `Đang xóa ${ids.length} ${type}...`, idstring);
  
        // Gửi 1 request batch delete
        const response = await fetch(`/api/proxy/domains:batchDelete`, {
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
            throw new Error(errorText || 'Network response was not ok');
        }
  
        showAlert("success", "far fa-trash-alt", `Đã xóa ${type} thành công`, idstring);
        
        // Refresh table
        table.ajax.reload(null, false);
        
        // Clear selection
        table.rows().deselect();
        
        // Update states
        const hasSelected = table.rows({ selected: true }).count() > 0;
        $(".deleteSelected").prop("disabled", !hasSelected);
  
        // Update sidebar info
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
  
    // Auto hide after 5 seconds
    setTimeout(function() {
        alert.alert('close');
    }, 5000);
  }
  
  // Hàm xóa domains
  function deleteDomains(encodedIds) {
    const decodedIds = encodedIds.map(id => {
        const parts = typeof id === 'string' ? id.split("_") : [id.item, id.type, id.kind];
        return {
            item: decodeURIComponent(parts[0]), // GIẢI MÃ HEX về plain text
            type: parts[1],
            kind: parts[2]
        };
    });
  
    delGroupItems("domain", decodedIds, table);
  }
  
  // Hàm xóa domain
  async function deleteDomain() {
    const dataId = $(this).closest("tr").attr("data-id");
    if (!dataId) return;
  
    const decodedId = {
        item: decodeURIComponent(dataId.split("_")[0]), // GIẢI MÃ HEX về plain text
        type: dataId.split("_")[1],
        kind: dataId.split("_")[2]
    };
  
    try {
        await delGroupItems("domain", [decodedId], table);
    } catch (error) {
        console.error("❌ Lỗi trong quá trình xóa domain:", error);
        apiFailure({
            responseText: error.message
        });
    }
  }
  
  // Hàm hiển thị gợi ý domain
  function showSuggestDomains(value) {
    function createButton(hostname) {
        return $('<button type="button" class="btn-link btn-block text-right">')
            .append($("<i>").text(hostname))
            .on("click", function () {
                hideSuggestDomains();
                $("#new_domain").val(hostname);
            });
    }
  
    const suggestDomainEl = $("#suggest_domains");
  
    try {
        const parts = new URL(value).hostname.split(".");
        const table = $("<table>");
  
        for (let i = 0; i < parts.length - 1; ++i) {
            const hostname = parts.slice(i).join(".");
  
            table.append(
                $("<tr>")
                    .append($('<td class="text-nowrap text-right">').text(i === 0 ? "Did you mean" : "or"))
                    .append($("<td>").append(createButton(hostname)))
            );
        }
  
        suggestDomainEl.slideUp("fast", function () {
            suggestDomainEl.html(table);
            suggestDomainEl.slideDown("fast");
        });
    } catch {
        hideSuggestDomains();
    }
  }
  
  // Hàm ẩn gợi ý domain
  function hideSuggestDomains() {
    $("#suggest_domains").slideUp("fast");
  }
  
  // Hàm chỉnh sửa domain
  async function editDomain() {
    try {
        const sid = await checkSession();
        if (!sid) {
            console.warn("⚠️ Không có SID hợp lệ để sửa domain...");
            return;
        }
  
        const elem = $(this).attr("id");
        const tr = $(this).closest("tr");
        const domain = tr.attr("data-id");
        const newTypestr = tr.find("select:not(.selectpicker)").val();
        const enabled = tr.find(".status-toggle").is(":checked"); // Sử dụng checkbox
        const comment = tr.find("input[type=text]").val();
        const groups = tr.find(".selectpicker").val()?.map(Number) || [];
  
        const [encodedDomain, oldType, oldKind] = domain.split("_");
        const domainDecoded = utils.hexDecode(encodedDomain);
  
        // var done = "edited";
        var done = "sửa";
        var notDone = "editing";
        if (elem && elem.startsWith("enabled_")) {
            done = enabled ? "enabled" : "disabled";
            notDone = enabled ? "enabling" : "disabling";
        }
  
        utils.disableAll();
        showAlert("info", "", "Tiến hành sửa cấu hình đối với domain...", domainDecoded);
  
        const response = await fetch(`/api/proxy/domains/${newTypestr}/${encodeURIComponent(domainDecoded)}`, {
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
                type: oldType,
                kind: oldKind
            })
        });
  
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Network response was not ok');
        }
  
        const data = await response.json();
        utils.enableAll();
        processGroupResult(data, "domain", done, notDone);
        table.ajax.reload(null, false);
  
        // Update sidebar info
        updateFtlInfo();
  
    } catch (error) {
        utils.enableAll();
        apiFailure({
            responseText: error.message
        });
    }
  }
  
  function initTable() {
    if ($.fn.DataTable.isDataTable("#domainsTable")) {
        $("#domainsTable").DataTable().destroy();
        $("#domainsTable").empty();
    }
  
    table = $("#domainsTable").DataTable({
        processing: true,
        serverSide: false,
        fixedHeader: true,
        ordering: true, // Bật sắp xếp
        ajax: {
            url: "/api/proxy/domains",
            dataSrc: function(json) {
                return Array.isArray(json.domains) ? json.domains : [];
            },
            type: "GET",
            headers: {
                'X-FTL-SID': sessionID,
                'X-FTL-CSRF': csrfToken
            }
        },
        columns: [
            {
                // Checkbox column
                data: null,
                orderable: false,
                searchable: false,
                width: "15px",
                className: 'select-checkbox',
                render: function(data, type) {
                    return null; // Không render thêm checkbox, để DataTables Select tự thêm
                }
            },
            { 
                // Domain/RegEx column
                data: "domain",
                className: 'text-left',
                render: function(data, type, row) {
                    if (type === 'display') {
                        const style = row.type === 'deny' ? 'color: #f00;' : '';
                        return `<span style="${style}">${utils.escapeHtml(data)}</span>`;
                    }
                    return data;
                }
            },
            { 
                // Type column
                data: null,
                className: 'type-column',
                render: function(data, type) {
                    if (type !== 'display') return `${data.type}/${data.kind}`;
                    
                    const options = [
                        { value: 'allow/exact', text: 'Cho phép (Exact)' },
                        { value: 'allow/regex', text: 'Cho phép (Regex)' },
                        { value: 'deny/exact', text: 'Chặn (Exact)' },
                        { value: 'deny/regex', text: 'Chặn (Regex)' }                        
                    ];
                    const currentValue = `${data.type}/${data.kind}`;
                    
                    return `<select class="form-control input-sm">
                        ${options.map(opt => `
                            <option value="${opt.value}" ${currentValue === opt.value ? 'selected' : ''}>
                                ${opt.text}
                            </option>
                        `).join('')}
                    </select>`;
                }
            },
            {
                // Status column
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
                // Comment column
                data: "comment",
                render: function(data, type) {
                    if (type !== 'display') return data || '';
                    return `<input type="text" class="form-control input-sm" value="${utils.escapeHtml(data || '')}" placeholder="Thêm comment">`;
                }
            },
            {
                // Group assignment column
                data: "groups",
                render: function(data, type) {
                    if (type !== 'display') return data || [];
                    return '<select class="selectpicker" multiple data-width="100%" data-none-selected-text="Nothing selected"></select>';
                }
            },
            {
                // Delete column
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
                titleAttr: "Toggle Select All",
                className: "btn-sm datatable-bt toggleSelectAll",
                action: function () {
                    const selectedCount = table.rows({ selected: true }).count();
                    const totalRows = table.rows({ search: 'applied' }).count();
                    
                    if (selectedCount < totalRows) {
                        // Nếu chưa chọn hết, thì chọn tất cả
                        table.rows({ search: 'applied' }).select();
                        $(this).find('i').removeClass('fa-check-square-o').addClass('fa-square-o');
                        $(this).attr('title', 'Deselect All');
                    } else {
                        // Nếu đã chọn hết, thì bỏ chọn tất cả
                        table.rows().deselect();
                        $(this).find('i').removeClass('fa-square-o').addClass('fa-check-square-o');
                        $(this).attr('title', 'Select All');
                    }
                }
            },
            {
                text: '<i class="fa fa-plus-square-o"></i>',
                titleAttr: "Select More",
                className: "btn-sm datatable-bt selectMore",
                action: function () {
                    table.rows({ page: "current" }).select();
                }
            },
            {
                text: '<i class="fa fa-trash-o"></i>',
                titleAttr: "Delete Selected",
                className: "btn-sm datatable-bt deleteSelected",
                action: function () {
                    const ids = [];
                    table.rows({ selected: true }).every(function () {
                        const data = this.data();
                        const dataId = utils.hexEncode(data.domain) + "_" + data.type + "_" + data.kind;
                        ids.push(dataId);
                    });
                    if (ids.length > 0) {
                        if (confirm(`Are you sure you want to delete ${ids.length} selected domain(s)?`)) {
                            deleteDomains(ids);
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
            [10, 25, 50, 100, "All"]
        ],
        language: {
            search: "Tìm kiếm:",
            info: "Hiển thị _START_ đến _END_ của _TOTAL_ mục",
            infoEmpty: "Showing 0 to 0 of 0 entries",
            infoFiltered: "(filtered from _MAX_ total entries)",
            zeroRecords: "Không tìm thấy tên miền phù hợp",
            lengthMenu: "Hiển thị _MENU_ mục",
            paginate: {
                previous: "Trước",
                next: "Tiếp"
            }
        },
        createdRow: function(row, data) {
            $(row).attr('data-id', utils.hexEncode(data.domain) + "_" + data.type + "_" + data.kind);
        },
        drawCallback: function(settings) {
            const api = new $.fn.dataTable.Api(settings);
            
            // Update filter visibility
            const hasRows = api.rows({ filter: 'applied' }).data().length > 0;
            $('.filter_types').toggle(hasRows);
            $('.dt-buttons').css("display", "block"); // Đảm bảo khối chứa các nút hiển thị
            $('.datatable-bt').css("display", "inline-block"); // Đảm bảo các nút hiển thị
  
            // Initialize selectpicker for all rows
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
  
            // Bind events for select, status toggle, comment input, and delete button
            api.rows().nodes().each(function(row) {
                const $row = $(row);
                const dataId = $row.attr('data-id');
  
                $row.find('select:not(.selectpicker)').off('change').on('change', function() {
                    editDomain.call(this);
                });
  
                $row.find('.status-toggle').off('change').on('change', function() {
                    editDomain.call(this);
                });
  
                $row.find('input[type="text"]').off('change').on('change', function() {
                    editDomain.call(this);
                });
  
                // Gắn sự kiện cho nút Delete trên từng hàng
                $row.find('.delete-row').off('click').on('click', function() {
                    if (confirm(`Are you sure you want to delete this domain?`)) {
                        deleteDomain.call(this);
                    }
                });
            });
  
            // Remove any leftover dropdowns
            $("body > .bootstrap-select.dropdown").remove();
        }
    });
  
    // Filter logic based on checkbox selection
    $.fn.dataTable.ext.search.push(function (settings, searchData, index, rowData) {
        const types = $(".filter_types input:checkbox:checked")
            .map(function () {
                return this.value;
            })
            .get();
  
        const typeStr = rowData.type + "/" + rowData.kind;
        return types.includes(typeStr);
    });
  
    $(".filter_types input:checkbox").on("change", function () {
        table.draw();
    });
  
    // Add order event handler
    table.on("order.dt", function () {
        var order = table.order();
        if (order && order.length > 0) {
            if (order[0][0] !== 0 || order[0][1] !== "asc") {
                $("#resetButton").removeClass("hidden");
            } else {
                $("#reset Cavendish").addClass("hidden");
            }
        }
    });
  
    // Add reset button handler
    $("#resetButton").on("click", function () {
        table.order([[0, "asc"]]).draw();
        $("#resetButton").addClass("hidden");
    });
  
    // Update delete button state on selection
    table.on("init select deselect", function () {
        utils.changeBulkDeleteStates(table);
    });
  
    // Disable autocorrect in search box
    const input = document.querySelector("input[type=search]");
    if (input !== null) {
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("autocapitalize", "off");
        input.setAttribute("spellcheck", false);
    }
  }
  
  // Hàm thêm domain mới
  async function addDomain() {
    try {
        const sid = await checkSession();
        if (!sid) {
            console.warn("⚠️ Không có SID hợp lệ để thêm domain...");
            return;
        }
  
        const action = this.id;
        const tabHref = $('a[data-toggle="tab"][aria-expanded="true"]').attr("href");
        const wildcardEl = $("#wildcard_checkbox");
        const wildcardChecked = wildcardEl.prop("checked");
  
        // current tab's inputs
        var kind, domainEl, commentEl, groupEl;
        if (tabHref === "#tab_domain") {
            kind = "exact";
            domainEl = $("#new_domain");
            commentEl = $("#new_domain_comment");
            groupEl = $("#new_domain_group");
        } else if (tabHref === "#tab_regex") {
            kind = "regex";
            domainEl = $("#new_regex");
            commentEl = $("#new_regex_comment");
            groupEl = $("#new_regex_group");
        }
  
        const comment = commentEl.val();
        const group = groupEl.val() ? groupEl.val().map(Number) : [];
  
        var domains = domainEl.val().split(/\s+/);
        domains = domains.filter(function (el) {
            return el !== "";
        });
  
        if (domains.length === 0) {
            showAlert("warning", "", "Warning", "Please specify at least one domain");
            return;
        }
  
        utils.disableAll();
        showAlert("info", "", "Adding domain(s)...", domains.join(", "));
  
        if (kind === "exact" && wildcardChecked) {
            for (var i = 0; i < domains.length; i++) {
                if (domains[i].startsWith("*.")) domains[i] = domains[i].substr(2);
                domains[i] = "(\\.|^)" + domains[i].replaceAll(".", "\\.") + "$";
            }
            kind = "regex";
        }
  
        const type = action === "add_deny" ? "deny" : "allow";
        const apiUrl = `/api/proxy/domains/${type}/${kind}`;
        const payload = {
            domain: domains,
            comment: comment,
            type: type,
            kind: kind,
            groups: group
        };
        // Thêm log chi tiết
        console.log("[ADD DOMAIN] API:", apiUrl);
        console.log("[ADD DOMAIN] Payload:", payload);
  
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
            throw new Error(errorText || 'Network response was not ok');
        }
  
        const data = await response.json();
        utils.enableAll();
        processGroupResult(data, "domain", "added", "adding");
        
        // Clear inputs
        domainEl.val("");
        commentEl.val("");
        
        // Refresh table
        table.ajax.reload(null, false);
        table.rows().deselect();
  
        // Update sidebar info
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
        // Lấy thông tin thiết bị trước
        await getDeviceInfo();
  
        // Thiết lập thông tin thiết bị cho checksession.js
        setDeviceInfo(deviceInfo_analysis);
  
        // Kiểm tra session và lấy SID
        const sid = await checkSession();
  
        // Đảm bảo có SID hợp lệ trước khi gọi các API
        if (!sid) {
            console.warn("⚠️ Không lấy được SID hợp lệ sau khi kiểm tra session, dừng gọi API...");
            return;
        }
  
        // Khởi tạo bảng và lấy danh sách groups
        initTable();
        getGroups();
  
        // Thêm xử lý sự kiện cho nút add_deny và add_allow
        $("#add_deny, #add_allow").on("click", addDomain);
  
        // Xử lý gợi ý domain
        var suggestTimeout;
        $("#new_domain").on("input", function (e) {
            hideSuggestDomains();
            clearTimeout(suggestTimeout);
            suggestTimeout = setTimeout(showSuggestDomains, 1000, e.target.value);
        });
  
        // Xử lý chuyển tab
        $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
            var tabHref = $(this).attr("href");
            var val;
            if (tabHref === "#tab_domain") {
                val = $("#new_regex_comment").val();
                $("#new_domain_comment").val(val);
                $("#new_regex").val("");
            } else if (tabHref === "#tab_regex") {
                val = $("#new_domain_comment").val();
                $("#new_regex_comment").val(val);
                $("#new_domain").val("");
                $("#wildcard_checkbox").prop("checked", false);
            }
  
            clearTimeout(suggestTimeout);
            $("#suggest_domains").hide();
        });
  
    } catch (error) {
        console.error("❌ Lỗi trong quá trình khởi tạo:", error);
    }
  });