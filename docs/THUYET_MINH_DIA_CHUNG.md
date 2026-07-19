# ĐỊA CHỨNG

## Hệ thống giám sát và kiểm chứng thông tin pháp lý trên mạng xã hội

> **Phát hiện sớm — đối chiếu đúng nguồn — hỗ trợ xử lý có căn cứ.**

---

## 1. Tóm tắt giải pháp

**Địa Chứng** là hệ thống hỗ trợ cán bộ theo dõi, sàng lọc và kiểm chứng các thông tin pháp lý đang lan truyền trên mạng xã hội. Sản phẩm kết hợp thu thập dữ liệu công khai, mô hình ngôn ngữ, bộ luật nghiệp vụ và Knowledge Graph để chuyển nội dung mạng xã hội thành các hồ sơ có cấu trúc, có mức ưu tiên và có căn cứ để con người tiếp tục xem xét.

Trong phiên bản hiện tại, hệ thống tập trung vào hai bài toán liên quan:

1. Phát hiện nội dung về sắp xếp đơn vị hành chính và các thay đổi pháp lý được người dân quan tâm.
2. Kiểm tra các phát biểu về hành vi, chủ thể và mức xử phạt theo quy định mới, đặc biệt là sự chuyển tiếp từ Nghị định 15/2020/NĐ-CP sang Nghị định 174/2026/NĐ-CP.

Chuỗi xử lý chính của Địa Chứng:

> Nội dung công khai → làm sạch và lọc chủ đề → trích xuất claim → đối chiếu Knowledge Graph và dữ kiện tham chiếu → tìm nguồn xác nhận hoặc bác bỏ → xếp mức ưu tiên → đưa vào hàng đợi để cán bộ xem xét.

Địa Chứng không tự động kết luận một cá nhân hoặc tổ chức đã vi phạm pháp luật. Kết quả do hệ thống tạo ra là thông tin hỗ trợ nghiệp vụ; quyết định cuối cùng thuộc về người có thẩm quyền.

---

## 2. Vấn đề cần giải quyết

Khi một chính sách mới được ban hành, thông tin trên mạng xã hội thường lan truyền nhanh hơn khả năng kiểm tra thủ công. Một nội dung có thể:

- Trích đúng quy định nhưng áp dụng sai cho cá nhân hoặc tổ chức.
- Dùng mức phạt của văn bản đã hết hiệu lực.
- Bỏ qua điều kiện, ngoại lệ hoặc thời điểm áp dụng.
- Trộn lẫn thông tin đúng và sai trong cùng một bài đăng.
- Dẫn lại tin chưa có nguồn chính thức.
- Kêu gọi chia sẻ hoặc hành động ngay khi chưa được kiểm chứng.

Đối với chủ đề sắp xếp đơn vị hành chính, các câu hỏi còn liên quan đến tên địa phương mới, cơ quan tiếp nhận hồ sơ, giá trị giấy tờ cũ và quy định chuyển tiếp. Việc tìm kiếm thủ công trong nhiều văn bản và nguồn công khai tốn thời gian, khó bảo đảm tính nhất quán và dễ bỏ sót thay đổi về hiệu lực.

Địa Chứng được xây dựng để giảm ba khoảng trống:

- **Khoảng trống phát hiện:** khó nhận biết sớm nội dung nào cần ưu tiên.
- **Khoảng trống căn cứ:** mất thời gian tìm đúng điều khoản và nguồn chính thức.
- **Khoảng trống quy trình:** kết quả tìm kiếm, lý do phân loại và trạng thái xử lý chưa được tập trung trong một hồ sơ thống nhất.

---

## 3. Người dùng mục tiêu

### Người dùng chính

- Cán bộ truyền thông chính sách.
- Cán bộ phổ biến, giáo dục pháp luật.
- Bộ phận theo dõi và xử lý thông tin trên môi trường mạng.
- Chuyên viên pháp chế hoặc chuyên viên tham mưu.

### Người dùng mở rộng

- Cơ quan báo chí cần kiểm tra nhanh căn cứ pháp lý.
- Tổ chức nghiên cứu dư luận và chính sách công.
- Doanh nghiệp cung cấp dịch vụ social listening hoặc compliance.

