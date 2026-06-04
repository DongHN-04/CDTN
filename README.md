# 🍔 Hệ thống Quản lý và Bán hàng Cửa hàng Đồ ăn nhanh Sơn Đông

<p align="center">
  <img src="images/SONDONG-LOGO.png" alt="Sơn Đông Fastfood Logo" width="200" style="border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.15);"/>
</p>

<p align="center">
  <strong>Giải pháp chuyển đổi số toàn diện cho mô hình F&B (Food & Beverage) đơn lẻ</strong>
  <br />
  <i>Tích hợp POS tại quầy, Đặt món trực tuyến, Thanh toán VNPay và Quản lý kho nguyên liệu theo định lượng công thức món ăn</i>
</p>

---

## 📌 Mục lục
- [🎨 Giới thiệu chung](#-giới-thiệu-chung)
- [✨ Tính năng nổi bật](#-tính-năng-nổi-bật)
- [🛠️ Công nghệ sử dụng](#️-công-nghệ-sử-dụng)
- [💡 Giải pháp nghiệp vụ nổi bật](#-giải-pháp-nghiệp-vụ-nổi-bật)
- [📁 Cấu trúc dự án](#-cấu-trúc-dự-án)
- [⚙️ Cấu hình biến môi trường (.env)](#️-cấu-hình-biến-môi-trường-env)
- [🚀 Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [🧪 Kịch bản kiểm thử (Test Cases)](#-kịch-bản-kiểm-thử-test-cases)
- [📈 Đánh giá & Hướng phát triển tương lai](#-đánh-giá--hướng-phát-triển-tương-lai)

---

## 🎨 Giới thiệu chung

Dự án **Hệ thống Quản lý và Bán hàng Cửa hàng Đồ ăn nhanh Sơn Đông** là giải pháp phần mềm toàn diện (Full-stack Web Application) nhằm số hóa quy trình vận hành của một cửa hàng đồ ăn nhanh. Hệ thống được xây dựng để phục vụ 3 nhóm đối tượng chính:
1. **Khách hàng trực tuyến:** Xem thực đơn, đặt món qua mã QR tại bàn hoặc mang về, áp dụng voucher và thanh toán điện tử.
2. **Nhân viên tại quầy (POS):** Tạo đơn hàng trực tiếp, thanh toán tiền mặt/ngân hàng, quản lý và chốt ca làm việc.
3. **Quản trị viên (Admin):** Quản lý nhân viên, thực đơn, cấu hình nguyên liệu cấu thành món ăn (định lượng kho), nhà cung cấp, công nợ nhập hàng, quản lý khuyến mãi, và theo dõi báo cáo doanh thu trực quan.

---

## ✨ Tính năng nổi bật

### 👤 1. Giao diện Khách hàng (Customer App)
- **Thực đơn trực quan:** Phân chia theo danh mục (Burger, Gà Rán, Pizza, Đồ uống, Khai vị), lọc và tìm kiếm món ăn nhanh chóng.
- **Giỏ hàng linh hoạt:** Hỗ trợ đặt món lẻ, đặt theo combo khuyến mãi, ghi chú yêu cầu thêm cho nhà bếp.
- **Thanh toán trực tuyến:** Tích hợp cổng thanh toán quốc gia **VNPay Sandbox** (Thanh toán qua mã QR hoặc Thẻ ngân hàng nội địa).
- **Trang cá nhân:** Quản lý lịch sử đơn hàng, cập nhật thông tin cá nhân, theo dõi trạng thái đơn hàng thời gian thực.
- **Ưu đãi & Khuyến mãi:** Xem danh sách các chương trình khuyến mãi hiện hành và áp dụng mã giảm giá trực tiếp tại bước thanh toán.

### 💼 2. Giao diện POS & Vận hành của Nhân viên (Staff App)
- **Hệ thống POS tại quầy:** Giao diện bán hàng tối ưu, thao tác click-to-add nhanh, hỗ trợ khách lẻ và thành viên VIP.
- **Quản lý Ca làm việc (Shift Management):**
  - Mở ca trực đầu ngày bằng cách khai báo số tiền mặt ban đầu trong két.
  - POS tự động ghi nhận tổng doanh thu tiền mặt phát sinh trong ca.
  - Đóng và chốt ca trực: Nhân viên tự kiểm đếm và nhập số tiền mặt thực tế. Hệ thống tự động đối soát chênh lệch, tạo báo cáo chốt ca gửi lên Admin phê duyệt.

### 🛡️ 3. Phân hệ Quản trị tối cao (Admin Dashboard)
- **Dashboard trực quan:** Báo cáo doanh số nhanh bằng biểu đồ đường/biểu đồ cột biểu diễn doanh thu, chi phí nhập hàng, và số lượng đơn hàng theo ngày/tháng (Sử dụng thư viện **Recharts**).
- **Quản lý Thực đơn & Combo:** Thêm mới món ăn với mô tả, hình ảnh (tự động tối ưu qua **Cloudinary**), thiết lập giá bán và các gói Combo kết hợp có chiết khấu.
- **Quản lý Định lượng Kho hàng (Recipe Management):**
  - Quản lý danh mục nguyên vật liệu thô (Thịt bò, phô mai, rau cải, bánh mì, dầu ăn,...).
  - Cấu hình công thức chế biến (ví dụ: 1 Burger cần `0.2 kg Thịt bò xay` + `1 lát Phô mai` + `1 Bánh mì`).
  - Hệ thống tự động trừ kho nguyên liệu thô theo tỉ lệ tương ứng ngay khi đơn hàng được thanh toán thành công.
- **Nhập kho & Công nợ Nhà cung cấp:**
  - Quản lý thông tin nhà cung cấp vật tư.
  - Tạo phiếu nhập kho mua nguyên liệu, cập nhật số lượng tồn kho.
  - Quản lý công nợ (ghi nhận nợ cũ, lịch sử trả nợ nhà cung cấp).
- **Quản lý Khuyến mãi:** Tạo mã voucher theo phần trăm (%) hoặc số tiền cố định, giới hạn lượt dùng và thời gian hết hạn.
- **Quản lý Nhân sự & Phân quyền:** Quản lý tài khoản nhân viên, cấp quyền truy cập bảo mật (`Admin` vs `Staff`).
- **Xuất báo cáo Excel:** Hỗ trợ kết xuất các bảng biểu báo cáo doanh thu và tình trạng kho hàng thành file Excel chuẩn (`.xlsx`) phục vụ lưu trữ nội bộ.

---

## 🛠️ Công nghệ sử dụng

Dự án áp dụng mô hình kiến trúc phân tầng chuẩn RESTful API, sử dụng các công nghệ hiện đại và tối ưu nhất:

### ⚙️ Backend (Node.js & Express)
*   **Express.js (v5.2.1):** Xây dựng hệ thống định tuyến (Routing) và các bộ lọc trung gian (Middleware) xử lý request.
*   **Mongoose ODM (v9.5.0):** Ánh xạ cấu trúc dữ liệu MongoDB thành các Models trong mã nguồn JavaScript.
*   **JSON Web Token (JWT) (v9.0.3) & BcryptJS (v3.0.3):** Cơ chế xác thực không trạng thái (stateless authentication) bảo mật cao, mã hóa mật khẩu 1 chiều.
*   **Multer & Cloudinary SDK:** Xử lý và lưu trữ tệp tin hình ảnh sản phẩm/banner trực tiếp lên dịch vụ đám mây đám mây Cloudinary.
*   **VNPay SDK (v2.5.0):** Tích hợp tạo URL thanh toán bảo mật SHA512 và xác minh dữ liệu IPN trả về từ cổng thanh toán.

### 💻 Frontend (React.js SPA)
*   **React (v19.2.5):** Xây dựng giao diện ứng dụng đơn trang (SPA) tương tác mượt mà thông qua Virtual DOM.
*   **React Router DOM (v7.14.2):** Định tuyến trang phía Client linh hoạt kết hợp cơ chế bảo vệ Route Guard (`PrivateRoute`, `RoleBasedRoute`).
*   **Tailwind CSS (v3.4.19):** Framework CSS tiện ích giúp tối ưu hóa thiết kế giao diện tương thích tốt với mọi thiết bị di động và máy tính (Responsive Design).
*   **Recharts (v3.8.1):** Vẽ biểu đồ trực quan hóa dữ liệu thống kê tài chính trực quan.
*   **XLSX (SheetJS) (v0.18.5):** Kết xuất trực tiếp dữ liệu dạng bảng biểu ra file Excel ở phía máy khách.
*   **Lucide React (v1.14.0):** Bộ sưu tập các Icons dạng SVG sắc nét và tải nhanh.

---

## 💡 Giải pháp nghiệp vụ nổi bật

### 1. Quản lý kho thông minh theo định lượng công thức món ăn (Recipe-based Inventory)
Hệ thống giải quyết triệt để bài toán hao hụt nguyên liệu trong F&B. Thay vì chỉ quản lý số lượng thành phẩm (vốn rất khó áp dụng cho đồ ăn chế biến tại chỗ), hệ thống quản lý theo lượng nguyên liệu thô cấu thành món ăn. Mỗi khi đơn hàng hoàn tất, hệ thống tự động tính toán và khấu trừ lượng nguyên liệu thô tương ứng trong kho. Nút thanh toán sẽ tự động bị khóa nếu nguyên liệu trong kho không còn đủ để chế biến món ăn đó.

### 2. Luồng thanh toán VNPay - Khóa giữ chỗ & Tự động hoàn kho (Reservation & Sweep Sweep)
Để giải quyết xung đột khi nhiều người cùng đặt món trực tuyến và thanh toán qua VNPay:
- **Giữ chỗ nguyên liệu tạm thời (Reservation):** Khi khách hàng nhấn thanh toán qua VNPay, hệ thống lập tức trừ kho tạm thời cho đơn hàng đó để "giữ chỗ" nguyên liệu trong khi chờ khách hoàn tất giao dịch tại cổng VNPay.
- **Hoàn trả kho tự động (Auto-release Sweep):** Nếu khách hàng hủy giao dịch tại cổng VNPay hoặc không hoàn tất thanh toán sau **30 phút**, một tiến trình chạy ngầm (cron-job giả lập bằng `setInterval` trên Node.js) sẽ tự động quét và hoàn trả số lượng nguyên liệu đã trừ về kho ban đầu, đồng thời cập nhật đơn hàng thành trạng thái hủy (`cancelled`). Điều này tránh tình trạng giữ kho ảo làm mất cơ hội mua hàng của người khác.

---

## 📁 Cấu trúc dự án

```text
CDTN/
├── backend/                  # Nguồn mã nguồn phía Server (Node.js/Express)
│   ├── src/
│   │   ├── config/           # Cấu hình Database kết nối MongoDB Atlas
│   │   ├── controllers/      # Bộ điều hướng logic xử lý dữ liệu API
│   │   ├── middleware/       # Lọc kiểm tra quyền truy cập JWT, CORS, xử lý lỗi
│   │   ├── models/           # Định nghĩa cấu trúc Schema cơ sở dữ liệu (Mongoose)
│   │   ├── routes/           # Các endpoint định tuyến API
│   │   ├── utils/            # Công cụ bổ trợ (Seeding dữ liệu mẫu, mã hóa)
│   │   └── index.js          # File đầu vào chạy server Node.js
│   ├── package.json
│   └── .env                  # Tệp cấu hình môi trường Backend (Chứa DB, JWT, VNPay, Cloudinary)
│
├── frontend/                 # Nguồn mã nguồn phía Client (React.js)
│   ├── public/               # File static, favicon, index.html
│   ├── src/
│   │   ├── components/       # Các components dùng chung (Layout, Guard Routes, Forms)
│   │   ├── constants/        # Định nghĩa các biến hằng số cấu hình hệ thống
│   │   ├── contexts/         # Quản lý Global State (Auth, Giỏ hàng, Thông báo Toast)
│   │   ├── pages/            # Chứa giao diện các trang (Admin, Staff, Customer, Auth)
│   │   ├── services/         # Chứa các file giao tiếp gọi API Axios lên server
│   │   ├── utils/            # Hàm tiện ích định dạng tiền tệ, xử lý ngày tháng
│   │   ├── App.jsx           # Cấu hình React Router và bọc các Providers
│   │   ├── index.css         # Import Tailwind CSS
│   │   └── index.js          # File đầu vào render ứng dụng React
│   ├── package.json
│   ├── tailwind.config.js    # Cấu hình Tailwind CSS
│   └── .env                  # Tệp cấu hình API Endpoint cho Client
│
├── images/                   # Hình ảnh tài nguyên logo, banner của dự án
└── BaoCao_TrienKhai.md       # Báo cáo chi tiết kỹ thuật triển khai dự án
```

---

## ⚙️ Cấu hình biến môi trường (.env)

Hệ thống yêu cầu các cấu hình môi trường cụ thể ở cả 2 thư mục gốc `backend` và `frontend`:

### 1. File cấu hình Backend (`backend/.env`)
Tạo một tệp `.env` tại thư mục `backend/` và điền đầy đủ các thông tin:

```env
# Môi trường và Cổng chạy máy chủ
NODE_ENV=development
PORT=5000

# Đường dẫn kết nối CSDL MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>

# Khóa bí mật dùng để ký và xác thực JWT Token
JWT_SECRET=your_super_secret_jwt_key_here

# Tài khoản Admin mặc định hệ thống tự sinh khi Seed
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=123456
ADMIN_NAME=Quản trị viên Sơn Đông

# Cấu hình cho phép kết nối từ tên miền Frontend
CORS_ORIGIN=http://localhost:3000

# Cấu hình tích hợp Cổng thanh toán thử nghiệm VNPay Sandbox
VNPAY_TMN_CODE=8WGLJSGP
VNPAY_HASH_SECRET=TVTQRUDMY1AFCSKMQZVKT0TR22ATYUHA
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/payment/return
CLIENT_URL=http://localhost:3000

# Cấu hình lưu trữ hình ảnh trên Cloudinary
CLOUDINARY_CLOUD_NAME=dbnwqek3c
CLOUDINARY_API_KEY=719114658344755
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# Thiết lập quét dọn giao dịch VNPay quá hạn (đơn vị: ms)
PAYMENT_RESERVATION_SWEEP_MS=60000
PAYMENT_RESERVATION_MINUTES=30

# Chạy seed dữ liệu mẫu khi khởi động ứng dụng lần đầu
RUN_SEED_ON_START=true
```

### 2. File cấu hình Frontend (`frontend/.env`)
Tạo một tệp `.env` tại thư mục `frontend/` để trỏ đúng địa chỉ cổng API của Backend:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 📦 Yêu cầu hệ thống
*   **Node.js:** Phiên bản tối thiểu `v18.x` hoặc `v20.x` trở lên (tích hợp kèm `npm`).
*   **MongoDB:** Tài khoản MongoDB Atlas hoặc máy chủ MongoDB Local đang chạy.

### Trình tự các bước cài đặt:

#### Bước 1: Khởi động Backend
1. Mở terminal mới và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi tạo cơ sở dữ liệu ban đầu (Database Seeding) bao gồm: Tài khoản Admin mặc định, dữ liệu mẫu của 31 nguyên vật liệu kho, 15 món ăn mẫu có định lượng cấu thành, 3 combo khuyến mãi lớn:
   ```bash
   npm run seed
   ```
4. Khởi chạy máy chủ Backend trong chế độ phát triển (sử dụng `nodemon` tự động tải lại khi đổi code):
   ```bash
   npm run dev
   ```
   *Khi khởi chạy thành công, màn hình sẽ thông báo: `Server running on port 5000` và `MongoDB Connected`.*

#### Bước 2: Khởi động Frontend
1. Mở một terminal mới song song và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện React:
   ```bash
   npm install
   ```
3. Khởi chạy ứng dụng React (sử dụng `react-scripts` để biên dịch trực tiếp):
   ```bash
   npm start
   ```
4. Trình duyệt sẽ tự động mở trang web tại địa chỉ:
   ```text
   http://localhost:3000
   ```

---

## 🧪 Kịch bản kiểm thử (Test Cases)

Dưới đây là một số kịch bản kiểm thử cốt lõi đã được thực nghiệm và đạt độ ổn định 100% trên hệ thống:

| STT | Chức năng kiểm thử | Các bước thực hiện | Kết quả mong đợi | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Đăng nhập & Quyền truy cập** | 1. Đăng nhập sai tài khoản.<br>2. Đăng nhập đúng tài khoản Admin/Staff.<br>3. Truy cập link admin trực tiếp khi chưa đăng nhập. | - Báo lỗi tài khoản không hợp lệ rõ ràng.<br>- Chuyển hướng đúng vai trò quản lý phù hợp.<br>- Route Guard chặn truy cập trái phép và trả về trang đăng nhập. | **Đạt** |
| **2** | **Quản lý Giỏ hàng & Tồn kho** | Thêm món ăn và tăng số lượng vượt mức giới hạn nguyên liệu thô hiện có trong kho hàng. | Nút thanh toán bị khóa đồng thời hiển thị cảnh báo nguyên liệu thô trong kho không đủ phục vụ món ăn. | **Đạt** |
| **3** | **Thanh toán trực tuyến VNPay** | Thực hiện đặt hàng trực tuyến chọn cổng VNPay và thanh toán thẻ test thành công trên cổng Sandbox VNPay. | Hệ thống trừ kho tạm thời giữ chỗ. Trả kết quả VNPay IPN hợp lệ, đơn hàng đổi thành `confirmed` và thanh toán thành `paid`. | **Đạt** |
| **4** | **Quét dọn hoàn trả kho** | Không thanh toán hóa đơn VNPay và để quá 30 phút hoặc click "Hủy thanh toán" tại cổng VNPay Sandbox. | VNPay chuyển hướng về trang lỗi, đơn hàng đổi trạng thái thành `cancelled`. Hệ thống kích hoạt hoàn trả nguyên liệu thô đã giữ lại vào kho. | **Đạt** |
| **5** | **Bán hàng POS tại quầy** | Nhân viên POS lên đơn trực tiếp, chọn áp mã giảm giá và hoàn tất đơn thanh toán bằng Tiền mặt. | Tính chính xác tiền thừa hoàn lại cho khách, tự động in hóa đơn hoàn thành, cập nhật trừ kho nguyên liệu thô tức thì. | **Đạt** |
| **6** | **Chốt ca làm việc** | Nhân viên POS thực hiện Mở ca đầu ngày, bán hàng và Thực hiện Chốt ca chênh lệch tiền cuối ngày. | Ghi nhận chính xác số tiền hệ thống và số tiền két thực tế, báo cáo chênh lệch tiền mặt gửi lên Admin duyệt ca. | **Đạt** |
| **7** | **Báo cáo doanh số & Excel** | Admin xem biểu đồ tài chính trực quan và click "Xuất báo cáo Excel". | Hệ thống hiển thị biểu đồ tương tác Recharts chuẩn và tải về file `.xlsx` định dạng bảng biểu báo cáo hoàn chỉnh. | **Đạt** |

---

## 📈 Đánh giá & Hướng phát triển tương lai

### Ưu điểm
- Cơ chế quản lý kho theo định lượng món ăn cực kỳ thông minh giúp hạn chế tối đa thất thoát tài chính.
- Giao diện thiết kế theo phong cách hiện đại với Tailwind CSS, tối ưu hóa kích thước màn hình hiển thị (Responsive).
- Cơ chế thanh toán VNPay xử lý tranh chấp giữ chỗ và hoàn trả kho chạy ngầm an toàn tuyệt đối.
- Có tính năng kiểm toán ca làm việc thực tế cho nhân viên tại quầy.

### Điểm hạn chế hiện tại
- Việc tương tác trạng thái đơn hàng giữa các phân hệ (Bếp, POS, Khách hàng) hiện còn dựa trên kéo tải lại trang (Polling) chứ chưa có luồng thời gian thực.
- Máy POS bán hàng chưa hỗ trợ chế độ ngoại tuyến (Offline Mode) khi cửa hàng bị mất kết nối Internet đột ngột.

### Hướng phát triển tương lai
1. **Tích hợp WebSockets (Socket.io):** Đồng bộ hóa trạng thái đơn hàng tự động thời gian thực giữa Khách hàng -> POS -> Màn hình nhà bếp (KDS).
2. **Hỗ trợ POS Offline:** Sử dụng IndexedDB và Service Worker để lưu dữ liệu đơn hàng ngoại tuyến trên trình duyệt và tự động đẩy đồng bộ khi có mạng trở lại.
3. **Mở rộng chuỗi chi nhánh:** Thêm cơ chế quản trị đa chi nhánh (`branchId`), luân chuyển kho chéo giữa các cửa hàng.
4. **Tích hợp Dự báo AI:** Áp dụng Machine Learning dự báo sản lượng món ăn tiêu thụ theo ngày/tuần để tự động lập kế hoạch nhập kho tối ưu nhất.
