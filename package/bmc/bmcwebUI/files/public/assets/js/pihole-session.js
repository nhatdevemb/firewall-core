let sessionID = localStorage.getItem("pihole_sid") || null;
let csrfToken = localStorage.getItem("pihole_csrf") || null;
let sessionExpiration = parseInt(localStorage.getItem("pihole_expiration")) || 0;
let deviceInfo_analysis = null;

// Ngưỡng thời gian tối thiểu để giữ SID (giây)
const MINIMUM_VALIDITY_SECONDS = 30;

// Hàm thiết lập thông tin thiết bị
function setDeviceInfo(info) {
  deviceInfo_analysis = info;
  console.log("✅ Đã thiết lập thông tin thiết bị:", deviceInfo_analysis);
}

// 🔹 Kiểm tra SID hợp lệ và thời gian còn lại
async function checkSession() {
  const now = Math.floor(Date.now() / 1000);
  console.log(`🕒 Thời gian hiện tại: ${now}, SID: ${sessionID}, Hết hạn: ${sessionExpiration}`);

  if (sessionID && now < sessionExpiration) {
    const secondsRemaining = sessionExpiration - now;
    console.log(`🔎 SID còn ${secondsRemaining} giây.`);

    if (secondsRemaining > MINIMUM_VALIDITY_SECONDS) {
      console.log("✅ SID còn đủ thời gian, kiểm tra với server...");
      const isValid = await verifySessionOnServer();
      if (isValid) {
        console.log("✅ SID hợp lệ, tiếp tục sử dụng.");
        return sessionID;
      } else {
        console.log("⚠️ SID không hợp lệ, hủy và yêu cầu mới...");
      }
    } else {
      console.log("⚠️ SID sắp hết hạn, hủy và yêu cầu mới...");
    }
    await logoutSession(); // Đảm bảo hủy trước khi tạo mới
  } else {
    console.log("🔄 SID hết hạn hoặc chưa có, yêu cầu mới...");
    await logoutSession(); // Hủy bất kỳ session cũ nào trong localStorage
  }

  return await getSessionID();
}

// 🔹 Kiểm tra SID trên server
function verifySessionOnServer() {
  return new Promise((resolve) => {
    if (!sessionID || !deviceInfo_analysis || !deviceInfo_analysis.device_ip) {
      console.error("❌ Thiếu SID hoặc thông tin thiết bị!");
      resolve(false);
      return;
    }

    console.log("🔄 Kiểm tra SID trên server...");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://${deviceInfo_analysis.device_ip}/api/stats/summary`, true);
    xhr.setRequestHeader("X-FTL-SID", sessionID);
    xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        console.log(`📡 Phản hồi từ server: ${xhr.status}`);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.session && response.session.validity) {
              sessionExpiration = Math.floor(Date.now() / 1000) + response.session.validity;
              localStorage.setItem("pihole_expiration", sessionExpiration);
              console.log(`✅ SID được gia hạn, hết hạn mới: ${sessionExpiration}`);
            }
            resolve(true);
          } catch (e) {
            console.error("❌ Lỗi phân tích phản hồi:", e);
            resolve(false);
          }
        } else {
          console.warn("🔒 SID không hợp lệ, trạng thái:", xhr.status);
          resolve(false);
        }
      }
    };

    xhr.onerror = function () {
      console.error("❌ Lỗi mạng khi kiểm tra SID.");
      resolve(false);
    };

    xhr.send();
  });
}

// 🔹 Hủy session hiện tại với retry nếu thất bại
function logoutSession() {
  return new Promise((resolve, reject) => {
    if (!sessionID || !deviceInfo_analysis || !deviceInfo_analysis.device_ip) {
      console.log("🔒 Không có SID hoặc thông tin thiết bị, đặt lại session.");
      resetSession();
      resolve();
      return;
    }

    let attempt = 0;
    const maxAttempts = 2;

    function attemptLogout() {
      console.log(`🔒 Đang hủy SID (lần ${attempt + 1}): ${sessionID}`);
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", `https://${deviceInfo_analysis.device_ip}/api/auth`, true);
      xhr.setRequestHeader("X-FTL-SID", sessionID);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log(`📡 Phản hồi từ server khi hủy SID: ${xhr.status}`);
          if (xhr.status === 204 || xhr.status === 410) {
            console.log("✅ Đã hủy SID thành công.");
            resetSession();
            resolve();
          } else if (attempt < maxAttempts - 1) {
            console.warn("⚠️ Hủy SID thất bại, thử lại...");
            attempt++;
            attemptLogout();
          } else {
            console.error("❌ Không thể hủy SID sau nhiều lần thử, tiếp tục...");
            resetSession();
            resolve();
          }
        }
      };

      xhr.onerror = function () {
        console.error("❌ Lỗi mạng khi hủy SID.");
        if (attempt < maxAttempts - 1) {
          attempt++;
          attemptLogout();
        } else {
          resetSession();
          resolve();
        }
      };

      xhr.send();
    }

    attemptLogout();
  });
}