Sản phẩm hiện được thiết kế như một công cụ nghiệp vụ nội bộ, không phải cổng tố cáo và không phải hệ thống tự động xử phạt.

---

## 4. Phạm vi phiên bản hiện tại

### 4.1. Chức năng đã triển khai

- Thu thập bài đăng và bình luận Facebook công khai thông qua dịch vụ crawler được cấu hình.
- Làm sạch nội dung và lọc mức độ liên quan đến chủ đề đơn vị hành chính.
- Trích xuất claim, từ khóa và chủ thể bằng mô hình ngôn ngữ hoặc cơ chế dự phòng.
- Chuẩn hóa tiếng Việt và một số cách viết tắt, tiếng lóng thường gặp trên mạng xã hội.
- Đối chiếu claim với Knowledge Graph pháp lý dạng JSON.
- So sánh với các dữ kiện tham chiếu về sắp xếp đơn vị hành chính.
- Phân biệt chủ thể cá nhân và tổ chức khi đối chiếu mức phạt.
- Nhận biết một số trường hợp sử dụng quy định cũ của Nghị định 15/2020/NĐ-CP sau thời điểm Nghị định 174/2026/NĐ-CP có hiệu lực.
- Tìm kiếm nguồn trên web, phân tầng độ tin cậy của nguồn và ghi nhận trạng thái xác nhận hoặc bác bỏ.
- Xếp hạng hồ sơ theo mức ưu tiên, độ lan truyền và tín hiệu kêu gọi hành động.
- Hiển thị dashboard tổng quan, hàng đợi giám sát, hồ sơ chi tiết, báo cáo, nguồn chính thức và tầng kiểm chứng.
- Nhận nội dung thủ công để tạo hồ sơ kiểm chứng.
- Cung cấp API cho hàng đợi, hồ sơ, kiểm chứng, hỏi–đáp và kích hoạt quá trình thu thập.

### 4.2. Dữ liệu hiện có trong repo

Phiên bản hiện tại sử dụng:

- 43 node và 25 quan hệ trong Knowledge Graph.
- 4 dữ kiện tham chiếu trọng tâm.
- 17 mục trong kho dữ kiện.
- 45 bình luận mẫu phục vụ chạy thử.
- 3 tình huống nghiên cứu.
- Các trích đoạn pháp lý của Nghị định 15/2020/NĐ-CP và Nghị định 174/2026/NĐ-CP.
- Dữ liệu crawl công khai được lưu dưới dạng JSON Lines khi chạy pipeline.

Các con số trên mô tả dữ liệu đang có trong sản phẩm, không phải quy mô triển khai chính thức.

### 4.3. Nội dung chưa tuyên bố hoàn thiện

- Chưa bao phủ toàn bộ văn bản về sắp xếp đơn vị hành chính.
- Chưa có cơ sở để tuyên bố hệ thống theo dõi đầy đủ Facebook, TikTok hoặc mọi nền tảng mạng xã hội.
- Chưa triển khai Neo4j, PostgreSQL hoặc pgvector trong phiên bản hiện tại.
- Chưa có quy trình phê duyệt nhiều vai trò và audit log bất biến ở mức sản phẩm vận hành chính thức.
- Chưa có benchmark độc lập đủ lớn để công bố các chỉ số F1 hoặc accuracy như kết quả đạt được.
- Chưa tự động tạo quyết định xử phạt hay kết luận vi phạm.

---

## 5. Quy trình hoạt động

### Bước 1 — Thu thập và làm sạch

Crawler nhận từ khóa, tìm URL phù hợp và thu thập nội dung công khai. Dữ liệu được làm sạch để loại bỏ thành phần giao diện, bản ghi quá ngắn hoặc nội dung không có giá trị phân tích.

### Bước 2 — Lọc chủ đề

Bộ lọc kiểm tra nhóm từ khóa liên quan đến đơn vị hành chính, sáp nhập, địa danh và các chủ đề pháp lý đã cấu hình. Nội dung không đủ mức liên quan bị loại khỏi pipeline.

