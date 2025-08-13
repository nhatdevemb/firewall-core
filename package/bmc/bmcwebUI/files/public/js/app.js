document.addEventListener('DOMContentLoaded', () => {
  const manageRulesLink = document.getElementById('manage-rules');
  const rulesSubmenu = document.getElementById('rules-submenu');

  manageRulesLink.addEventListener('click', (event) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của liên kết
    if (rulesSubmenu.style.display === 'block') {
      rulesSubmenu.style.display = 'none';
      manageRulesLink.classList.remove('active');
    } else {
      rulesSubmenu.style.display = 'block';
      manageRulesLink.classList.add('active');
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const links = document.querySelectorAll('.sidebar nav a');
  const contentArea = document.getElementById('content-area');

  // Hàm nạp nội dung động
  function loadPage(pageUrl) {
    fetch(pageUrl)
      .then(response => response.text())
      .then(data => {
        contentArea.innerHTML = data;
      })
      .catch(error => {
        console.error('Error loading page:', error);
        contentArea.innerHTML = '<p>Sorry, an error occurred while loading the page.</p>';
      });
  }

  // Bắt sự kiện nhấn vào các liên kết trên sidebar
  links.forEach(link => {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      const pageUrl = link.getAttribute('data-page');
      loadPage(pageUrl);
    });
  });

  // Tải trang mặc định khi trang được mở
  loadPage('dashboard.html');
});


function filterRules() {
  const keyword = document.getElementById('search').value.toLowerCase();
  const rows = document.querySelectorAll('#rules-table-body tr');
  rows.forEach(row => {
    const ruleName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
    if (ruleName.includes(keyword)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}
