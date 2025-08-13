/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

import { sessionID, csrfToken, showAlert } from "./web-filtering.js";

var groups = [];

function populateGroupSelect(selectEl) {
  if (selectEl.length === 0) {
    // No select element found, return
    return;
  }

  // Clear all options
  selectEl.empty();

  // Add default option
  selectEl.append($("<option />").val(0).text("Default"));

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

  // Refresh selectpicker
  selectEl.selectpicker("refresh");
}

function getGroups(groupSelector) {
  $.ajax({
    url: "/api/proxy/groups",
    type: "GET",
    headers: {
      'X-FTL-SID': sessionID,
      'X-FTL-CSRF': csrfToken
    },
    dataType: "json",
    success: function (data) {
      groups = data.groups;

      // Get all <select> elements with the class "selectpicker"
      var groupSelector = $(".selectpicker");
      // Populate each selector with the groups
      for (var i = 0; i < groupSelector.length; i++) {
        populateGroupSelect($(groupSelector[i]));
      }

      // Actually load table contents
      initTable();
    },
    error: function (data) {
      console.error("Error loading groups:", data);
      showAlert("error", "", "Error loading groups", data.responseText || "Unknown error");
    },
  });
}

function processGroupResult(data, type, done, notDone) {
  // Process successful operations
  if (data.processed && data.processed.success) {
    data.processed.success.forEach(function (item) {
      showAlert("success", "fas fa-pencil-alt", `Successfully ${done} ${type}`, item);
    });
  }
  
  // Process errors
  if (data.processed && data.processed.errors) {
    data.processed.errors.forEach(function (error) {
      console.error(error);
      showAlert("error", "", `Error while ${notDone} ${type} ${error.item}`, error.error);
    });
  }
}

function delGroupItems(type, ids, table, listType = undefined) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  const url = "/api/proxy/" + type + "s:batchDelete";

  let idstring = ids.map(id => id.item).join(", ");

  // Append "s" to type if more than one item is deleted
  type += ids.length > 1 ? "s" : "";

  // Prepend listType to type if it is not undefined
  if (listType !== undefined) {
    type = listType + " " + type;
  }

  showAlert("info", "", "Deleting " + ids.length + " " + type + "...", idstring);

  $.ajax({
    url: url,
    data: JSON.stringify(ids),
    contentType: "application/json",
    headers: {
      'X-FTL-SID': sessionID,
      'X-FTL-CSRF': csrfToken
    },
    method: "POST",
  })
    .done(function () {
      showAlert("success", "far fa-trash-alt", "Successfully deleted " + type, idstring);
      table.ajax.reload(null, false);

      // Clear selection after deletion
      table.rows().deselect();
      
      // Update states
      const hasSelected = table.rows({ selected: true }).count() > 0;
      $(".deleteSelected").prop("disabled", !hasSelected);
    })
    .fail(function (data, exception) {
      showAlert("error", "", "Error while deleting " + type, data.responseText);
      console.error(exception);
    });
}

// Initialize Bootstrap tooltips
function initTooltips() {
  $('[data-toggle="tooltip"]').tooltip({
    container: 'body',
    animation: false,
    trigger: 'hover'
  });
}

// Handle group enable/disable toggle
function toggleGroup(groupId, enabled) {
  return $.ajax({
    url: `/api/proxy/groups/${groupId}`,
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      'X-FTL-SID': sessionID,
      'X-FTL-CSRF': csrfToken
    },
    data: JSON.stringify({ enabled: enabled })
  });
}

export { 
  groups, 
  populateGroupSelect, 
  getGroups, 
  processGroupResult, 
  delGroupItems,
  initTooltips,
  toggleGroup 
};