"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export const LINE_LANGS = ["ja", "en", "es", "pt", "ko", "zh"] as const;
export type LineLang = (typeof LINE_LANGS)[number];

export function normalizeLineLang(lang: string): LineLang {
  if (!lang) return "ja";
  const lower = lang.toLowerCase();
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("zh")) return "zh";
  if (lower.startsWith("en")) return "en";
  return "ja";
}

type Messages = Record<string, Partial<Record<LineLang, string>>>;

// LINE LIFF customer app strings (single source of truth)
const messages: Messages = {
  // Global / common
  appName: { ja: "YoyakuYo", en: "YoyakuYo", es: "YoyakuYo", pt: "YoyakuYo", ko: "YoyakuYo", zh: "YoyakuYo" },
  language: { ja: "言語", en: "Language", es: "Idioma", pt: "Idioma", ko: "언어", zh: "语言" },
  back: { ja: "戻る", en: "Back", es: "Volver", pt: "Voltar", ko: "뒤로", zh: "返回" },
  close: { ja: "閉じる", en: "Close", es: "Cerrar", pt: "Fechar", ko: "닫기", zh: "关闭" },
  cancel: { ja: "キャンセル", en: "Cancel", es: "Cancelar", pt: "Cancelar", ko: "취소", zh: "取消" },
  loading: { ja: "読み込み中...", en: "Loading...", es: "Cargando...", pt: "Carregando...", ko: "로딩 중...", zh: "加载中..." },
  error: { ja: "エラー", en: "Error", es: "Error", pt: "Erro", ko: "오류", zh: "错误" },
  retry: { ja: "再試行", en: "Retry", es: "Reintentar", pt: "Tentar novamente", ko: "다시 시도", zh: "重试" },

  // Bottom nav
  nav_search: { ja: "検索", en: "Search", es: "Buscar", pt: "Buscar", ko: "검색", zh: "搜索" },
  nav_booking: { ja: "予約", en: "Bookings", es: "Reservas", pt: "Reservas", ko: "예약", zh: "预约" },
  nav_inbox: { ja: "受信箱", en: "Inbox", es: "Bandeja", pt: "Caixa", ko: "받은편지함", zh: "收件箱" },
  nav_ai: { ja: "AI", en: "AI", es: "IA", pt: "IA", ko: "AI", zh: "AI" },
  nav_favorites: { ja: "保存", en: "Saved", es: "Guardado", pt: "Salvo", ko: "저장", zh: "已保存" },

  // Home tabs/cards
  bookingsTitle: { ja: "予約", en: "Bookings", es: "Reservas", pt: "Reservas", ko: "예약", zh: "预约" },
  bookingsSubtitle: {
    ja: "あなたの予約を確認・管理できます。",
    en: "View and manage your bookings.",
    es: "Ver y gestionar tus reservas.",
    pt: "Veja e gerencie suas reservas.",
    ko: "예약을 확인하고 관리하세요.",
    zh: "查看并管理您的预约。",
  },
  bookingsButton: { ja: "予約を見る", en: "View bookings", es: "Ver reservas", pt: "Ver reservas", ko: "예약 보기", zh: "查看预约" },
  inboxTitle: { ja: "受信箱", en: "Inbox", es: "Bandeja de entrada", pt: "Caixa de entrada", ko: "받은편지함", zh: "收件箱" },
  inboxSubtitle: {
    ja: "店舗とのメッセージを確認できます。",
    en: "View messages with shops.",
    es: "Ver mensajes con tiendas.",
    pt: "Veja mensagens com lojas.",
    ko: "매장과의 메시지를 확인하세요.",
    zh: "查看与店铺的消息。",
  },
  inboxButton: { ja: "受信箱を開く", en: "Open inbox", es: "Abrir bandeja", pt: "Abrir caixa", ko: "받은편지함 열기", zh: "打开收件箱" },
  favoritesTitle: { ja: "保存したお店", en: "Saved Shops", es: "Tiendas guardadas", pt: "Lojas salvas", ko: "저장된 가게", zh: "已保存的店铺" },
  favoritesSubtitle: {
    ja: "お気に入りの店舗を保存できます。",
    en: "Save your favorite shops.",
    es: "Guarda tus tiendas favoritas.",
    pt: "Salve suas lojas favoritas.",
    ko: "좋아하는 가게를 저장하세요.",
    zh: "保存您喜欢的店铺。",
  },
  favoritesButton: { ja: "保存したお店を見る", en: "View saved shops", es: "Ver guardadas", pt: "Ver salvas", ko: "저장 목록", zh: "查看已保存" },

  aiTitle: { ja: "AIアシスタント", en: "AI Assistant", es: "Asistente IA", pt: "Assistente IA", ko: "AI 어시스턴트", zh: "AI 助手" },
  aiSubtitle: {
    ja: "ここでAIチャットを開いて、店舗探しや予約の質問ができます。",
    en: "Chat here for shop search and booking help.",
    es: "Chatea aquí para buscar tiendas y ayuda con reservas.",
    pt: "Converse aqui para buscar lojas e ajuda com reservas.",
    ko: "여기에서 채팅으로 매장 검색과 예약 도움을 받을 수 있어요.",
    zh: "在此聊天以搜索店铺并获得预约帮助。",
  },
  aiTryAsking: {
    ja: "例えば：",
    en: "Try asking:",
    es: "Prueba a preguntar:",
    pt: "Tente perguntar:",
    ko: "예시:",
    zh: "试着问：",
  },
  aiPlaceholder: {
    ja: "お店について質問してみてください...",
    en: "Ask me about shops...",
    es: "Pregúntame sobre tiendas...",
    pt: "Pergunte sobre lojas...",
    ko: "매장에 대해 물어보세요...",
    zh: "问我关于店铺的问题...",
  },
  aiSend: { ja: "送信", en: "Send", es: "Enviar", pt: "Enviar", ko: "보내기", zh: "发送" },
  send: { ja: "送信", en: "Send", es: "Enviar", pt: "Enviar", ko: "보내기", zh: "发送" },
  sending: { ja: "送信中...", en: "Sending...", es: "Enviando...", pt: "Enviando...", ko: "전송 중...", zh: "发送中..." },

  // Search UI (home)
  searchPlaceholder: {
    ja: "店舗名、場所で検索...",
    en: "Search shops by name, location...",
    es: "Buscar tiendas por nombre o ubicación...",
    pt: "Buscar lojas por nome ou localização...",
    ko: "상호명이나 위치로 매장을 검색하세요...",
    zh: "按店名或位置搜索店铺...",
  },
  searchButton: { ja: "検索", en: "Search", es: "Buscar", pt: "Buscar", ko: "검색", zh: "搜索" },
  noShops: {
    ja: "該当する店舗が見つかりませんでした。",
    en: "No shops found.",
    es: "No se encontraron tiendas.",
    pt: "Nenhuma loja encontrada.",
    ko: "매장을 찾을 수 없습니다.",
    zh: "未找到店铺。",
  },
  bookNow: { ja: "予約する", en: "Book now", es: "Reservar", pt: "Reservar", ko: "예약하기", zh: "预约" },

  // Favorites page
  savedShopsTitle: { ja: "保存したお店", en: "Saved Shops", es: "Tiendas guardadas", pt: "Lojas salvas", ko: "저장된 가게", zh: "已保存的店铺" },
  noSavedShops: {
    ja: "まだ保存したお店がありません。",
    en: "You have not saved any shops yet.",
    es: "Todavía no has guardado ninguna tienda.",
    pt: "Você ainda não salvou nenhuma loja.",
    ko: "아직 저장한 가게가 없습니다.",
    zh: "您还没有保存任何店铺。",
  },
  browseShops: { ja: "お店を探す", en: "Browse shops", es: "Buscar tiendas", pt: "Procurar lojas", ko: "가게 찾기", zh: "浏览店铺" },

  // Booking list page
  myBookings: { ja: "予約一覧", en: "My Bookings", es: "Mis reservas", pt: "Minhas reservas", ko: "내 예약", zh: "我的预约" },
  bookingSuccess: {
    ja: "✅ 予約が完了しました！",
    en: "✅ Booking confirmed successfully!",
    es: "✅ ¡Reserva confirmada!",
    pt: "✅ Reserva confirmada!",
    ko: "✅ 예약이 완료되었습니다!",
    zh: "✅ 预约已确认！",
  },
  apiUrlNotConfigured: {
    ja: "APIの設定がありません。",
    en: "API URL not configured.",
    es: "URL de API no configurada.",
    pt: "URL da API não configurada.",
    ko: "API URL이 설정되지 않았습니다.",
    zh: "未配置 API URL。",
  },
  lineAppNotAvailable: {
    ja: "LINEアプリで開いてください。",
    en: "Please open this in the LINE app.",
    es: "Ábrelo en la app de LINE.",
    pt: "Abra no app do LINE.",
    ko: "LINE 앱에서 열어주세요.",
    zh: "请在 LINE 应用内打开。",
  },
  failedToVerifyLineUser: {
    ja: "LINEユーザーの確認に失敗しました。",
    en: "Failed to verify LINE user.",
    es: "No se pudo verificar el usuario de LINE.",
    pt: "Falha ao verificar usuário LINE.",
    ko: "LINE 사용자 확인에 실패했습니다.",
    zh: "验证 LINE 用户失败。",
  },
  pleaseProvideRatingAndReview: {
    ja: "評価とレビュー内容の両方を入力してください。",
    en: "Please provide both a rating and review content.",
    es: "Por favor, proporciona una calificación y el contenido de la reseña.",
    pt: "Por favor, forneça uma avaliação e o conteúdo da avaliação.",
    ko: "평점과 리뷰 내용을 모두 입력해 주세요.",
    zh: "请同时提供评分和评价内容。",
  },
  shopInfoMissing: {
    ja: "店舗情報がありません。もう一度お試しください。",
    en: "Shop information is missing. Please try again.",
    es: "Falta la información de la tienda. Inténtalo de nuevo.",
    pt: "As informações da loja estão ausentes. Tente novamente.",
    ko: "매장 정보가 없습니다. 다시 시도해 주세요.",
    zh: "店铺信息缺失，请重试。",
  },
  userIdentificationFailed: {
    ja: "ユーザーの識別に失敗しました。もう一度お試しください。",
    en: "User identification failed. Please try again.",
    es: "Falló la identificación del usuario. Inténtalo de nuevo.",
    pt: "Falha na identificação do usuário. Tente novamente.",
    ko: "사용자 확인에 실패했습니다. 다시 시도해 주세요.",
    zh: "用户识别失败，请重试。",
  },
  reviewSubmittedSuccess: {
    ja: "レビューを送信しました。ありがとうございます！",
    en: "Review submitted successfully! Thank you for your feedback.",
    es: "¡Reseña enviada con éxito! Gracias por tus comentarios.",
    pt: "Avaliação enviada com sucesso! Obrigado pelo seu feedback.",
    ko: "리뷰가 등록되었습니다. 감사합니다!",
    zh: "评价提交成功！感谢反馈。",
  },
  confirmCancelBooking: {
    ja: "この予約をキャンセルしますか？",
    en: "Are you sure you want to cancel this booking?",
    es: "¿Estás seguro de que quieres cancelar esta reserva?",
    pt: "Tem certeza de que deseja cancelar esta reserva?",
    ko: "이 예약을 취소하시겠습니까?",
    zh: "确定要取消此预约吗？",
  },
  bookingCancelledSuccess: {
    ja: "予約をキャンセルしました。",
    en: "Booking cancelled successfully.",
    es: "Reserva cancelada con éxito.",
    pt: "Reserva cancelada com sucesso.",
    ko: "예약이 취소되었습니다.",
    zh: "预约已取消。",
  },
  failedToCancelBooking: {
    ja: "予約のキャンセルに失敗しました。",
    en: "Failed to cancel booking.",
    es: "No se pudo cancelar la reserva.",
    pt: "Falha ao cancelar a reserva.",
    ko: "예약 취소에 실패했습니다.",
    zh: "取消预约失败。",
  },
  bookingDetailsTitle: { ja: "予約の詳細", en: "Booking Details", es: "Detalles de la reserva", pt: "Detalhes da reserva", ko: "예약 상세", zh: "预约详情" },
  bookingDetailsShop: { ja: "店舗", en: "Shop", es: "Tienda", pt: "Loja", ko: "매장", zh: "店铺" },
  bookingDetailsService: { ja: "サービス", en: "Service", es: "Servicio", pt: "Serviço", ko: "서비스", zh: "服务" },
  bookingDetailsStatus: { ja: "ステータス", en: "Status", es: "Estado", pt: "Status", ko: "상태", zh: "状态" },
  bookingIdLabel: { ja: "予約ID", en: "Booking ID", es: "ID de reserva", pt: "ID da reserva", ko: "예약 ID", zh: "预约ID" },
  unknown: { ja: "不明", en: "N/A", es: "N/D", pt: "N/D", ko: "없음", zh: "无" },

  // Messages
  messagesTitle: { ja: "メッセージ", en: "Messages", es: "Mensajes", pt: "Mensagens", ko: "메시지", zh: "消息" },
  inboxTitleShort: { ja: "受信箱", en: "Inbox", es: "Bandeja", pt: "Caixa", ko: "받은편지함", zh: "收件箱" },
  conversationsTitle: { ja: "会話", en: "Conversations", es: "Conversaciones", pt: "Conversas", ko: "대화", zh: "会话" },
  selectConversation: { ja: "会話を選択", en: "Select a conversation", es: "Selecciona una conversación", pt: "Selecione uma conversa", ko: "대화를 선택하세요", zh: "选择会话" },
  noConversationsYet: { ja: "会話がありません。", en: "No conversations yet.", es: "Aún no hay conversaciones.", pt: "Ainda não há conversas.", ko: "대화가 없습니다.", zh: "暂无会话。" },
  loadingMessages: {
    ja: "メッセージを読み込み中...",
    en: "Loading messages...",
    es: "Cargando mensajes...",
    pt: "Carregando mensagens...",
    ko: "메시지 불러오는 중...",
    zh: "正在加载消息...",
  },
  noMessagesYet: {
    ja: "まだメッセージがありません。会話を始めましょう。",
    en: "No messages yet. Start the conversation!",
    es: "Aún no hay mensajes. ¡Empieza la conversación!",
    pt: "Ainda não há mensagens. Comece a conversa!",
    ko: "아직 메시지가 없습니다. 대화를 시작해보세요!",
    zh: "暂无消息。开始对话吧！",
  },
  typeMessage: {
    ja: "メッセージを入力...",
    en: "Type a message...",
    es: "Escribe un mensaje...",
    pt: "Digite uma mensagem...",
    ko: "메시지 입력...",
    zh: "输入消息...",
  },

  // Shop detail labels
  shopNotFound: { ja: "店舗が見つかりません。", en: "Shop not found.", es: "Tienda no encontrada.", pt: "Loja não encontrada.", ko: "매장을 찾을 수 없습니다.", zh: "未找到店铺。" },
  addressLabel: { ja: "住所", en: "Address", es: "Dirección", pt: "Endereço", ko: "주소", zh: "地址" },
  phoneLabel: { ja: "電話", en: "Phone", es: "Teléfono", pt: "Telefone", ko: "전화", zh: "电话" },
  descriptionLabel: { ja: "説明", en: "Description", es: "Descripción", pt: "Descrição", ko: "설명", zh: "描述" },
  bookAppointment: {
    ja: "予約する",
    en: "Book an Appointment",
    es: "Reservar una cita",
    pt: "Reservar um horário",
    ko: "예약하기",
    zh: "预约",
  },
  shopNotVerified: {
    ja: "この店舗はまだ認証されていません。",
    en: "This shop is not yet verified.",
    es: "Esta tienda aún no está verificada.",
    pt: "Esta loja ainda não foi verificada.",
    ko: "이 매장은 아직 인증되지 않았습니다.",
    zh: "该店铺尚未验证。",
  },
  bookingsAvailableOnceClaimed: {
    ja: "この店舗がオーナーに紐づくと予約できるようになります。",
    en: "Bookings will be available once this shop is claimed.",
    es: "Las reservas estarán disponibles cuando esta tienda sea reclamada.",
    pt: "As reservas estarão disponíveis quando esta loja for reivindicada.",
    ko: "이 매장이 등록되면 예약이 가능합니다.",
    zh: "店铺被认领后即可预约。",
  },
  noServicesAvailable: {
    ja: "利用可能なサービスがありません。",
    en: "No services available.",
    es: "No hay servicios disponibles.",
    pt: "Nenhum serviço disponível.",
    ko: "사용 가능한 서비스가 없습니다.",
    zh: "暂无可用服务。",
  },
  selectService: {
    ja: "サービスを選択",
    en: "Select Service",
    es: "Seleccionar servicio",
    pt: "Selecionar serviço",
    ko: "서비스 선택",
    zh: "选择服务",
  },
  chooseService: {
    ja: "サービスを選択してください",
    en: "Choose a service",
    es: "Elige un servicio",
    pt: "Escolha um serviço",
    ko: "서비스를 선택하세요",
    zh: "请选择服务",
  },
  durationLabel: { ja: "所要時間", en: "Duration", es: "Duración", pt: "Duração", ko: "소요 시간", zh: "时长" },
  minutes: { ja: "分", en: "minutes", es: "minutos", pt: "minutos", ko: "분", zh: "分钟" },
  priceLabel: { ja: "料金", en: "Price", es: "Precio", pt: "Preço", ko: "가격", zh: "价格" },
  selectDate: { ja: "日付を選択", en: "Select Date", es: "Seleccionar fecha", pt: "Selecionar data", ko: "날짜 선택", zh: "选择日期" },
  chooseDate: { ja: "日付を選択してください", en: "Choose a date", es: "Elige una fecha", pt: "Escolha uma data", ko: "날짜를 선택하세요", zh: "请选择日期" },
  selectTime: { ja: "時間を選択", en: "Select Time", es: "Seleccionar hora", pt: "Selecionar horário", ko: "시간 선택", zh: "选择时间" },
  noAvailableTimes: {
    ja: "この日は空きがありません。別の日をお試しください。",
    en: "No available times for this date. Please try another date.",
    es: "No hay horarios disponibles para esta fecha. Prueba otra fecha.",
    pt: "Não há horários disponíveis para esta data. Tente outra data.",
    ko: "이 날짜에는 가능한 시간이 없습니다. 다른 날짜를 선택하세요.",
    zh: "该日期没有可用时间，请选择其他日期。",
  },

  // Reviews
  loadingReviews: {
    ja: "レビューを読み込み中...",
    en: "Loading reviews...",
    es: "Cargando reseñas...",
    pt: "Carregando avaliações...",
    ko: "리뷰 불러오는 중...",
    zh: "正在加载评价...",
  },
  noBookingsYet: {
    ja: "まだ予約がありません。",
    en: "You have no bookings yet.",
    es: "Aún no tienes reservas.",
    pt: "Você ainda não tem reservas.",
    ko: "아직 예약이 없습니다.",
    zh: "您还没有预约。",
  },
  viewDetails: { ja: "詳細", en: "View Details", es: "Ver detalles", pt: "Ver detalhes", ko: "상세 보기", zh: "查看详情" },
  cancelBooking: { ja: "キャンセル", en: "Cancel", es: "Cancelar", pt: "Cancelar", ko: "취소", zh: "取消" },
  cancelling: { ja: "キャンセル中...", en: "Cancelling...", es: "Cancelando...", pt: "Cancelando...", ko: "취소 중...", zh: "正在取消..." },
  messageShop: { ja: "店舗にメッセージ", en: "Message Shop", es: "Enviar mensaje", pt: "Mensagem", ko: "매장에 메시지", zh: "联系店铺" },
  serviceLabel: { ja: "サービス", en: "Service", es: "Servicio", pt: "Serviço", ko: "서비스", zh: "服务" },
  dateLabel: { ja: "日付", en: "Date", es: "Fecha", pt: "Data", ko: "날짜", zh: "日期" },
  timeLabel: { ja: "時間", en: "Time", es: "Hora", pt: "Hora", ko: "시간", zh: "时间" },

  // Status labels
  status_pending: { ja: "保留", en: "Pending", es: "Pendiente", pt: "Pendente", ko: "대기", zh: "待处理" },
  status_confirmed: { ja: "確定", en: "Confirmed", es: "Confirmada", pt: "Confirmada", ko: "확정", zh: "已确认" },
  status_cancelled: { ja: "キャンセル", en: "Cancelled", es: "Cancelada", pt: "Cancelada", ko: "취소", zh: "已取消" },
  status_rejected: { ja: "却下", en: "Rejected", es: "Rechazada", pt: "Rejeitada", ko: "거절", zh: "已拒绝" },
  status_completed: { ja: "完了", en: "Completed", es: "Completada", pt: "Concluída", ko: "완료", zh: "已完成" },

  // Shop detail
  save: { ja: "保存", en: "Save", es: "Guardar", pt: "Salvar", ko: "저장", zh: "保存" },
  saved: { ja: "保存済み", en: "Saved", es: "Guardado", pt: "Salvo", ko: "저장됨", zh: "已保存" },
  bookingSuccessRedirect: {
    ja: "✅ 予約完了！予約一覧に移動します...",
    en: "✅ Booking successful! Redirecting to your bookings...",
    es: "✅ ¡Reserva exitosa! Redirigiendo a tus reservas...",
    pt: "✅ Reserva concluída! Redirecionando...",
    ko: "✅ 예약 성공! 예약 목록으로 이동합니다...",
    zh: "✅ 预约成功！正在跳转到预约列表...",
  },
  confirmBooking: { ja: "予約を確定", en: "Confirm Booking", es: "Confirmar reserva", pt: "Confirmar reserva", ko: "예약 확정", zh: "确认预约" },
  bookingSubmitting: { ja: "予約中...", en: "Booking...", es: "Reservando...", pt: "Reservando...", ko: "예약 중...", zh: "预约中..." },
  selectServiceDateTime: {
    ja: "サービス、日付、時間を選択してください。",
    en: "Please select a service, date, and time.",
    es: "Selecciona servicio, fecha y hora.",
    pt: "Selecione serviço, data e hora.",
    ko: "서비스/날짜/시간을 선택하세요.",
    zh: "请选择服务、日期和时间。",
  },
  loadingTimes: {
    ja: "利用可能な時間を読み込み中...",
    en: "Loading available times...",
    es: "Cargando horarios...",
    pt: "Carregando horários...",
    ko: "가능한 시간 불러오는 중...",
    zh: "正在加载可用时间...",
  },

  // Reviews UI (LINE)
  reviews: { ja: "レビュー", en: "Reviews", es: "Reseñas", pt: "Avaliações", ko: "리뷰", zh: "评价" },
  writeReview: { ja: "レビューを書く", en: "Write Review", es: "Escribir reseña", pt: "Escrever avaliação", ko: "리뷰 작성", zh: "写评价" },
  hideReviews: { ja: "レビューを隠す", en: "Hide Reviews", es: "Ocultar reseñas", pt: "Ocultar avaliações", ko: "리뷰 숨기기", zh: "隐藏评价" },
  rating: { ja: "評価", en: "Rating", es: "Calificación", pt: "Avaliação", ko: "평점", zh: "评分" },
  yourReview: { ja: "レビュー内容", en: "Your review", es: "Tu reseña", pt: "Sua avaliação", ko: "리뷰 내용", zh: "您的评价" },
  submit: { ja: "送信", en: "Submit", es: "Enviar", pt: "Enviar", ko: "제출", zh: "提交" },
  submitting: { ja: "送信中...", en: "Submitting...", es: "Enviando...", pt: "Enviando...", ko: "전송 중...", zh: "提交中..." },
  noReviewsYet: {
    ja: "まだレビューがありません。",
    en: "No reviews yet.",
    es: "Aún no hay reseñas.",
    pt: "Ainda não há avaliações.",
    ko: "아직 리뷰가 없습니다.",
    zh: "暂无评价。",
  },
};