### Bước 3 — Trích xuất claim

Hệ thống chuyển nội dung tự do thành:

- Claim có thể đối chiếu.
- Từ khóa phục vụ truy xuất.
- Chủ thể được đề cập, nếu có thể xác định.

Khi nhà cung cấp mô hình không khả dụng, hệ thống có cơ chế phân tích dự phòng để dashboard vẫn hoạt động với dữ liệu thử nghiệm.

### Bước 4 — Đối chiếu bộ luật và Knowledge Graph

Claim được chuẩn hóa rồi so khớp với các hành vi, điều khoản và mức phạt đã nạp. Bộ luật nghiệp vụ kiểm tra:

- Claim có khớp hành vi nào trong phạm vi dữ liệu không.
- Chủ thể là cá nhân hay tổ chức.
- Mức tiền được nêu có thuộc đúng khung không.
- Nội dung có đang sử dụng quy định cũ không.
- Claim có thiếu chủ thể hoặc chứa điều kiện chưa rõ không.

### Bước 5 — Đối chiếu dữ kiện và nguồn bên ngoài

Hệ thống so sánh claim với kho dữ kiện tham chiếu bằng cơ chế tìm kiếm văn bản và BM25. Khi được cấu hình, lớp tìm kiếm nguồn tiếp tục truy xuất web và phân loại:

- **Tier 0:** nguồn cơ quan nhà nước, tên miền chính thức.
- **Tier 1:** cơ quan báo chí và thông tấn có độ tin cậy cao.
- **Tier 2:** các nguồn báo chí hoặc nguồn công khai còn lại.

Kết quả nguồn được ghi nhận độc lập với nhãn phân loại của engine, giúp người dùng biết claim đã có nguồn xác nhận, có nguồn bác bỏ hay chưa tìm thấy căn cứ đủ mạnh.

### Bước 6 — Xếp mức ưu tiên

Hệ thống kết hợp mức độ lan truyền, kết quả phân loại, tín hiệu nguồn và lời kêu gọi hành động như “chia sẻ gấp”, “cảnh báo” hoặc “báo cáo ngay” để đưa hồ sơ quan trọng lên trước.

### Bước 7 — Con người xem xét

Cán bộ mở hồ sơ để xem:

- Nội dung gốc và claim đã trích xuất.
- Nhãn đề xuất và lý do.
- Văn bản, điều khoản và mức phạt tham chiếu.
- Nguồn xác nhận hoặc bác bỏ.
- Mức ưu tiên và trạng thái xử lý.

Người dùng có thể chuyển trạng thái hồ sơ giữa “Mới”, “Đang xử lý” và “Đã xử lý”. Việc xác minh pháp lý cuối cùng vẫn phải do con người thực hiện.

---

## 6. Cách phân loại trong phiên bản hiện tại

Địa Chứng sử dụng ba nhãn nghiệp vụ:

1. **Đúng:** claim phù hợp với hành vi, chủ thể và khung quy định đã nạp.
2. **Hiểu lầm:** claim có căn cứ liên quan nhưng áp dụng sai chủ thể, sai mức, nhầm khoản hoặc dùng quy định đã hết hiệu lực.
3. **Cần kiểm chứng:** dữ liệu chưa đủ, không khớp phạm vi đã nạp, thiếu chủ thể hoặc cần cán bộ đối chiếu thêm.

Ba nhãn này được lựa chọn để phản ánh đúng năng lực của MVP. “Hiểu lầm” không đồng nghĩa với cố ý đưa tin sai; “Cần kiểm chứng” không đồng nghĩa với nội dung sai.

Song song với đó, lớp xác thực nguồn sử dụng ba trạng thái:

- Có nguồn xác nhận.
- Có bác bỏ chính thức.
- Chưa tìm thấy nguồn.

Việc tách hai lớp giúp hệ thống không đánh đồng kết quả so khớp luật với mức độ xác thực của tin tức ngoài thực tế.

---

## 7. Kiến trúc công nghệ

### Frontend

