

// Không cần import DataTable từ frappe-datatable nữa

const el = document.getElementById("app");

const { columns, data } = getSampleData(); // Đảm bảo getSampleData vẫn hoạt động

// Tạo mới DataTable
window.datatable = new DataTable(el, {
  columns,
  data,
  checkboxColumn: true,
  inlineFilters: true
  // layout: "fluid"
});