interface LineAppI18nContextValue {
  language: LineLang;
  setLanguage: (lang: LineLang) => void;
  t: (key: keyof typeof messages) => string;
}

const LineAppI18nContext = createContext<LineAppI18nContextValue | null>(null);

export function LineAppI18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LineLang>("ja");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("line_app_language") || "ja";
    setLanguageState(normalizeLineLang(stored));
  }, []);

  const setLanguage = (lang: LineLang) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("line_app_language", lang);
      // Backward-compatible event for any legacy listeners
      window.dispatchEvent(new CustomEvent("lineAppLanguageChanged", { detail: { language: lang } }));
    }
  };

  const t = (key: keyof typeof messages) => {
    const entry = messages[key];
    return entry?.[language] || entry?.en || String(key);
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return <LineAppI18nContext.Provider value={value}>{children}</LineAppI18nContext.Provider>;
}

export function useLineAppI18n() {
  const ctx = useContext(LineAppI18nContext);
  if (!ctx) throw new Error("useLineAppI18n must be used within LineAppI18nProvider");
  return ctx;
}

export function LineAppLanguageSelector() {
  const { language, setLanguage, t } = useLineAppI18n();
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <span className="font-medium">{t("language")}:</span>
      <select
        value={language}
        onChange={(e) => setLanguage(normalizeLineLang(e.target.value))}
        className="border border-gray-300 rounded-md px-2 py-1 bg-white"
      >
        <option value="ja">日本語</option>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="pt">Português</option>
        <option value="ko">한국어</option>
        <option value="zh">中文</option>
      </select>
    </label>
  );
}