- Next.js, React và TypeScript.
- Dashboard đáp ứng trên nhiều kích thước màn hình.
- Kết nối backend qua HTTP API.
- Có dữ liệu mẫu dự phòng khi backend chưa khả dụng.

### Backend

- FastAPI và Python.
- Các API chính: hàng đợi, hồ sơ, tầng kiểm chứng, hỏi–đáp và crawler.
- Pipeline tách riêng các bước trích xuất, phân loại, kiểm tra nguồn và guardrail.

### Engine

- Hàm luật xác định hành vi, chủ thể và khung tiền.
- Chuẩn hóa tiếng Việt và ngôn ngữ mạng xã hội.
- BM25 để so khớp dữ kiện tham chiếu.
- Knowledge Graph được lưu dưới dạng node và edge trong JSON.

### Dữ liệu

- Dữ kiện pháp lý và dữ liệu mẫu ở định dạng JSON.
- Kết quả crawl và hàng đợi ở định dạng JSON Lines.
- Cấu trúc hiện tại phù hợp cho MVP, dễ kiểm tra và dễ tái lập.

### Tích hợp ngoài

- Nhà cung cấp LLM có thể thay đổi theo cấu hình.
- Tìm kiếm nguồn có thể sử dụng mô hình hỗ trợ web grounding.
- Crawler Facebook sử dụng dịch vụ bên ngoài và chỉ hoạt động khi có khóa API hợp lệ.

---

## 8. Các màn hình sản phẩm

### Tổng quan thị trường thông tin

Hiển thị chỉ số rủi ro, số hồ sơ khẩn cấp, chủ đề nổi bật, phân bố nền tảng và diễn biến theo thời gian để người dùng xác định khu vực cần chú ý.

### Hàng đợi giám sát

Cho phép tìm kiếm, lọc theo nhãn và trạng thái, sắp xếp theo ưu tiên và mở hồ sơ chi tiết.

### Hồ sơ kiểm chứng

Tập trung claim, nội dung gốc, lý do phân loại, căn cứ pháp lý, nguồn công khai, mức độ lan truyền và trạng thái xử lý trong cùng một giao diện.

### Báo cáo tổng hợp

Tổng hợp số lượng hồ sơ, mức ưu tiên, nhãn phân loại và tiến độ xử lý.

### Nguồn chính thức và Knowledge Graph

Trình bày các văn bản, quan hệ thay thế và nguồn được hệ thống sử dụng khi đối chiếu.

### Tầng kiểm chứng

Hiển thị các tình huống nghiên cứu để so sánh điều khoản cũ–mới và kết quả hệ thống kỳ vọng.

### Nhập nội dung thủ công

Cho phép cán bộ đưa một nội dung vào hệ thống khi cần kiểm tra ngay mà không chờ crawler.

---

## 9. Điểm nổi bật

### Phân biệt luật cũ và luật mới

Engine không chỉ tìm từ khóa giống nhau mà còn nhận biết một số trường hợp claim đang dùng khung của Nghị định 15/2020/NĐ-CP trong bối cảnh Nghị định 174/2026/NĐ-CP đã có hiệu lực.

### Phân biệt cá nhân và tổ chức

Mức phạt có thể khác nhau theo chủ thể. Hệ thống kiểm tra việc gán khung của tổ chức cho cá nhân hoặc ngược lại, thay vì chỉ trả về một điều khoản chung.

### Hai lớp kết quả độc lập

Nhãn pháp lý từ engine và trạng thái xác thực nguồn được lưu riêng. Cách thiết kế này giúp giải thích rõ “hệ thống đang đối chiếu điều gì” và “nguồn bên ngoài đang xác nhận điều gì”.

### Ưu tiên theo khả năng gây tác động

Nội dung có độ lan truyền cao, có nguồn bác bỏ chính thức hoặc có lời kêu gọi hành động được đẩy lên trước để cán bộ xem xét.

### Có cơ chế dự phòng

Frontend vẫn có thể trình diễn bằng dữ liệu mẫu khi API chưa kết nối; pipeline cũng có đường xử lý dự phòng khi LLM chưa được cấu hình. Điều này giúp sản phẩm dễ kiểm thử và demo.

---

## 10. An toàn và giới hạn sử dụng

