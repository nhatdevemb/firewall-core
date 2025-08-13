// Setup biểu đồ trống ban đầu
const ctx = document.getElementById("clientActivityChart").getContext("2d");

let clientActivityChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: [],
    datasets: []
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: { unit: "hour", tooltipFormat: "HH:mm" },
        stacked: true
      },
      y: {
        beginAtZero: true,
        stacked: true
      }
    },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          }
        }
      }
    }
  }
});

// Gọi API /api/history/clients theo cách của bạn
function fetchClientActivity() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://192.168.2.55/api/history/clients", true);
  xhr.setRequestHeader("X-FTL-SID", sessionID);
  xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      console.log(`📡 Phản hồi khi lấy dữ liệu client activity: ${xhr.status}`);

      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log("📊 Dữ liệu client activity:", data);

        if (!data || !data.history || !data.clients) {
          console.warn("❌ Dữ liệu thiếu.");
          return;
        }

        // Chuẩn bị datasets
        const clients = data.clients;
        const history = data.history;

        const clientIndexMap = {};
        const labels = [];
        const datasets = [];

        const colors = [
          "#f44336", "#2196f3", "#4caf50", "#ff9800", "#9c27b0",
          "#00bcd4", "#8bc34a", "#ff5722", "#3f51b5", "#607d8b"
        ];

        let index = 0;
        for (const ip in clients) {
          const label = clients[ip].name || ip;
          clientIndexMap[ip] = index;
          datasets.push({
            label: label,
            data: [],
            backgroundColor: colors[index % colors.length]
          });
          index++;
        }

        // Thêm dữ liệu từng timestamp
        history.forEach(item => {
          const timestamp = new Date(item.timestamp * 1000);
          labels.push(timestamp);

          for (const ip in clientIndexMap) {
            const count = item.data[ip] || 0;
            datasets[clientIndexMap[ip]].data.push(count);
          }
        });

        // Cập nhật dữ liệu vào biểu đồ
        clientActivityChart.data.labels = labels;
        clientActivityChart.data.datasets = datasets;
        clientActivityChart.update();

      } else {
        console.error("❌ Lỗi khi gọi API:", xhr.responseText);
      }
    }
  };

  xhr.send();
}

// Gọi hàm lúc load
fetchClientActivity();
