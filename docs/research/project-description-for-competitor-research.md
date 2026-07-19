# Mô tả dự án Địa Chứng phục vụ nghiên cứu đối thủ

> Bản khảo sát ngày 19/07/2026. Tài liệu được tổng hợp từ mã nguồn, dữ liệu, test,
> README, product brief và các plan trong repo. Những nội dung chỉ xuất hiện trong
> kế hoạch được tách khỏi khả năng đã có trong code. Danh sách đối thủ là tập ứng
> viên cần nghiên cứu tiếp, không phải khẳng định các sản phẩm có chức năng giống
> hệt hoặc đang trực tiếp tranh chấp cùng một hợp đồng.

## 1. Tóm tắt dự án (Executive Summary)

Địa Chứng, trước đây còn được gọi là Legal-KG Dashboard hoặc Legal Radar trong một số phần
giao diện, là nguyên mẫu hackathon của một hệ thống hỗ trợ giám sát thông tin mạng
xã hội cho cơ quan quản lý nhà nước tại Việt Nam. Phạm vi MVP hiện hành tập trung
vào tin đồn về sáp nhập đơn vị hành chính. Sản phẩm thu thập hoặc tiếp nhận nội
dung công khai, dùng mô hình ngôn ngữ để trích xuất phát ngôn chính, sau đó đối
chiếu phát ngôn với Knowledge Graph pháp luật, dữ liệu sự thật tham chiếu và nguồn
tin được phân tầng theo thẩm quyền.