- Chỉ xử lý nội dung công khai trong phạm vi mục đích đã xác định.
- Không truy cập tin nhắn riêng tư hoặc nhóm kín.
- Không coi nội dung mạng xã hội là chỉ dẫn cho hệ thống.
- Có bước kiểm tra prompt injection và dữ liệu nhạy cảm trong pipeline.
- Không cho mô hình tự quyết định việc xử phạt.
- Không dùng nhãn “Hiểu lầm” để suy luận động cơ của người đăng.
- Không xem kết quả MVP là tư vấn pháp lý chính thức.
- Mọi kết luận có tác động đến cá nhân hoặc tổ chức phải được cán bộ có thẩm quyền kiểm tra lại từ văn bản gốc.

Trong bản thử nghiệm, một số dữ liệu tài khoản và liên kết nguồn có thể được giữ để phục vụ kiểm thử kỹ thuật. Khi triển khai thực tế cần bổ sung chính sách ẩn danh, phân quyền, thời hạn lưu trữ và nhật ký truy cập.

---

## 11. Phương pháp đánh giá

Phiên bản hiện tại có kiểm thử tự động cho:

- Mô hình dữ liệu và tính hợp lệ của Knowledge Graph.
- Chuẩn hóa tiếng Việt và tiếng lóng.
- So khớp hành vi.
- Nhận diện chủ thể.
- Phân biệt mức phạt cá nhân và tổ chức.
- Phát hiện tham chiếu quy định cũ.
- Xếp mức ưu tiên.
- Phân tầng nguồn.
- Làm sạch và lọc dữ liệu crawler.
- Hợp đồng API và tích hợp frontend–backend.

Các kiểm thử này chứng minh tính đúng đắn của các trường hợp đã mô hình hóa, nhưng chưa thay thế benchmark trên dữ liệu thực tế quy mô lớn.

### Chỉ số đề xuất cho giai đoạn tiếp theo

- Độ chính xác trích xuất claim.
- Độ chính xác nhận diện chủ thể.
- Tỷ lệ truy xuất đúng điều khoản trong Top-3.
- Độ chính xác của trích dẫn.
- Macro-F1 cho ba nhãn nghiệp vụ.
- Tỷ lệ cảnh báo sai.
- Thời gian trung bình từ lúc nhận nội dung đến khi tạo hồ sơ.
- Tỷ lệ kết quả được chuyên viên chấp nhận mà không phải sửa.
- Mức giảm thời gian tìm kiếm căn cứ so với quy trình thủ công.

Các chỉ số chỉ nên được công bố là kết quả sau khi có tập dữ liệu gắn nhãn độc lập và quy trình đánh giá tái lập.

---

## 12. Kịch bản demo

### Tình huống

Một bài đăng viết:

> “Fanpage đăng tin sai chỉ bị phạt 10–20 triệu theo quy định hiện hành.”

### Luồng xử lý

1. Crawler hoặc người dùng đưa nội dung vào hệ thống.
2. Pipeline trích xuất claim, từ khóa và nhận diện chủ thể là tổ chức/fanpage.
3. Engine so khớp hành vi với Knowledge Graph.
4. Bộ luật nhận biết mức 10–20 triệu là khung cũ được tham chiếu từ Nghị định 15/2020/NĐ-CP.
5. Hệ thống đối chiếu khung hiện tại trong dữ liệu Nghị định 174/2026/NĐ-CP.
6. Claim được đề xuất nhãn “Hiểu lầm”, kèm lý do và điều khoản tham chiếu.
7. Lớp tìm kiếm nguồn ghi nhận có hay chưa có nguồn chính thức liên quan.
8. Hồ sơ được xếp ưu tiên và đưa vào hàng đợi.
9. Cán bộ mở hồ sơ, kiểm tra văn bản gốc và quyết định trạng thái xử lý.

Kịch bản thể hiện năng lực cốt lõi của phiên bản hiện tại: không chỉ tìm văn bản có từ khóa giống claim mà còn kiểm tra chủ thể, khung tiền và thời điểm áp dụng.

---

## 13. Giá trị mang lại