// 🔹 Đặt lại session
function resetSession() {
  console.warn("🔄 Đặt lại session trong localStorage...");
  sessionID = null;
  csrfToken = null;
  sessionExpiration = 0;
  localStorage.removeItem("pihole_sid");
  localStorage.removeItem("pihole_csrf");
  localStorage.removeItem("pihole_expiration");
}

// 🔹 Lấy SID mới với xử lý lỗi 429
async function getSessionID() {
  if (!deviceInfo_analysis || !deviceInfo_analysis.device_ip) {
    console.error("❌ Chưa có thông tin thiết bị!");
    throw new Error("No device info available");
  }

  // Đảm bảo hủy session cũ trước khi tạo mới
  await logoutSession();

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ password: "admin123;" });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://${deviceInfo_analysis.device_ip}/api/auth`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        console.log(`📡 Phản hồi từ server khi lấy SID: ${xhr.status}`);
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.session && response.session.sid) {
              sessionID = response.session.sid;
              csrfToken = response.session.csrf;
              sessionExpiration = Math.floor(Date.now() / 1000) + response.session.validity;

              localStorage.setItem("pihole_sid", sessionID);
              localStorage.setItem("pihole_csrf", csrfToken);
              localStorage.setItem("pihole_expiration", sessionExpiration);

              console.log(`✅ Lấy SID thành công: ${sessionID}, hết hạn: ${sessionExpiration}`);
              resolve(sessionID);
            } else {
              console.error("❌ Phản hồi không chứa SID:", xhr.responseText);
              reject(new Error("Invalid response format"));
            }
          } catch (e) {
            console.error("❌ Lỗi phân tích phản hồi:", e);
            reject(new Error("Failed to parse response"));
          }
        } else if (xhr.status === 429) {
          console.warn("⚠️ Đạt giới hạn session (429), thử hủy session và yêu cầu lại...");
          logoutSession().then(() => getSessionID().then(resolve).catch(reject));
        } else if (xhr.status === 401) {
          console.error("❌ Mật khẩu không đúng:", xhr.responseText);
          reject(new Error("Unauthorized: Incorrect password"));
        } else if (xhr.status === 400) {
          console.error("❌ Yêu cầu không hợp lệ:", xhr.responseText);
          reject(new Error("Bad request: Invalid payload"));
        } else {
          console.error("❌ Lỗi không xác định:", xhr.responseText);
          reject(new Error(`Failed to get session ID: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = function () {
      console.error("❌ Lỗi mạng khi lấy SID.");
      reject(new Error("Network error during session ID request"));
    };

    xhr.send(data);
  });
}

// Loại bỏ sự kiện beforeunload vì không đáng tin cậy
// window.addEventListener("beforeunload", async () => {
//   console.log("🔒 Cố gắng hủy SID khi thoát trang...");
//   await logoutSession();
// });

// Xuất các hàm và biến cần thiết
export {
  sessionID,
  csrfToken,
  sessionExpiration,
  setDeviceInfo,
  checkSession,
  getSessionID,
  logoutSession,
};

// // Lưu trữ thông tin phiên trong localStorage để tái sử dụng khi reload
// let sessionID = localStorage.getItem("pihole_sid") || null;
// let csrfToken = localStorage.getItem("pihole_csrf") || null;
// let sessionExpiration = parseInt(localStorage.getItem("pihole_expiration")) || 0;
// let retryCount = 0;

// // Biến global để lưu thông tin thiết bị (cần được thiết lập bởi file chính)
// let deviceInfo_analysis = null;

// // Hàm thiết lập thông tin thiết bị
// function setDeviceInfo(info) {
//   deviceInfo_analysis = info;
//   console.log("✅ Đã thiết lập thông tin thiết bị trong checksession.js:", deviceInfo_analysis);
// }

// // 🔹 Kiểm tra SID hợp lệ và hết hạn
// async function checkSession() {
//   const now = Math.floor(Date.now() / 1000);
//   console.log(`🕒 Thời gian hiện tại: ${now}`);
//   console.log(`🔎 Kiểm tra session... SID: ${sessionID}, Hết hạn: ${sessionExpiration}`);

//   if (sessionID && now < sessionExpiration) {
//     console.log(`✅ SID còn hiệu lực (${sessionExpiration - now} giây còn lại), kiểm tra với server...`);
//     const isValid = await verifySessionOnServer();
//     return isValid ? sessionID : null; // Trả về sessionID nếu hợp lệ, ngược lại trả về null
//   } else {
//     console.log("🔄 SID hết hạn hoặc chưa có, xóa SID cũ và yêu cầu mới...");
//     resetSession();
//     return await getSessionID(); // Trả về sessionID mới
//   }
// }

// // 🔹 Kiểm tra SID trên server
// function verifySessionOnServer() {
//   return new Promise((resolve, reject) => {
//     if (!sessionID) {
//       console.log("🔍 Không có SID, yêu cầu mới...");
//       resolve(getSessionID());
//       return;
//     }
//     if (!deviceInfo_analysis || !deviceInfo_analysis.device_ip) {
//       console.error("❌ Chưa có thông tin thiết bị trong checksession.js!");
//       reject(new Error("No device info available"));
//       return;
//     }

//     console.log("🔄 Kiểm tra SID trên server...");
//     var xhr = new XMLHttpRequest();
//     xhr.open("GET", `https://${deviceInfo_analysis.device_ip}/api/stats/top_domains?blocked=true`, true);
//     xhr.setRequestHeader("X-FTL-SID", sessionID);
//     xhr.setRequestHeader("X-FTL-CSRF", csrfToken);

//     xhr.onreadystatechange = function () {
//       if (xhr.readyState === XMLHttpRequest.DONE) {
//         console.log(`📡 Phản hồi từ server: ${xhr.status}`);
//         if (xhr.status === 200) {
//           console.log("✅ SID hợp lệ, tiếp tục sử dụng.");
//           resolve(true);
//         } else {
//           console.warn("🔒 SID không hợp lệ hoặc đã hết hạn, hủy session...");
//           logoutAllSessions(() => resolve(getSessionID()));
//         }
//       }
//     };

//     xhr.send();
//   });
// }

// // 🔹 Hủy SID trước khi lấy mới để tránh lỗi session limit
// function logoutAllSessions(callback) {
//   if (!sessionID) {
//     console.log("🔒 Không có SID, bỏ qua bước logout.");
//     if (callback) callback();
//     return;
//   }

//   console.log(`🔒 Đang hủy SID hiện tại: ${sessionID}`);

//   var xhr = new XMLHttpRequest();
//   xhr.open("DELETE", `https://${deviceInfo_analysis.device_ip}/api/auth`, true);
//   xhr.setRequestHeader("X-FTL-SID", sessionID);

//   xhr.onreadystatechange = function () {
//     if (xhr.readyState === XMLHttpRequest.DONE) {
//       console.log(`📡 Phản hồi từ server khi hủy SID: ${xhr.status}`);
//       if (xhr.status === 204 || xhr.status === 410) {
//         console.log("✅ Đã hủy SID cũ thành công.");
//       } else {
//         console.warn("⚠️ Không thể hủy phiên hoặc không có phiên nào hoạt động.");
//       }
//       resetSession();
//       if (callback) callback();
//     }
//   };

//   xhr.send(null);
// }

// // 🔹 Đặt lại session khi cần thiết
// function resetSession() {
//   console.warn("🔄 Đang xóa SID cũ khỏi localStorage do hết hạn...");
//   sessionID = null;
//   csrfToken = null;
//   sessionExpiration = 0;
//   localStorage.removeItem("pihole_sid");
//   localStorage.removeItem("pihole_csrf");
//   localStorage.removeItem("pihole_expiration");
// }

// // 🔹 Lấy SID mới từ Pi-hole nếu cần thiết
// function getSessionID() {
//   return new Promise((resolve, reject) => {
//     if (retryCount >= 3) {
//       console.warn("⚠️ Đã thử lấy SID quá nhiều lần, dừng lại để tránh bị chặn.");
//       reject(new Error("Too many retries for session ID"));
//       return;
//     }

//     console.log("🔄 Đang yêu cầu SID mới...");
//     if (!deviceInfo_analysis || !deviceInfo_analysis.device_ip) {
//       console.error("❌ Chưa có thông tin thiết bị trong checksession.js!");
//       reject(new Error("No device info available"));
//       return;
//     }

//     var data = JSON.stringify({ password: "admin123;" });

//     var xhr = new XMLHttpRequest();
//     xhr.open("POST", `https://${deviceInfo_analysis.device_ip}/api/auth`, true);
//     xhr.setRequestHeader("Content-Type", "application/json");

//     xhr.onreadystatechange = function () {
//       if (xhr.readyState === XMLHttpRequest.DONE) {
//         console.log(`📡 Phản hồi từ server khi lấy SID: ${xhr.status}`);
//         if (xhr.status === 200) {
//           var response = JSON.parse(xhr.responseText);
//           sessionID = response.session.sid;
//           csrfToken = response.session.csrf;
//           sessionExpiration = Math.floor(Date.now() / 1000) + response.session.validity;

//           // Lưu vào localStorage để dùng lại khi tải lại trang
//           localStorage.setItem("pihole_sid", sessionID);
//           localStorage.setItem("pihole_csrf", csrfToken);
//           localStorage.setItem("pihole_expiration", sessionExpiration);

//           console.log(`✅ Lấy SID thành công: ${sessionID}`);
//           resolve(sessionID); // Trả về sessionID mới
//         } else {
//           console.error("❌ Lỗi lấy SID:", xhr.responseText);
//           retryCount++;
//           reject(new Error("Failed to get session ID"));
//         }
//       }
//     };

//     xhr.send(data);
//   });
// }

// // 🔹 Hủy SID khi rời trang
// window.addEventListener("beforeunload", function () {
//   console.log("🔒 Hủy SID khi thoát trang...");
//   logoutAllSessions();
// });

// // Xuất các hàm và biến cần thiết để các file khác sử dụng
// export {
//   sessionID,
//   csrfToken,
//   sessionExpiration,
//   setDeviceInfo,
//   checkSession,
//   getSessionID,
//   logoutAllSessions,
// };


