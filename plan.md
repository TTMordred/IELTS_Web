# PLAN: IELTS Planner - Web Sheet Style

**Mục tiêu chính**:  
Làm planner giống hệt Google Sheet bạn share, nhưng cập nhật theo yêu cầu mới.

**Phạm vi hiện tại**: Weekly Planner (đang focus)

## 1. Weekly Planner (đang focus)

**Cấu trúc mới (đã bỏ 3 slot)**:
- Grid 7 ngày (Mon-Sun) x 1 cột module
- Mỗi ô là **dropdown select** để chọn module (Listening, Reading, Speaking, Writing, Grammar, Vocab)
- Không có mặc định là Listening
- Có thể click và **thêm module khác** vào ô (thêm cột module)
- Mỗi module có topic + duration + checkbox Completed
- Navigation (This Week / Next Week)
- Empty state
- Toast notification
- **Google Calendar Integration**:
  - Lấy event hôm nay từ Google Calendar
  - Hiển thị thông báo “Hôm nay sẽ làm gì” ở header
  - Có thể sync calendar vào planner

**Module list** (select):
- Listening
- Reading
- Speaking
- Writing
- Grammar
- Vocab

**Tính năng khác**:
- Color theo module (giống sheet)
- Lưu vào Supabase
- Responsive

## 2. Month Planner (sau Weekly)

- 4 tuần x 7 ngày
- Giữ nguyên layout select module + topic + completed
- Navigation giữa 4 tuần
- Copy ngày / Copy tuần

**Design System**:
- Accent: `#1B4D3E`
- Header: “My Planner” + Google Calendar status

**Order ưu tiên**:
1. Weekly Planner (bỏ slot, thêm select module, thêm Google Calendar)
2. Sau khi xong → Làm Month Planner

**Tech**:
- Next.js 15
- Supabase
- Tailwind + shadcn
- Google Calendar API (OAuth)

Tôi đã ghi lại `plan.md` với thay đổi mới: **bỏ mặc định Listening**, chỉ là kiểu mình có thể chọn trong select ấy.