### Đối với cơ quan quản lý

- Tập trung nội dung cần kiểm tra vào một hàng đợi thống nhất.
- Phát hiện sớm claim có khả năng lan rộng.
- Giảm thời gian rà soát ban đầu.
- Chuẩn hóa lý do phân loại giữa các hồ sơ.
- Phân biệt rõ dữ kiện pháp lý và tín hiệu từ nguồn công khai.
- Hỗ trợ theo dõi trạng thái xử lý.

### Đối với cán bộ nghiệp vụ

- Có điểm bắt đầu rõ ràng thay vì đọc toàn bộ bài đăng.
- Xem claim, điều khoản, nguồn và mức ưu tiên trong cùng một màn hình.
- Nhận cảnh báo khi claim có dấu hiệu dùng quy định cũ hoặc gán sai chủ thể.
- Giữ quyền kiểm tra và quyết định cuối cùng.

### Đối với người dân

Giá trị gián tiếp là phản hồi chính sách có thể được chuẩn bị nhanh hơn, rõ nguồn hơn và hạn chế việc yêu cầu người dân thực hiện thủ tục hoặc nghĩa vụ không cần thiết.

---

## 14. Lộ trình phát triển

### Giai đoạn 1 — Hoàn thiện MVP hiện tại

- Đồng bộ nội dung giao diện với phạm vi pháp lý đã nạp.
- Hoàn thiện lưu trạng thái và lịch sử chỉnh sửa ở backend.
- Chuẩn hóa cách ẩn danh tài khoản.
- Mở rộng bộ test và loại bỏ dữ liệu minh họa ngoài phạm vi chính.

### Giai đoạn 2 — Mở rộng chuyên đề sắp xếp đơn vị hành chính

- Nạp đầy đủ các nghị quyết, nghị định và hướng dẫn trọng tâm.
- Xây dựng ánh xạ địa phương trước–sau sắp xếp.
- Bổ sung thuộc tính ngày hiệu lực và phạm vi địa phương.
- Tách claim đa mệnh đề.
- Kiểm tra các câu hỏi về giấy tờ, địa chỉ và nơi nộp thủ tục.
- Xây dựng benchmark được hai người gắn nhãn độc lập.

### Giai đoạn 3 — Thử nghiệm nghiệp vụ

- Phân quyền người phân tích, người duyệt và quản trị.
- Lưu audit log cho mọi lần thay đổi kết quả.
- Thử nghiệm với một đơn vị truyền thông chính sách hoặc phổ biến pháp luật.
- Đánh giá thời gian tiết kiệm và tỷ lệ kết quả được chấp nhận.

### Giai đoạn 4 — Mở rộng hạ tầng

Khi dữ liệu và lưu lượng đủ lớn, có thể chuyển kho nghiệp vụ sang PostgreSQL, bổ sung vector search và triển khai graph database chuyên dụng. Đây là hướng mở rộng, không phải thành phần đã có của MVP.

---

## 15. Thông điệp kết luận

Địa Chứng không thay con người quyết định ai đúng, ai sai và không tự động xử phạt nội dung trên mạng xã hội.

Sản phẩm giải quyết một công việc cụ thể:

> Khi một thông tin pháp lý bắt đầu lan truyền, Địa Chứng giúp cán bộ nhanh chóng biến nội dung đó thành claim có cấu trúc, đối chiếu với dữ kiện và điều khoản đã nạp, kiểm tra nguồn công khai, xác định mức ưu tiên và tạo một hồ sơ rõ ràng để con người ra quyết định.

**Địa Chứng là lớp hỗ trợ kiểm chứng và ưu tiên thông tin — không phải công cụ giám sát hay phán quyết tự động.**

---

## Tên và thông điệp đề xuất

### Tên sản phẩm

**Địa Chứng — Hệ thống giám sát và kiểm chứng thông tin pháp lý**

### Slogan chính

> **Phát hiện sớm — đối chiếu đúng nguồn — hỗ trợ xử lý có căn cứ.**

### Thông điệp phụ

> **Biến nội dung lan truyền thành hồ sơ kiểm chứng có thể xem xét.**