Đầu ra không phải là quyết định xử phạt. Hệ thống tạo hồ sơ có nhãn `Đúng`,
`Hiểu lầm` hoặc `Cần kiểm chứng`, kèm lý do, điều khoản, chủ thể, mức phạt tham
chiếu, nguồn và các điểm ưu tiên. Chuyên viên xem hồ sơ trong dashboard và quyết
định trạng thái xử lý cuối cùng. Nghị định 174/2026/NĐ-CP, một căn cứ trung tâm
của MVP, đã được xác nhận trên [Cổng Văn bản Chính phủ](https://vanban.chinhphu.vn/?classid=1&docid=218185&pageid=27160):
ban hành ngày 15/05/2026 và có hiệu lực từ 01/07/2026.

Sản phẩm kết hợp ba nhóm năng lực vốn thường tách rời: social monitoring, kiểm
chứng nguồn tin và tra cứu căn cứ pháp lý. Tuy nhiên, đây vẫn là MVP: chưa có mô
hình kinh doanh, benchmark độc lập về precision/recall/F1, xác thực người dùng,
RBAC, audit log, SLA hoặc bằng chứng triển khai với khách hàng thật.

## 2. Vấn đề mà dự án giải quyết

Các tài liệu dự án mô tả một quy trình hiện tại có nhiều thao tác thủ công: chuyên
viên phải tìm nội dung đáng chú ý, đọc toàn văn, xác định claim, tìm nguồn xác
nhận hoặc bác bỏ, tra văn bản đang có hiệu lực, phân biệt mức phạt của cá nhân và
tổ chức, rồi lập hồ sơ để xử lý. Thông tin nằm trên nhiều nguồn rời rạc nên việc
đối chiếu có thể chậm và có nguy cơ viện dẫn nhầm văn bản hoặc khung phạt.

Trong phạm vi MVP, ba nhóm nội dung được ưu tiên là:

- tin về số lượng và mô hình đơn vị hành chính;
- tin đồn tiếp tục sáp nhập hoặc giảm số tỉnh, xã;
- nội dung giả mạo văn bản, con dấu hoặc thông báo của cơ quan nhà nước.

Repo chưa có nghiên cứu người dùng hoặc số liệu thực địa chứng minh số giờ tiết
kiệm, khối lượng bài cần rà soát mỗi ngày hay tỷ lệ sai của quy trình thủ công.
Vì vậy pain point trên nên được xem là giả thuyết sản phẩm đã được mô tả rõ nhưng
chưa được định lượng.

## 3. Khách hàng mục tiêu

Nhóm người dùng trực tiếp được product brief nêu là cán bộ theo dõi thông tin sai
lệch tại cơ quan quản lý nhà nước, cụ thể có nhắc Sở TT&TT và Cục PTTH&TTĐT.
Tên và cơ cấu tổ chức hiện hành của các đơn vị này cần được xác nhận lại trước
khi xây kế hoạch bán hàng hoặc pilot.

Người sử dụng trong giao diện gồm:

- chuyên viên theo dõi, sàng lọc và cập nhật trạng thái hồ sơ;
- người rà soát căn cứ pháp luật và nguồn kiểm chứng;
- lãnh đạo hoặc điều phối viên xem KPI, xu hướng và hồ sơ ưu tiên.

Người dân và doanh nghiệp chỉ được mô tả là bên hưởng lợi gián tiếp. Repo không
định vị Địa Chứng là một dịch vụ fact-checking công khai cho người dân.

## 4. Giá trị cốt lõi (Value Proposition)

Giá trị cốt lõi được đề xuất là biến quy trình “tìm từng nguồn rồi tự ghép bằng
chứng” thành một hàng đợi hồ sơ đã được cấu trúc trước. Mỗi hồ sơ liên kết nội
dung gốc với claim, căn cứ pháp lý, trạng thái hiệu lực, chủ thể, mức phạt tham
chiếu và nguồn tin. Hai lớp đánh giá được tách riêng: lớp pháp lý xem claim có
khớp dữ liệu luật hay không, còn lớp nguồn tin xem đã có nguồn xác nhận hoặc bác
bỏ hay chưa.

Điểm quan trọng của định vị là human-in-the-loop: AI hỗ trợ sàng lọc và giải
thích, không tự xác định một cá nhân đã vi phạm và không tự đưa ra quyết định
gỡ nội dung hay xử phạt.

## 5. Các tính năng chính

| Nhóm | Khả năng hiện có hoặc thể hiện trong code | Lưu ý trạng thái |
|---|---|---|
| Thu thập | Crawler Facebook qua Bright Data; connector YouTube API và RSS/news; crawl theo yêu cầu với phản hồi dạng stream | Product brief vẫn xác định Facebook là phạm vi MVP chính; phạm vi production chưa được chốt |
| Tiền xử lý | Làm sạch UI garbage, chuẩn hóa văn bản tiếng Việt, lọc nội dung liên quan ĐVHC | Bộ lọc mang tính domain-specific |
| Trích xuất AI | Tách claim, từ khóa và loại chủ thể; có chuỗi provider TokenRouter, Gemini, Groq, OpenRouter | Khi LLM lỗi, pipeline trả `Cần kiểm chứng` thay vì đoán |
| Legal engine | BM25/keyword matching, rule engine, Knowledge Graph JSON, kiểm tra văn bản cũ và mức phạt theo chủ thể; FactRef là kho dữ liệu tham chiếu riêng | Phạm vi tri thức hiện tập trung NĐ 174 và ĐVHC; không có vector database |
| Kiểm chứng nguồn | Bright Data Discover, whitelist domain, phân Tier 0/1/2 và fusion rules | Route crawl streaming hiện gọi pipeline với `skip_source_search=True`; mã fallback Gemini/Google Search chưa được nối vào luồng tìm kiếm chính |
| Hàng đợi | Lưu JSONL, ưu tiên theo rủi ro/reach, lọc nhãn và trạng thái, polling API | Chưa có database giao dịch hoặc cơ chế xử lý xung đột |
| Dashboard | KPI, xu hướng, heatmap chủ đề × nền tảng, hàng đợi, báo cáo tổng hợp | Phần lớn chỉ số được tính phía frontend từ queue |
| Hồ sơ | Nội dung gốc, bình luận, nhãn/lý do, nguồn, điều khoản, chủ thể, mức phạt, trạng thái | Có đổi trạng thái; override nhãn và ghi chú cán bộ mới chủ yếu nằm trong plan |
| Knowledge Graph UI | Hiển thị chuỗi Claim → Chủ thể → Điều luật → Nguồn | Là projection từ một hồ sơ, chưa phải giao diện truy vấn graph database |
| Nhập thủ công | Gọi API cho nội dung đơn; hỗ trợ CSV/JSON/TXT ở frontend | Import file hiện tạo hồ sơ cục bộ trong `sessionStorage`, chưa ingest hàng loạt vào backend |
| Kiểm thử nghiệp vụ | 45 fixture comments, 14 eval cases, 3 study cases và dữ liệu FactRef | Chưa có benchmark độc lập hoặc tập test đại diện cho vận hành thực tế |

## 6. Quy trình hoạt động của sản phẩm

1. Người dùng bấm quét hoặc nhập nội dung thủ công.
2. Connector thu thập bài viết/bình luận công khai; cleaner và relevance filter
   loại dữ liệu nhiễu.
3. LLM tách claim, từ khóa và chủ thể được nhắc đến.
4. Legal engine chuẩn hóa tiếng Việt, match claim với Knowledge Graph và áp dụng
   rule về điều khoản, hiệu lực văn bản, chủ thể và mức phạt.
5. Lớp kiểm chứng tìm nguồn trên các domain cho phép, phân tầng nguồn và áp dụng
   quy tắc hợp nhất.
6. Pipeline kiểm tra enum nhãn và prompt injection; trường hợp thiếu căn cứ được
   giữ ở trạng thái trung tính. Repo có helper ẩn một số dạng PII nhưng luồng
   production hiện chưa gọi helper này.
7. Pipeline tạo `QueueItem`, tính điểm rủi ro lan truyền, điểm bằng chứng và mức
   ưu tiên, rồi ghi vào `runs/queue.jsonl`.
8. Frontend lấy queue qua FastAPI, hiển thị tổng quan và hồ sơ; chuyên viên đổi
   trạng thái `Mới` → `Đang xử lý` → `Đã xử lý`.

## 7. Mô hình kinh doanh

Chưa có mô hình kinh doanh được xác định trong repo. Không có dữ liệu về bên trả
tiền, giá, license, subscription, doanh thu, chi phí triển khai, quy trình mua sắm
công, SLA, support, kênh bán hàng hoặc đối tác. Có thể phân loại thị trường là
B2G/GovTech theo nhóm người dùng mục tiêu, nhưng không nên biến phân loại này
thành giả định rằng sản phẩm đã có mô hình B2G SaaS.

## 8. Công nghệ hoặc AI được sử dụng

- Backend: Python 3.11+, FastAPI, Pydantic, Requests và JSON/JSONL.
- Frontend: Next.js 16 chạy qua vinext/Vite 8, React 19, TypeScript, Tailwind,
  TanStack Query, Recharts, React Flow và Papa Parse.
- AI extraction: TokenRouter là lựa chọn ưu tiên nếu có cấu hình; Gemini, Groq
  và OpenRouter là các provider thay thế.
- Retrieval và reasoning: Knowledge Graph dạng JSON, FactRef, BM25, rule engine
  và dữ liệu văn bản pháp luật.
- Source retrieval: Bright Data Discover/Scraper; repo có mã Gemini/Google Search
  grounding dự phòng nhưng chưa tích hợp vào `search_brightdata()`.
- Crawl: Facebook qua Bright Data; code còn có YouTube Data API và RSS/news.
- Vận hành: Docker Compose, Caddy/HTTPS, GitHub Actions CI/CD và VPS.

## 9. Điểm khác biệt so với giải pháp truyền thống

| Cách tiếp cận | Điểm mạnh | Khoảng trống so với Địa Chứng |
|---|---|---|
| Theo dõi và tra cứu hoàn toàn thủ công | Linh hoạt, con người hiểu ngữ cảnh | Chậm, khó ưu tiên và phải ghép nhiều nguồn |
| Cơ sở dữ liệu pháp luật | Nguồn văn bản và tra cứu chuyên sâu | Không chủ động thu thập thảo luận hoặc tạo queue |
| Social listening phổ thông | Thu thập rộng, dashboard và cảnh báo tốt | Thường tập trung mentions/sentiment, không mặc định gắn điều khoản Việt Nam |
| Fact-checking thủ công | Có biên tập và đánh giá ngữ cảnh | Khó mở rộng liên tục thành luồng hồ sơ pháp lý |
| Địa Chứng | Ghép monitoring, kiểm chứng nguồn, legal KG và human review trong một luồng | Phạm vi hẹp, dữ liệu đánh giá nhỏ và chưa chứng minh vận hành quy mô lớn |

## 10. Từ khóa mô tả dự án

Địa Chứng, Legal-KG Dashboard, Legal Radar, GovTech, LegalTech, RegTech,
social monitoring, social listening, misinformation monitoring, fact-checking,
claim extraction, legal knowledge graph, RAG, Knowledge Graph, BM25,
Nghị định 174/2026/NĐ-CP, đơn vị hành chính, sáp nhập tỉnh, tin đồn,
tin sai lệch, nguồn chính thức, source verification, source tiering,
legal citation, căn cứ pháp luật, mức phạt, cá nhân, tổ chức,
human-in-the-loop, decision support, monitoring queue, case management,
risk scoring, Vietnamese NLP, public-sector dashboard, Bright Data,
FastAPI, Next.js, explainable AI, guardrails, OSINT.

## 11. Phân loại sản phẩm theo ngành

- Phân loại chính: **GovTech / RegTech / LegalTech decision-support**.
- Phân loại chức năng: **AI-assisted social monitoring**, **misinformation
  intelligence**, **legal knowledge management** và **case triage**.
- Giai đoạn: **hackathon MVP/prototype**.
- Không đủ căn cứ để phân loại là SaaS thương mại, nền tảng fact-checking đại
  chúng hoặc hệ thống tự động thực thi pháp luật.

## 12. Mô tả ngắn khoảng 200 từ

Địa Chứng là một nguyên mẫu dashboard nội bộ hỗ trợ cơ quan quản lý nhà nước tại
Việt Nam rà soát thông tin sai lệch trên mạng xã hội. MVP tập trung vào tin đồn
sáp nhập đơn vị hành chính và Nghị định 174/2026/NĐ-CP. Hệ thống thu thập hoặc
tiếp nhận nội dung công khai, dùng mô hình ngôn ngữ để tách claim, từ khóa và chủ
thể, rồi đối chiếu với Knowledge Graph pháp luật, FactRef và nguồn tin được phân
tầng.

Mỗi nội dung được đưa vào hàng đợi với một trong ba nhãn `Đúng`, `Hiểu lầm` hoặc
`Cần kiểm chứng`, kèm lý do, trích dẫn, điều khoản, mức phạt tham chiếu và mức ưu
tiên. Dashboard cung cấp tổng quan, hàng đợi, hồ sơ chi tiết, báo cáo và biểu diễn
quan hệ Knowledge Graph. Người dùng có thể đổi trạng thái xử lý, nhưng quyết định
cuối cùng vẫn thuộc về chuyên viên.

Sản phẩm khác social listening thông thường ở lớp đối chiếu pháp lý và khác công
cụ tra cứu luật ở khả năng chủ động tạo luồng hồ sơ từ thảo luận trực tuyến. Tuy
nhiên, dự án chưa có mô hình kinh doanh, khách hàng pilot, benchmark độc lập,
RBAC, audit log hoặc bằng chứng vận hành production.

## 13. Mô tả chi tiết khoảng 800–1500 từ

Địa Chứng được xây dựng từ một bài toán kết hợp giữa theo dõi thảo luận trực
tuyến và tra cứu pháp lý. Trong quy trình thủ công được mô tả bởi team, một
chuyên viên phải chuyển qua nhiều công cụ: tìm bài viết, đọc và tách phát ngôn,
kiểm tra xem thông tin đã được cơ quan nào xác nhận hoặc bác bỏ, xác định văn bản
đang có hiệu lực, tìm đúng điều khoản và kiểm tra mức phạt áp dụng cho cá nhân
hay tổ chức. Địa Chứng cố gắng đưa các bước này vào một luồng dữ liệu duy nhất,
với mục tiêu tạo hồ sơ để người có thẩm quyền rà soát thay vì để AI tự ra quyết
định.

Phạm vi sản phẩm đã thay đổi trong quá trình hackathon. Một số plan cũ mô tả hệ
thống giám sát vi phạm mạng xã hội trên nhiều chủ đề, nhưng product brief mới hơn
thu hẹp MVP vào tin đồn sáp nhập đơn vị hành chính. Đây là phạm vi phù hợp nhất
để mô tả hiện tại vì prompt trích xuất, bộ lọc từ khóa, FactRef và dữ liệu đánh
giá đều tập trung vào số lượng tỉnh, mô hình chính quyền địa phương, tin đồn sáp
nhập tiếp và nội dung giả mạo thông báo hành chính. Căn cứ pháp lý chính là Nghị
định 174/2026/NĐ-CP, cùng dữ liệu quan hệ thay thế văn bản cũ và một số nguồn
tham chiếu về ĐVHC.

Ở đầu vào, repo có crawler Facebook sử dụng Bright Data Discover để tìm URL theo
từ khóa và Bright Data Scraper để lấy nội dung, tác giả, thời gian, tương tác và
bình luận. Code cũng có connector YouTube và RSS/news. Tuy nhiên, product brief
gọi Facebook là phạm vi MVP, nên YouTube và news nên được coi là connector đã có
trong code nhưng chưa được chứng minh là phạm vi vận hành chính thức. Người dùng
cũng có thể nhập một nội dung bằng form hoặc tải CSV/JSON/TXT. Nhập đơn gọi API
phân tích; import file hiện chủ yếu tạo hồ sơ cục bộ trong phiên trình duyệt.

Nội dung sau khi làm sạch được chuyển tới lớp trích xuất. Một LLM tạo cấu trúc
gồm claim, từ khóa và loại chủ thể. Backend có adapter cho TokenRouter, Gemini,
Groq và OpenRouter, với cơ chế thử provider thay thế nếu provider trước lỗi.
Prompt coi nội dung mạng xã hội là dữ liệu không đáng tin và yêu cầu bỏ qua chỉ
dẫn nằm trong nội dung. Nếu LLM lỗi hoặc trả JSON không hợp lệ sau số lần thử
quy định, pipeline không loại bỏ mục đó và cũng không đoán; mục được đưa về nhãn
`Cần kiểm chứng`.

Legal engine kết hợp logic xác định bằng rule với truy hồi từ Knowledge Graph.
KG biểu diễn văn bản, điều khoản, hành vi, chủ thể, mức phạt, biện pháp và cạnh
quan hệ. Engine chuẩn hóa tiếng Việt và slang, dùng keyword/BM25 để tìm điều
khoản, nhận diện số tiền và chủ thể, kiểm tra tham chiếu đến quy định cũ, rồi tạo
nhãn, lý do và citation. FactRef bổ sung các sự thật có nguồn cho phạm vi ĐVHC.
Thiết kế đặc biệt chú ý việc không gán mức phạt của tổ chức cho cá nhân và việc
không dùng văn bản đã hết hiệu lực như căn cứ hiện hành.

Kiểm chứng nguồn là lớp độc lập với legal engine. Implementation hiện ưu tiên
Bright Data Discover để tìm trên whitelist domain cơ quan nhà nước và báo chí,
sau đó phân nguồn thành Tier 0, 1 hoặc 2. Fusion rules coi một nguồn Tier 0 hoặc
ít nhất hai nguồn Tier 1/2 xác nhận là đủ điều kiện; trường hợp bác bỏ còn xét
thứ tự thời gian. Repo có hàm Gemini/Google Search grounding dự phòng, nhưng hàm
này hiện chưa được gọi từ luồng `search_brightdata()`. Điểm cần thận trọng khác
là mapping kết quả tìm kiếm hiện đánh dấu kết quả trên domain tin cậy là xác
nhận mà chưa phân tích entailment hoặc contradiction; route crawl streaming còn
bỏ qua source search để giảm thời gian. Vì vậy câu “mọi hồ sơ đều được kiểm
chứng độc lập” chưa đúng với mọi đường chạy hiện tại.

Sau phân loại, hệ thống tạo `QueueItem` gồm nội dung gốc, claim, nhãn, nguồn,
điều khoản, chủ thể, mức phạt, reach, trạng thái và các điểm số. `Spread Risk`
dựa trên nhãn, reach, lời kêu gọi hành động và khoảng trống nguồn. Trường có tên
`AI Accuracy` thực chất là điểm heuristic ghép từ BM25, độ khớp số tiền, chủ thể,
citation và study case; nó không phải accuracy đo trên tập độc lập. Tương tự,
`Source Reliability` là một scoring rule. Các tên này cần được làm rõ trước khi
dùng trong tài liệu bán hàng hoặc báo cáo hiệu năng.

Frontend tổ chức công việc thành tổng quan thị trường, hàng đợi, báo cáo, danh
sách nguồn, tầng kiểm chứng và Knowledge Graph. Dashboard tính KPI, xu hướng và
heatmap từ queue; hàng đợi hỗ trợ lọc theo nhãn, trạng thái và mức ưu tiên; hồ sơ
chi tiết cho thấy nội dung gốc, bình luận, kết quả AI, nguồn và căn cứ pháp luật.
Người dùng có thể chuyển trạng thái giữa `Mới`, `Đang xử lý` và `Đã xử lý`.
Knowledge Graph trên giao diện là một projection bốn node từ hồ sơ, không phải
một giao diện truy vấn graph database độc lập. Báo cáo cũng được tính phía
frontend thay vì từ một report service riêng.

Biên an toàn được thể hiện qua hệ nhãn đóng và nguyên tắc “chưa tìm thấy nguồn
không có nghĩa là sai”. Không có nhãn `vi phạm`; sản phẩm chỉ gợi ý cách hiểu
claim và căn cứ để chuyên viên xem xét. Pipeline hiện gọi guardrail kiểm tra nhãn
và prompt injection. Helper ẩn một số dạng PII đã có và có unit test, nhưng chưa
được gọi trong luồng ingest production; dữ liệu crawler vẫn có thể chứa metadata
tác giả. Đây là điểm định vị quan trọng vì đầu ra có thể liên quan đến quyết định
hành chính có tác động cao. Dù vậy, repo chưa có authentication, RBAC, audit
trail, chính sách retention, quy trình khiếu nại hay cơ chế kiểm định pháp lý
production.

Dữ liệu đánh giá hiện gồm 45 bình luận fixture, 14 eval case, 3 study case và
một tập FactRef nhỏ. Những tài sản này hữu ích để xây kiểm tra regression cho
MVP nhưng chưa đủ chứng minh độ chính xác ngoài thực tế; tại thời điểm khảo sát,
script smoke của eval còn không tương thích với kiểu trả về hiện tại của engine.
Repo cũng chưa có confusion matrix được duy trì như chỉ số sản phẩm,
precision/recall/F1 trên tập độc lập, đánh giá sai dương tính theo nhóm nội dung
hoặc thử nghiệm với chuyên viên thật.

Về cạnh tranh, Địa Chứng nằm giữa social listening, misinformation intelligence
và legal AI. Các nền tảng social listening có lợi thế về độ phủ dữ liệu, cảnh
báo và vận hành enterprise; các nền tảng legal research có lợi thế về kho nội
dung và quy trình chuyên môn; các sản phẩm narrative intelligence mạnh về phát
hiện chiến dịch thông tin. Giả thuyết khác biệt của Địa Chứng là lớp nối riêng
cho pháp luật Việt Nam: từ tín hiệu mạng xã hội đến claim, điều khoản, nguồn và
hàng đợi human review. Giả thuyết này hợp lý về mặt kiến trúc nhưng chưa được
chứng minh bằng win/loss analysis, pilot hoặc benchmark với sản phẩm hiện hữu.

## Thông tin dành cho AI nghiên cứu đối thủ

### Dự án thuộc lĩnh vực gì

GovTech, RegTech, LegalTech, social monitoring, misinformation intelligence,
legal decision-support, public-sector case triage và Vietnamese legal knowledge
management.

### Các từ khóa tiếng Việt

giám sát mạng xã hội, lắng nghe mạng xã hội, tin sai lệch, tin giả, tin đồn,
kiểm chứng thông tin, sáp nhập đơn vị hành chính, giám sát thông tin công khai,
Knowledge Graph pháp luật, RAG pháp lý, căn cứ pháp luật, trích dẫn điều khoản,
Nghị định 174/2026, phân loại claim, nguồn chính thức, phân tầng nguồn, mức phạt
cá nhân tổ chức, hàng đợi giám sát, hỗ trợ ra quyết định, cán bộ quản lý,
giám sát truyền thông, xử lý khủng hoảng thông tin, NLP tiếng Việt.

### Các từ khóa tiếng Anh

government social listening, public-sector social monitoring, misinformation
monitoring, disinformation intelligence, narrative intelligence, legal
knowledge graph, legal RAG, claim verification, fact-checking workflow, legal
citation retrieval, regulatory intelligence, government decision support,
human-in-the-loop moderation, content risk triage, source credibility,
authoritative source verification, Vietnamese NLP, social media OSINT,
case management dashboard, online harms monitoring, public discourse analysis.

### Các sản phẩm có khả năng là đối thủ

Các tên dưới đây là ứng viên so sánh theo năng lực chồng lấn:

| Nhóm | Sản phẩm/công ty | Lý do cần nghiên cứu | Khoảng cách đã thấy |
|---|---|---|---|
| Gần nhất tại Việt Nam | [VnSocial — VNPT](https://vnpt.com.vn/tu-van/vnsocial-giai-phap-lang-nghe-va-giam-sat-mang-xa-hoi-cua-tuong-lai.html) | Thu thập, phân tích, cảnh báo và phân loại nội dung nhạy cảm; VNPT công bố triển khai cho nhiều cơ quan chính quyền | Chưa thấy nguồn công khai chứng minh workflow legal KG cấp điều khoản giống Địa Chứng |
| Gần nhất tại Việt Nam | [Reputa — Viettel](https://solutions.viettel.vn/vi/vi/cong-nghe-thong-tin/he-thong-giam-sat-danh-tieng-va-thong-tin-truc-tuyen-reputa.html) | Giám sát và phân tích báo chí, diễn đàn, blog, Facebook, YouTube; có use case cho chính quyền | Định vị rộng về danh tiếng/thông tin, chưa thấy lớp reasoning NĐ 174 công khai |
| Social listening Việt Nam | [SocialHeat — Buzzmetrics/YouNet](https://www.buzzmetrics.com/social-listening) | Thu thập, phân loại và phân tích thảo luận đa nền tảng | Trọng tâm công khai là market/consumer insight, không phải hồ sơ pháp lý |
| Social listening Việt Nam | [Kompa](https://kompa.ai/) | Monitoring đa kênh, cảnh báo, sentiment, topic, trend và crisis management | Trọng tâm thương hiệu/truyền thông; legal grounding không phải năng lực công khai chính |
| Social listening quốc tế | [Brandwatch Consumer Research](https://www.brandwatch.com/products/consumer-research/) | Độ phủ dữ liệu lớn, AI classifiers, alert và consumer intelligence | Không chuyên biệt cho pháp luật Việt Nam |
| Social listening quốc tế | [Meltwater Social Listening](https://www.meltwater.com/en/capabilities/social-listening) | Theo dõi social/news/forum, phát hiện rủi ro, dashboard và báo cáo | Thiên về media/brand intelligence |
| Social listening quốc tế | [Lumen by Talkwalker](https://www.talkwalker.com/products/social-listening) | Theo dõi đa phương tiện, misinformation alert và phân tích virality | Chưa thấy workflow căn cứ pháp lý Việt Nam |
| Narrative intelligence | [Logically Intelligence](https://logically.ai/products/logically-intelligence) | Theo dõi narrative, clustering, alert và threat detection cho rủi ro thông tin | Khác hệ thống luật và thị trường ngôn ngữ |
| Trust & Safety | [ActiveFence](https://www.activefence.com/solutions/content-moderation-platform/) | Moderation, threat intelligence và phát hiện nội dung gây hại ở quy mô nền tảng | Buyer và mục tiêu là platform safety, không phải cán bộ tra căn cứ xử phạt |
| Legal AI | [CoCounsel — Thomson Reuters](https://www.thomsonreuters.com/en/cocounsel) | Legal research và workflow có nguồn, human oversight | Không phải social crawler và không chuyên luật Việt Nam |
| Legal AI | [Lexis+ — LexisNexis](https://www.lexisnexis.com/en-int/products/lexis-plus) | Legal research, drafting, analytics và nội dung pháp lý được tuyển chọn | Không phải hệ thống giám sát tin đồn |

### Các công ty có thể cạnh tranh

VNPT, Viettel, Buzzmetrics/YouNet Group, Kompa, Brandwatch, Meltwater,
Hootsuite/Talkwalker, Logically, ActiveFence, Thomson Reuters và LexisNexis.
Danh sách này phản ánh năng lực chồng lấn, không khẳng định tất cả cùng tham gia
một phân khúc mua sắm tại Việt Nam.

### Những giải pháp thay thế trực tiếp

- VnSocial hoặc Reputa được cấu hình cho chủ đề quản lý nhà nước, kết hợp một
  quy trình tra cứu pháp luật riêng.
- Một nền tảng social listening hiện có kết nối nhóm pháp chế/chuyên viên qua
  ticket, spreadsheet hoặc hệ thống quản lý hồ sơ.
- Dịch vụ giám sát truyền thông thuê ngoài kết hợp chuyên gia pháp lý thực hiện
  kiểm chứng và lập báo cáo.
- Hệ thống nội bộ của cơ quan: crawler/alert theo từ khóa + kho văn bản + quy
  trình phê duyệt thủ công.

### Những giải pháp thay thế gián tiếp

- Tìm kiếm thủ công trên Facebook, YouTube, Google và các báo điện tử.
- Google Alerts hoặc công cụ media monitoring cơ bản.
- Cổng văn bản Chính phủ, cơ sở dữ liệu pháp luật và thư viện pháp lý.
- Spreadsheet, email, chat nội bộ và phần mềm ticket/case management.
- LLM đa dụng kết hợp prompt nội bộ, nhưng không có KG và governance riêng.
- Đội fact-checking, truyền thông hoặc pháp chế làm toàn bộ quy trình bằng người.

### Những thị trường mà sản phẩm đang hướng tới

Thị trường có bằng chứng trong repo là Việt Nam, phân khúc cơ quan quản lý nhà
nước cần theo dõi thông tin công khai và rà soát căn cứ pháp lý. Use case hiện
hành là tin đồn sáp nhập đơn vị hành chính. Chưa có bằng chứng rằng sản phẩm đang
nhắm tới doanh nghiệp tư nhân, người dùng đại chúng, thị trường quốc tế hoặc các
lĩnh vực pháp luật khác.

## Dữ liệu còn thiếu cần bổ sung

- Kết quả customer discovery, chức danh buyer, budget owner và quy trình mua sắm.
- Pricing, mô hình license/dịch vụ, chi phí triển khai và hỗ trợ.
- Baseline quy trình thủ công, ROI và thời gian xử lý trước/sau.
- TAM/SAM/SOM hoặc ít nhất số cơ quan/seat mục tiêu.
- Danh sách connector chính thức của MVP và quyền khai thác dữ liệu từng nền tảng.
- Benchmark precision, recall, F1, false-positive và false-negative trên tập độc lập.
- Định nghĩa nghiệp vụ thống nhất cho ba nhãn, đặc biệt nhãn `Đúng`: đúng về sự
  kiện, đúng về phát biểu pháp lý hay đúng về mức phạt.
- Tỷ lệ chuyên viên đồng ý, sửa hoặc bác bỏ nhãn AI.
- Quy trình cập nhật KG, kiểm định văn bản và trách nhiệm chuyên gia pháp lý.
- Authentication, RBAC, audit log, retention, data residency, khiếu nại và xóa dữ liệu.
- Kiến trúc deployment thương mại: on-premise, single-tenant hay dịch vụ dùng chung.
- SLA, uptime, RTO/RPO, quota và chi phí API/crawler.
- Pilot, người dùng thật, DAU/MAU, số hồ sơ xử lý và bằng chứng traction.
- Win/loss interview và benchmark tính năng/giá với VnSocial, Reputa và các ứng viên khác.

## Nguồn nội bộ chính

- [README dự án](../../README.md)
- [Product Brief](../pitch/PRODUCT_BRIEF.md)
- [Kịch bản pitch](../pitch/README.md)
- [Kịch bản demo](../demo/README.md)
- [Định nghĩa dashboard metrics](../METRICS.md)
- [Kiến trúc thư mục](../../.kilo/plans/1784277271023-project-folder-architecture.md)
- [Plan thu hẹp phạm vi ĐVHC](../../.kilo/plans/1784345997023-scope-admin-merger-rumors.md)
